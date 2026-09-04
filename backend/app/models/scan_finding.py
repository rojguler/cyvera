from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class ScanFinding(Base):
    __tablename__ = "scan_findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scan_id = Column(String(36), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, index=True)
    vulnerability_id = Column(String(36), ForeignKey("vulnerabilities.id"), nullable=False, index=True)
    severity = Column(String(20), nullable=False, index=True) # critical, high, medium, low, informational
    risk_score = Column(Float, nullable=True) # numeric CVSS/ZAP risk equivalent
    confidence = Column(String(20), nullable=True) # high, medium, low, false_positive
    affected_url = Column(Text, nullable=False)
    http_method = Column(String(10), default="GET")
    parameter = Column(String(500), nullable=True)
    attack = Column(Text, nullable=True)
    evidence = Column(Text, nullable=True)
    other_info = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    scan = relationship("Scan", back_populates="findings")
    vulnerability = relationship("Vulnerability", back_populates="findings")
    ai_analysis = relationship("AIAnalysis", back_populates="finding", uselist=False, cascade="all, delete-orphan")
