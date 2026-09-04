from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    finding_id = Column(String(36), ForeignKey("scan_findings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    explanation = Column(Text, nullable=False)
    why_it_matters = Column(Text, nullable=False)
    potential_impact = Column(Text, nullable=False)
    evidence_interpretation = Column(Text, nullable=True)
    remediation = Column(Text, nullable=False)
    fix_guidance = Column(Text, nullable=False) # code snippets, config examples
    model_version = Column(String(100), default="gemini-2.0-flash")
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    finding = relationship("ScanFinding", back_populates="ai_analysis")
