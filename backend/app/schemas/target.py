from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List
from datetime import datetime

class TargetCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    url: str = Field(..., min_length=5, max_length=1000)
    description: Optional[str] = None

class TargetUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None

class TargetResponse(BaseModel):
    id: str
    user_id: str
    name: str
    url: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    total_scans: Optional[int] = 0
    latest_score: Optional[int] = None

    class Config:
        from_attributes = True
