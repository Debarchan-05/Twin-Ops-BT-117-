from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class MaintenanceCreate(BaseModel):
    asset_id: str
    maintenance_type: str = Field(..., description="preventive, corrective, inspection, or overhaul")
    priority: str = Field("medium", description="low, medium, high, or critical")
    description: str
    scheduled_date: datetime
    technician: Optional[str] = None
    notes: Optional[str] = None


class MaintenanceUpdate(BaseModel):
    maintenance_type: Optional[str] = None
    priority: Optional[str] = None
    description: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    status: Optional[str] = Field(None, description="scheduled, in_progress, completed, cancelled")
    technician: Optional[str] = None
    notes: Optional[str] = None
    actions_taken: Optional[str] = None


class MaintenanceResponse(BaseModel):
    id: str
    asset_id: str
    maintenance_type: str
    priority: str
    description: str
    scheduled_date: datetime
    completed_date: Optional[datetime] = None
    status: str
    technician: Optional[str] = None
    notes: Optional[str] = None
    actions_taken: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
