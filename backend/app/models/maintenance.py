import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


def generate_uuid():
    return str(uuid.uuid4())


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    asset_id = Column(String, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    maintenance_type = Column(String, nullable=False, index=True)  # preventive, corrective, inspection, overhaul
    priority = Column(String, default="medium", nullable=False)  # low, medium, high, critical
    description = Column(String, nullable=False)
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    completed_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, default="scheduled", nullable=False, index=True)  # scheduled, in_progress, completed, cancelled
    technician = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    actions_taken = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    asset = relationship("Asset", back_populates="maintenance_records")
