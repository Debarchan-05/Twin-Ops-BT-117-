from backend.app.simulator.engine import simulation_engine
from backend.app.simulator.generator import PhysicalSensorSimulator


def test_simulation_state_controls(client):
    # Test pause
    pause_resp = client.post("/api/simulation/pause")
    assert pause_resp.status_code == 200
    assert pause_resp.json()["is_running"] is False

    # Test resume
    resume_resp = client.post("/api/simulation/resume")
    assert resume_resp.status_code == 200
    assert resume_resp.json()["is_running"] is True

    # Test status
    status_resp = client.get("/api/simulation/status")
    assert status_resp.status_code == 200
    assert "interval_seconds" in status_resp.json()
    assert "seed" in status_resp.json()

    # Test reset
    reset_resp = client.post("/api/simulation/reset", json={"seed": 101})
    assert reset_resp.status_code == 200
    assert reset_resp.json()["seed"] == 101


def test_deterministic_seed_reproducibility(sample_motor):
    sim1 = PhysicalSensorSimulator(seed=12345)
    readings1 = [sim1.generate_next(sample_motor, delta_t=1.0) for _ in range(5)]

    sim2 = PhysicalSensorSimulator(seed=12345)
    readings2 = [sim2.generate_next(sample_motor, delta_t=1.0) for _ in range(5)]

    assert readings1 == readings2


def test_fault_scenario_injection(client, sample_motor):
    # Trigger overheating fault scenario
    sc_resp = client.post(
        f"/api/simulation/scenarios/{sample_motor.id}",
        json={"scenario": "overheating", "intensity": 1.2}
    )
    assert sc_resp.status_code == 200
    status = sc_resp.json()
    assert status["active_scenarios"].get(sample_motor.id) == "overheating"

    # Simulate steps and check that temperature elevates above critical (crit is 85.0)
    sim = simulation_engine.generator
    sim.set_scenario(sample_motor.id, "overheating", intensity=1.5)
    # Generate 8 ticks to allow thermal rise
    val = 0
    for _ in range(8):
        m = sim.generate_next(sample_motor, delta_t=2.0)
        val = m["temperature"]
    assert val >= 85.0  # Climbed into critical zone

    # Clear scenario
    clear_resp = client.post(
        f"/api/simulation/scenarios/{sample_motor.id}",
        json={"scenario": "clear"}
    )
    assert clear_resp.status_code == 200
    assert sample_motor.id not in clear_resp.json()["active_scenarios"]


def test_invalid_scenario_rejected(client, sample_motor):
    bad_resp = client.post(
        f"/api/simulation/scenarios/{sample_motor.id}",
        json={"scenario": "alien_invasion"}
    )
    assert bad_resp.status_code == 400
    assert "Invalid scenario" in bad_resp.json()["detail"]
