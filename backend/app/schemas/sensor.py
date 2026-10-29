from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class SensorDefinitionBase(BaseModel):
    sensor_key: str = Field(..., description="Unique key for metric e.g. temperature, vibration")
    name: str = Field(..., description="Human-readable sensor name")
    unit: str = Field(..., description="Measurement unit, e.g. °C, mm/s, RPM")
    min_valid: float = Field(..., description="Physical sensor minimum valid reading")
    max_valid: float = Field(..., description="Physical sensor maximum valid reading")
    warning_threshold: float = Field(..., description="Threshold for warning alert")
    critical_threshold: float = Field(..., description="Threshold for critical alert")
    nominal_value: float = Field(..., description="Expected baseline normal reading")
    lower_warning_threshold: Optional[float] = None
    lower_critical_threshold: Optional[float] = None
    weight: float = Field(1.0, description="Weighting factor in health calculation")


class SensorDefinitionCreate(SensorDefinitionBase):
    pass


class SensorDefinitionUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    min_valid: Optional[float] = None
    max_valid: Optional[float] = None
    warning_threshold: Optional[float] = None
    critical_threshold: Optional[float] = None
    nominal_value: Optional[float] = None
    lower_warning_threshold: Optional[float] = None
    lower_critical_threshold: Optional[float] = None
    weight: Optional[float] = None


class SensorDefinitionResponse(SensorDefinitionBase):
    id: int
    asset_id: str

    model_config = ConfigDict(from_attributes=True)
