from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.scan import Scan
from app.models.scan_finding import ScanFinding
from app.models.vulnerability import Vulnerability
from app.schemas.vulnerability import ScanFindingResponse, VulnerabilityResponse, AIAnalysisResponse
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/vulnerabilities", tags=["Vulnerability Explorer"])

@router.get("", response_model=List[ScanFindingResponse])
def list_vulnerabilities(
    severity: Optional[str] = Query(None),
    owasp_category: Optional[str] = Query(None),
    target_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ScanFinding).join(Scan).filter(Scan.user_id == current_user.id)
    
    if target_id:
        query = query.filter(Scan.target_id == target_id)
    if severity:
        query = query.filter(ScanFinding.severity == severity.lower())
    if owasp_category:
        query = query.join(Vulnerability).filter(Vulnerability.owasp_category.ilike(f"%{owasp_category}%"))

    findings = query.options(
        joinedload(ScanFinding.vulnerability),
        joinedload(ScanFinding.ai_analysis)
    ).order_by(ScanFinding.created_at.desc()).limit(100).all()

    results = []
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

        results.append(ScanFindingResponse(
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

    return results

@router.get("/{finding_id}", response_model=ScanFindingResponse)
def get_vulnerability_detail(finding_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    finding = db.query(ScanFinding).join(Scan).filter(
        ScanFinding.id == finding_id,
        Scan.user_id == current_user.id
    ).options(
        joinedload(ScanFinding.vulnerability),
        joinedload(ScanFinding.ai_analysis)
    ).first()

    if not finding:
        raise NotFoundException("Vulnerability finding not found")

    vuln_res = None
    if finding.vulnerability:
        vuln_res = VulnerabilityResponse(
            id=finding.vulnerability.id,
            plugin_id=finding.vulnerability.plugin_id,
            name=finding.vulnerability.name,
            description=finding.vulnerability.description,
            solution=finding.vulnerability.solution,
            reference=finding.vulnerability.reference,
            owasp_category=finding.vulnerability.owasp_category,
            cwe_id=finding.vulnerability.cwe_id,
            wasc_id=finding.vulnerability.wasc_id,
            created_at=finding.vulnerability.created_at
        )

    ai_res = None
    if finding.ai_analysis:
        ai_res = AIAnalysisResponse(
            id=finding.ai_analysis.id,
            finding_id=finding.ai_analysis.finding_id,
            explanation=finding.ai_analysis.explanation,
            why_it_matters=finding.ai_analysis.why_it_matters,
            potential_impact=finding.ai_analysis.potential_impact,
            evidence_interpretation=finding.ai_analysis.evidence_interpretation,
            remediation=finding.ai_analysis.remediation,
            fix_guidance=finding.ai_analysis.fix_guidance,
            model_version=finding.ai_analysis.model_version,
            created_at=finding.ai_analysis.created_at
        )

    return ScanFindingResponse(
        id=finding.id,
        scan_id=finding.scan_id,
        vulnerability_id=finding.vulnerability_id,
        vulnerability=vuln_res,
        severity=finding.severity,
        risk_score=finding.risk_score,
        confidence=finding.confidence,
        affected_url=finding.affected_url,
        http_method=finding.http_method,
        parameter=finding.parameter,
        attack=finding.attack,
        evidence=finding.evidence,
        other_info=finding.other_info,
        created_at=finding.created_at,
        ai_analysis=ai_res
    )
