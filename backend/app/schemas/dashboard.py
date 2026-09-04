from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
from app.schemas.scan import SeverityCount, ScanResponse

class OWASPCategoryCount(BaseModel):
    category: str
    count: int

class ScoreTrendPoint(BaseModel):
    date: str
    scan_id: str
    target_name: str
    score: int

class DashboardStatsResponse(BaseModel):
    total_scans: int
    total_targets: int
    latest_security_score: Optional[int] = 100
    average_security_score: Optional[int] = 100
    severity_breakdown: SeverityCount
    owasp_distribution: List[OWASPCategoryCount]
    recent_scans: List[ScanResponse]
    score_trends: List[ScoreTrendPoint]
