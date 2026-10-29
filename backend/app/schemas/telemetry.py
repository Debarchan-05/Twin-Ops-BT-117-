from datetime import datetime
from typing import Dict, Optional, List
from pydantic import BaseModel, Field, ConfigDict


class TelemetryReadingCreate(BaseModel):
    asset_id: str
    metrics: Dict[str, float] = Field(..., description="Map of sensor keys to measured float values")
    timestamp: Optional[datetime] = None
    is_simulated: bool = True


class TelemetryReadingResponse(BaseModel):
    id: int
    asset_id: str
    timestamp: datetime
    metrics: Dict[str, float]
    calculated_health_score: float
    is_simulated: bool

    model_config = ConfigDict(from_attributes=True)


class LatestTelemetryMap(BaseModel):
    timestamp: datetime
    assets: Dict[str, TelemetryReadingResponse]
