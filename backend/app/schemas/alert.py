from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class AlertCreate(BaseModel):
    asset_id: str
    severity: str = Field(..., description="warning or critical")
    title: str
    description: str
    sensor_key: str
    measured_value: float
    threshold_value: float
    timestamp: Optional[datetime] = None


class AlertUpdate(BaseModel):
    status: Optional[str] = Field(None, description="acknowledged or resolved")
    acknowledged_by: Optional[str] = None
    resolution_notes: Optional[str] = None


class AlertResponse(BaseModel):
    id: str
    asset_id: str
    severity: str
    title: str
    description: str
    sensor_key: str
    measured_value: float
    threshold_value: float
    timestamp: datetime
    status: str
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
