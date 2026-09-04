from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.scan import Scan
from app.models.target import Target
from app.models.scan_finding import ScanFinding
from app.schemas.report import ScanReportResponse
from app.schemas.scan import SeverityCount
from app.schemas.vulnerability import ScanFindingResponse, VulnerabilityResponse, AIAnalysisResponse
from app.services.report_service import generate_pdf_report
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/reports", tags=["Security Assessment Reports"])

@router.get("/scans/{scan_id}", response_model=ScanReportResponse)
def get_scan_report_json(scan_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == current_user.id).first()
    if not scan:
        raise NotFoundException("Scan not found")

    target = db.query(Target).filter(Target.id == scan.target_id).first()
    findings = db.query(ScanFinding).options(
        joinedload(ScanFinding.vulnerability),
        joinedload(ScanFinding.ai_analysis)
    ).filter(ScanFinding.scan_id == scan.id).all()

    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "informational": 0}
    finding_responses = []

    for f in findings:
        sev = str(f.severity).lower()
        if sev in counts:
            counts[sev] += 1
        else:
            counts["informational"] += 1

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

    breakdown = SeverityCount(
        critical=counts["critical"],
        high=counts["high"],
        medium=counts["medium"],
        low=counts["low"],
        informational=counts["informational"],
        total=len(findings)
    )

    score = scan.security_score or 100
    if score >= 85:
        summary = f"Security assessment completed with a strong overall score of {score}/100. Key protective controls are active."
    elif score >= 65:
        summary = f"Security assessment completed with a moderate score of {score}/100. Several important security headers and configurations require attention."
    else:
        summary = f"Security assessment completed with an elevated risk score of {score}/100. Critical or High vulnerabilities were discovered that demand immediate remediation."

    return ScanReportResponse(
        scan_id=scan.id,
        target_name=target.name if target else "Unknown Target",
        target_url=target.url if target else "",
        scan_type=scan.scan_type,
        status=scan.status,
        security_score=score,
        started_at=scan.started_at,
        completed_at=scan.completed_at,
        severity_breakdown=breakdown,
        executive_summary=summary,
        findings=finding_responses
    )

@router.get("/scans/{scan_id}/pdf")
def get_scan_report_pdf(scan_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == current_user.id).first()
    if not scan:
        raise NotFoundException("Scan not found")

    target = db.query(Target).filter(Target.id == scan.target_id).first()
    findings = db.query(ScanFinding).options(
        joinedload(ScanFinding.vulnerability),
        joinedload(ScanFinding.ai_analysis)
    ).filter(ScanFinding.scan_id == scan.id).all()

    scan_dict = {
        "id": scan.id,
        "security_score": scan.security_score or 100,
        "status": scan.status,
        "scan_type": scan.scan_type,
        "severity_breakdown": {
            "critical": sum(1 for f in findings if f.severity == "critical"),
            "high": sum(1 for f in findings if f.severity == "high"),
            "medium": sum(1 for f in findings if f.severity == "medium"),
            "low": sum(1 for f in findings if f.severity == "low"),
            "informational": sum(1 for f in findings if f.severity == "informational"),
        }
    }

    target_dict = {
        "name": target.name if target else "Target",
        "url": target.url if target else "N/A"
    }

    findings_list = []
    for f in findings:
        findings_list.append({
            "severity": f.severity,
            "affected_url": f.affected_url,
            "vulnerability": {
                "name": f.vulnerability.name if f.vulnerability else "Alert",
                "owasp_category": f.vulnerability.owasp_category if f.vulnerability else "A05:2021",
                "description": f.vulnerability.description if f.vulnerability else "",
                "solution": f.vulnerability.solution if f.vulnerability else ""
            },
            "ai_analysis": {
                "why_it_matters": f.ai_analysis.why_it_matters if f.ai_analysis else "",
                "remediation": f.ai_analysis.remediation if f.ai_analysis else ""
            } if f.ai_analysis else None
        })

    pdf_bytes = generate_pdf_report(scan_dict, target_dict, findings_list)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Cyvera_Report_{scan.id[:8]}.pdf"
        }
    )
