from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.scan import SeverityCount
from app.schemas.vulnerability import ScanFindingResponse

class ScanReportResponse(BaseModel):
    scan_id: str
    target_name: str
    target_url: str
    scan_type: str
    status: str
    security_score: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    severity_breakdown: SeverityCount
    executive_summary: str
    findings: List[ScanFindingResponse]
