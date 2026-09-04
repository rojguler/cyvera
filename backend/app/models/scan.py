from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Scan(Base):
    __tablename__ = "scans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    target_id = Column(String(36), ForeignKey("targets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="pending", index=True) # pending, running, completed, failed, cancelled
    zap_scan_id = Column(String(255), nullable=True)
    scan_type = Column(String(50), default="passive") # passive, active, full
    scan_engine = Column(String(50), default="zap") # zap, fallback
    progress = Column(Integer, default=0) # 0 - 100
    security_score = Column(Integer, nullable=True) # 0 - 100
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    target = relationship("Target", back_populates="scans")
    user = relationship("User", back_populates="scans")
    findings = relationship("ScanFinding", back_populates="scan", cascade="all, delete-orphan")
