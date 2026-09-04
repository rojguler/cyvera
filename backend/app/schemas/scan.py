from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from app.schemas.vulnerability import ScanFindingResponse

class ScanCreateRequest(BaseModel):
    target_id: str
    scan_type: str = Field("passive", description="passive | active | full")
    authorized_confirmation: bool = Field(True, description="Explicit confirmation that user is authorized to scan target")

class SeverityCount(BaseModel):
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    informational: int = 0
    total: int = 0

class ScanStatusResponse(BaseModel):
    id: str
    target_id: str
    status: str
    scan_engine: Optional[str] = "zap"
    progress: int
    security_score: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

class ScanResponse(BaseModel):
    id: str
    target_id: str
    user_id: str
    target_name: Optional[str] = None
    target_url: Optional[str] = None
    status: str
    scan_type: str
    scan_engine: Optional[str] = "zap"
    progress: int
    security_score: Optional[int] = None
    severity_breakdown: Optional[SeverityCount] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ScanDetailResponse(ScanResponse):
    findings: List[ScanFindingResponse] = []
