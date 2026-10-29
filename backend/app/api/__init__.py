from fastapi import APIRouter
from backend.app.api.assets import router as assets_router
from backend.app.api.telemetry import router as telemetry_router
from backend.app.api.alerts import router as alerts_router
from backend.app.api.maintenance import router as maintenance_router
from backend.app.api.simulation import router as simulation_router

api_router = APIRouter()
api_router.include_router(assets_router)
api_router.include_router(telemetry_router)
api_router.include_router(alerts_router)
api_router.include_router(maintenance_router)
api_router.include_router(simulation_router)

__all__ = ["api_router"]
