from fastapi import APIRouter, Depends, status, Request, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.target import Target
from app.models.scan import Scan
from app.models.scan_finding import ScanFinding
from app.models.audit_log import AuditLog
from app.schemas.scan import ScanCreateRequest, ScanResponse, ScanDetailResponse, ScanStatusResponse, SeverityCount
from app.schemas.vulnerability import ScanFindingResponse, VulnerabilityResponse, AIAnalysisResponse
from app.services.scan_service import launch_scan_job
from app.core.exceptions import NotFoundException, BadRequestException

router = APIRouter(prefix="/scans", tags=["Vulnerability Scanning"])

def build_severity_breakdown(findings: List[ScanFinding]) -> SeverityCount:
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "informational": 0}
    for f in findings:
        sev = str(f.severity).lower()
        if sev in counts:
            counts[sev] += 1
        else:
            counts["informational"] += 1
    return SeverityCount(
        critical=counts["critical"],
        high=counts["high"],
        medium=counts["medium"],
        low=counts["low"],
        informational=counts["informational"],
        total=len(findings)
    )

@router.post("", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
def create_scan(request: Request, body: ScanCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not body.authorized_confirmation:
        raise BadRequestException("You must explicitly confirm you are authorized to scan this target before proceeding.")

    target = db.query(Target).filter(Target.id == body.target_id, Target.user_id == current_user.id).first()
    if not target:
        raise NotFoundException("Target not found or not owned by your account")

    # Prevent concurrent active scans if one is already running
    running_scan = db.query(Scan).filter(
        Scan.user_id == current_user.id,
        Scan.status.in_(["pending", "running"])
    ).first()
    if running_scan:
        raise BadRequestException("A scan is currently running in your workspace. Please wait for it to finish or cancel it.")

    scan = Scan(
        target_id=target.id,
        user_id=current_user.id,
        scan_type=body.scan_type,
        status="pending",
        progress=0
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    # Launch scan in background task
    launch_scan_job(scan.id)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="scan.started",
        resource="scan",
        resource_id=scan.id,
        ip_address=request.client.host if request.client else None,
        meta={"target_url": target.url, "scan_type": body.scan_type}
    )
    db.add(audit)
    db.commit()

    return ScanResponse(
        id=scan.id,
        target_id=scan.target_id,
        user_id=scan.user_id,
        target_name=target.name,
        target_url=target.url,
        status=scan.status,
        scan_type=scan.scan_type,
        scan_engine=getattr(scan, "scan_engine", "zap") or "zap",
        progress=scan.progress,
        security_score=scan.security_score,
        severity_breakdown=SeverityCount(),
        started_at=scan.started_at,
        completed_at=scan.completed_at,
        error_message=scan.error_message,
        created_at=scan.created_at
    )

@router.get("", response_model=List[ScanResponse])
def list_scans(
    target_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Scan).filter(Scan.user_id == current_user.id)
    if target_id:
        query = query.filter(Scan.target_id == target_id)
    if status_filter:
        query = query.filter(Scan.status == status_filter)

    scans = query.order_by(Scan.created_at.desc()).all()
    results = []

    for s in scans:
        target = db.query(Target).filter(Target.id == s.target_id).first()
        findings = db.query(ScanFinding).filter(ScanFinding.scan_id == s.id).all()
        breakdown = build_severity_breakdown(findings)

        results.append(ScanResponse(
            id=s.id,
            target_id=s.target_id,
            user_id=s.user_id,
            target_name=target.name if target else "Unknown Target",
            target_url=target.url if target else "",
            status=s.status,
            scan_type=s.scan_type,
            scan_engine=getattr(s, "scan_engine", "zap") or "zap",
            progress=s.progress,
            security_score=s.security_score,
            severity_breakdown=breakdown,
            started_at=s.started_at,
            completed_at=s.completed_at,
            error_message=s.error_message,
            created_at=s.created_at
        ))
    return results

@router.get("/{scan_id}/status", response_model=ScanStatusResponse)
def get_scan_status(scan_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == current_user.id).first()
    if not scan:
        raise NotFoundException("Scan not found")

    return ScanStatusResponse(
        id=scan.id,
        target_id=scan.target_id,
        status=scan.status,
        scan_engine=getattr(scan, "scan_engine", "zap") or "zap",
        progress=scan.progress,
        security_score=scan.security_score,
        started_at=scan.started_at,
        completed_at=scan.completed_at,
        error_message=scan.error_message
    )

@router.get("/{scan_id}", response_model=ScanDetailResponse)
def get_scan_detail(scan_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == current_user.id).first()
    if not scan:
        raise NotFoundException("Scan not found")

    target = db.query(Target).filter(Target.id == scan.target_id).first()
    findings = db.query(ScanFinding).options(
        joinedload(ScanFinding.vulnerability),
        joinedload(ScanFinding.ai_analysis)
    ).filter(ScanFinding.scan_id == scan.id).all()

    breakdown = build_severity_breakdown(findings)

    finding_responses = []
    for f in findings:
        vuln_res = None
        if f.vulnerability:
            vuln_res = VulnerabilityResponse(
                id=f.vulnerability.id,
                plugin_id=f.vulnerability.plugin_id,
                name=f.vulnerability.name,
                description=f.vulnerability.description,
                solution=f.vulnerability.solution,
                reference=f.vulnerability.reference,
                owasp_category=f.vulnerability.owasp_category,
                cwe_id=f.vulnerability.cwe_id,
                wasc_id=f.vulnerability.wasc_id,
                created_at=f.vulnerability.created_at
            )

        ai_res = None
        if f.ai_analysis:
            ai_res = AIAnalysisResponse(
                id=f.ai_analysis.id,
                finding_id=f.ai_analysis.finding_id,
                explanation=f.ai_analysis.explanation,
                why_it_matters=f.ai_analysis.why_it_matters,
                potential_impact=f.ai_analysis.potential_impact,
                evidence_interpretation=f.ai_analysis.evidence_interpretation,
                remediation=f.ai_analysis.remediation,
                fix_guidance=f.ai_analysis.fix_guidance,
                model_version=f.ai_analysis.model_version,
                created_at=f.ai_analysis.created_at
            )

        finding_responses.append(ScanFindingResponse(
            id=f.id,
            scan_id=f.scan_id,
            vulnerability_id=f.vulnerability_id,
            vulnerability=vuln_res,
            severity=f.severity,
            risk_score=f.risk_score,
            confidence=f.confidence,
            affected_url=f.affected_url,
            http_method=f.http_method,
            parameter=f.parameter,
            attack=f.attack,
            evidence=f.evidence,
            other_info=f.other_info,
            created_at=f.created_at,
            ai_analysis=ai_res
        ))

    return ScanDetailResponse(
        id=scan.id,
        target_id=scan.target_id,
        user_id=scan.user_id,
        target_name=target.name if target else "Target",
        target_url=target.url if target else "",
        status=scan.status,
        scan_type=scan.scan_type,
        scan_engine=getattr(scan, "scan_engine", "zap") or "zap",
        progress=scan.progress,
        security_score=scan.security_score,
        severity_breakdown=breakdown,
        started_at=scan.started_at,
        completed_at=scan.completed_at,
        error_message=scan.error_message,
        created_at=scan.created_at,
        findings=finding_responses
    )

@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_scan(scan_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == current_user.id).first()
    if not scan:
        raise NotFoundException("Scan not found")

    if scan.status in ("pending", "running"):
        scan.status = "cancelled"
        scan.error_message = "Scan was cancelled by the user."
        db.commit()

    return None
