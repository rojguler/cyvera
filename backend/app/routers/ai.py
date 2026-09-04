from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.scan import Scan
from app.models.scan_finding import ScanFinding
from app.models.ai_analysis import AIAnalysis
from app.schemas.vulnerability import AIAnalysisResponse
from app.services.gemini_service import gemini_service
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/ai", tags=["AI Security Assistant"])

@router.post("/analyze/{finding_id}", response_model=AIAnalysisResponse, status_code=status.HTTP_200_OK)
def analyze_finding_with_ai(finding_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    finding = db.query(ScanFinding).join(Scan).filter(
        ScanFinding.id == finding_id,
        Scan.user_id == current_user.id
    ).options(
        joinedload(ScanFinding.vulnerability),
        joinedload(ScanFinding.ai_analysis)
    ).first()

    if not finding:
        raise NotFoundException("Vulnerability finding not found")

    # If AI analysis already exists, return cached analysis
    if finding.ai_analysis:
        return AIAnalysisResponse(
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

    # Format finding and vulnerability dictionary
    f_data = {
        "severity": finding.severity,
        "affected_url": finding.affected_url,
        "http_method": finding.http_method,
        "parameter": finding.parameter,
        "evidence": finding.evidence,
        "attack": finding.attack
    }

    v_data = {
        "name": finding.vulnerability.name if finding.vulnerability else "Security Issue",
        "description": finding.vulnerability.description if finding.vulnerability else "",
        "solution": finding.vulnerability.solution if finding.vulnerability else "",
        "owasp_category": finding.vulnerability.owasp_category if finding.vulnerability else "A05:2021",
        "cwe_id": finding.vulnerability.cwe_id if finding.vulnerability else None
    }

    ai_res = gemini_service.analyze_finding(f_data, v_data)

    analysis = AIAnalysis(
        finding_id=finding.id,
        explanation=ai_res["explanation"],
        why_it_matters=ai_res["why_it_matters"],
        potential_impact=ai_res["potential_impact"],
        evidence_interpretation=ai_res["evidence_interpretation"],
        remediation=ai_res["remediation"],
        fix_guidance=ai_res["fix_guidance"],
        model_version=ai_res.get("model_version", "gemini-2.0-flash")
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return AIAnalysisResponse(
        id=analysis.id,
        finding_id=analysis.finding_id,
        explanation=analysis.explanation,
        why_it_matters=analysis.why_it_matters,
        potential_impact=analysis.potential_impact,
        evidence_interpretation=analysis.evidence_interpretation,
        remediation=analysis.remediation,
        fix_guidance=analysis.fix_guidance,
        model_version=analysis.model_version,
        created_at=analysis.created_at
    )
