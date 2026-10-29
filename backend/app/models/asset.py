from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from backend.app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Asset(Base):
    __tablename__ = "assets"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    asset_type = Column(String, nullable=False, index=True)  # electric_motor, water_pump, industrial_fan
    location = Column(String, nullable=False)
    manufacturer = Column(String, nullable=True)
    model_number = Column(String, nullable=True)
    operational_status = Column(String, default="running", nullable=False)  # running, stopped, offline
    installation_date = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Health & Diagnostics
    health_score = Column(Float, default=100.0, nullable=False)  # 0.0 to 100.0
    health_condition = Column(String, default="healthy", nullable=False)  # healthy, degraded, critical
    degradation_indicator = Column(Float, default=0.0, nullable=False)  # 0.0 to 100.0%
    maintenance_priority = Column(String, default="low", nullable=False)  # low, medium, high, critical
    recommended_action = Column(String, default="Routine inspection according to schedule", nullable=False)
    operating_hours = Column(Float, default=0.0, nullable=False)
    last_telemetry_timestamp = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    sensors = relationship("SensorDefinition", back_populates="asset", cascade="all, delete-orphan", lazy="joined")
    telemetry_readings = relationship("TelemetryReading", back_populates="asset", cascade="all, delete-orphan", order_by="desc(TelemetryReading.timestamp)")
    alerts = relationship("Alert", back_populates="asset", cascade="all, delete-orphan", order_by="desc(Alert.timestamp)")
    maintenance_records = relationship("MaintenanceRecord", back_populates="asset", cascade="all, delete-orphan", order_by="desc(MaintenanceRecord.scheduled_date)")


class SensorDefinition(Base):
    __tablename__ = "sensor_definitions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    asset_id = Column(String, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    sensor_key = Column(String, nullable=False)  # e.g. temperature, vibration, speed_rpm, flow_rate, pressure, current_amp
    name = Column(String, nullable=False)
    unit = Column(String, nullable=False)
    min_valid = Column(Float, nullable=False)
    max_valid = Column(Float, nullable=False)
    warning_threshold = Column(Float, nullable=False)
    critical_threshold = Column(Float, nullable=False)
    nominal_value = Column(Float, nullable=False)
    lower_warning_threshold = Column(Float, nullable=True)
    lower_critical_threshold = Column(Float, nullable=True)
    weight = Column(Float, default=1.0, nullable=False)

    asset = relationship("Asset", back_populates="sensors")
