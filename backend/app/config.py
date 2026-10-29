from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "TwinOps Digital Twin Framework"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite:///./twinops.db"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    SIMULATION_INTERVAL_SECONDS: float = 2.0
    SIMULATION_AUTOSTART: bool = True
    SIMULATION_RANDOM_SEED: int = 42

    # Health score thresholds
    HEALTH_THRESHOLD_HEALTHY: float = 80.0
    HEALTH_THRESHOLD_DEGRADED: float = 50.0

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
