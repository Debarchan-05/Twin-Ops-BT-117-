from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from backend.app.schemas.sensor import SensorDefinitionCreate, SensorDefinitionResponse


class AssetBase(BaseModel):
    id: str = Field(..., description="Unique alphanumeric identifier")
    name: str = Field(..., description="Asset identifier name")
    asset_type: str = Field(..., description="electric_motor, water_pump, or industrial_fan")
    location: str = Field(..., description="Physical facility plant or section")
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    operational_status: str = Field("running", description="running, stopped, or offline")
    installation_date: Optional[datetime] = None


class AssetCreate(AssetBase):
    sensors: Optional[List[SensorDefinitionCreate]] = None


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_type: Optional[str] = None
    location: Optional[str] = None
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    operational_status: Optional[str] = None


class AssetResponse(AssetBase):
    health_score: float
    health_condition: str
    degradation_indicator: float
    maintenance_priority: str
    recommended_action: str
    operating_hours: float
    last_telemetry_timestamp: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    sensors: List[SensorDefinitionResponse] = []

    model_config = ConfigDict(from_attributes=True)


class AssetHealthDetail(BaseModel):
    asset_id: str
    name: str
    asset_type: str
    operational_status: str
    health_score: float
    health_condition: str
    degradation_indicator: float
    maintenance_priority: str
    recommended_action: str
    sensor_statuses: dict
    active_anomalies: List[str]
    timestamp: datetime
