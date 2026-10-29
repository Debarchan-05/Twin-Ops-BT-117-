from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class TelemetryReading(Base):
    __tablename__ = "telemetry_readings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    asset_id = Column(String, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    metrics = Column(JSON, nullable=False)  # Map of sensor_key -> float/int
    calculated_health_score = Column(Float, nullable=False)
    is_simulated = Column(Boolean, default=True, nullable=False)

    asset = relationship("Asset", back_populates="telemetry_readings")
