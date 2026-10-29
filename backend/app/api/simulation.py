from fastapi import APIRouter, HTTPException, status
from backend.app.simulator.engine import simulation_engine
from backend.app.schemas.simulation import (
    SimulationStatusResponse,
    SimulationScenarioRequest,
    SimulationControlRequest,
)

router = APIRouter(prefix="/simulation", tags=["simulation"])


@router.get("/status", response_model=SimulationStatusResponse)
def get_simulation_status():
    return simulation_engine.get_status()


@router.post("/start", response_model=SimulationStatusResponse)
def start_simulation():
    simulation_engine.start()
    return simulation_engine.get_status()


@router.post("/pause", response_model=SimulationStatusResponse)
def pause_simulation():
    simulation_engine.pause()
    return simulation_engine.get_status()


@router.post("/resume", response_model=SimulationStatusResponse)
def resume_simulation():
    simulation_engine.resume()
    return simulation_engine.get_status()


@router.post("/reset", response_model=SimulationStatusResponse)
def reset_simulation(req: SimulationControlRequest = None):
    new_seed = req.seed if req else None
    simulation_engine.reset(new_seed=new_seed)
    return simulation_engine.get_status()


@router.post("/scenarios/{asset_id}", response_model=SimulationStatusResponse)
def trigger_scenario(asset_id: str, req: SimulationScenarioRequest):
    allowed_scenarios = [
        "overheating",
        "excessive_vibration",
        "abnormal_current",
        "sensor_failure",
        "wear_acceleration",
        "clear"
    ]
    if req.scenario not in allowed_scenarios:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid scenario '{req.scenario}'. Allowed: {', '.join(allowed_scenarios)}"
        )

    simulation_engine.trigger_scenario(asset_id, req.scenario, intensity=req.intensity)
    return simulation_engine.get_status()
