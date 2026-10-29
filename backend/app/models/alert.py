import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


def generate_uuid():
    return str(uuid.uuid4())


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    asset_id = Column(String, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    severity = Column(String, nullable=False, index=True)  # warning, critical
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    sensor_key = Column(String, nullable=False, index=True)
    measured_value = Column(Float, nullable=False)
    threshold_value = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    status = Column(String, default="active", nullable=False, index=True)  # active, acknowledged, resolved
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_by = Column(String, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution_notes = Column(String, nullable=True)

    asset = relationship("Asset", back_populates="alerts")
