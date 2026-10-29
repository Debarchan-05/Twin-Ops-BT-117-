from typing import Dict, Optional
from pydantic import BaseModel, Field


class SimulationScenarioRequest(BaseModel):
    scenario: str = Field(..., description="overheating, excessive_vibration, abnormal_current, sensor_failure, wear_acceleration, clear")
    intensity: float = Field(1.0, ge=0.1, le=5.0, description="Multiplier for scenario severity")
    duration_seconds: Optional[int] = Field(None, description="Optional auto-revert timeout")


class SimulationStatusResponse(BaseModel):
    is_running: bool
    interval_seconds: float
    seed: int
    tick_count: int
    active_scenarios: Dict[str, str]  # asset_id -> scenario name
    total_assets_simulated: int


class SimulationControlRequest(BaseModel):
    interval_seconds: Optional[float] = Field(None, ge=0.5, le=60.0)
    seed: Optional[int] = None
