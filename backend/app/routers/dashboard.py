from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.target import Target
from app.models.scan import Scan
from app.models.scan_finding import ScanFinding
from app.models.vulnerability import Vulnerability
from app.schemas.dashboard import DashboardStatsResponse, OWASPCategoryCount, ScoreTrendPoint
from app.schemas.scan import SeverityCount, ScanResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard Statistics"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_targets = db.query(Target).filter(Target.user_id == current_user.id).count()
    all_scans = db.query(Scan).filter(Scan.user_id == current_user.id).order_by(Scan.created_at.desc()).all()
    total_scans = len(all_scans)

    completed_scans = [s for s in all_scans if s.status == "completed" and s.security_score is not None]

    latest_score = completed_scans[0].security_score if completed_scans else 100
    avg_score = int(sum(s.security_score for s in completed_scans) / len(completed_scans)) if completed_scans else 100

    # Collect severity counts across all findings of user
    findings = db.query(ScanFinding).join(Scan).filter(Scan.user_id == current_user.id).all()
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "informational": 0}
    for f in findings:
        sev = str(f.severity).lower()
        if sev in counts:
            counts[sev] += 1
        else:
            counts["informational"] += 1

    breakdown = SeverityCount(
        critical=counts["critical"],
        high=counts["high"],
        medium=counts["medium"],
        low=counts["low"],
        informational=counts["informational"],
        total=len(findings)
    )

    # OWASP category distribution
    owasp_counts: Dict[str, int] = {}
    for f in findings:
        if f.vulnerability and f.vulnerability.owasp_category:
            cat = f.vulnerability.owasp_category.split("-")[0] # e.g. "A05:2021"
            owasp_counts[cat] = owasp_counts.get(cat, 0) + 1

    owasp_distribution = [
        OWASPCategoryCount(category=cat, count=cnt)
        for cat, cnt in sorted(owasp_counts.items(), key=lambda x: x[1], reverse=True)[:6]
    ]

    # Score trends (chronological)
    score_trends = []
    target_cache = {t.id: t.name for t in db.query(Target).filter(Target.user_id == current_user.id).all()}
    for s in reversed(completed_scans[:10]):
        score_trends.append(ScoreTrendPoint(
            date=s.completed_at.strftime("%b %d, %H:%M") if s.completed_at else s.created_at.strftime("%b %d"),
            scan_id=s.id,
            target_name=target_cache.get(s.target_id, "Target"),
            score=s.security_score or 100
        ))

    # Recent scans response
    recent_scans = []
    for s in all_scans[:5]:
        target = db.query(Target).filter(Target.id == s.target_id).first()
        s_findings = [f for f in findings if f.scan_id == s.id]
        s_breakdown = SeverityCount(
            critical=sum(1 for f in s_findings if f.severity == "critical"),
            high=sum(1 for f in s_findings if f.severity == "high"),
            medium=sum(1 for f in s_findings if f.severity == "medium"),
            low=sum(1 for f in s_findings if f.severity == "low"),
            informational=sum(1 for f in s_findings if f.severity == "informational"),
            total=len(s_findings)
        )
        recent_scans.append(ScanResponse(
            id=s.id,
            target_id=s.target_id,
            user_id=s.user_id,
            target_name=target.name if target else "Target",
            target_url=target.url if target else "",
            status=s.status,
            scan_type=s.scan_type,
            progress=s.progress,
            security_score=s.security_score,
            severity_breakdown=s_breakdown,
            started_at=s.started_at,
            completed_at=s.completed_at,
            error_message=s.error_message,
            created_at=s.created_at
        ))

    return DashboardStatsResponse(
        total_scans=total_scans,
        total_targets=total_targets,
        latest_security_score=latest_score,
        average_security_score=avg_score,
        severity_breakdown=breakdown,
        owasp_distribution=owasp_distribution,
        recent_scans=recent_scans,
        score_trends=score_trends
    )
