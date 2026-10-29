from datetime import datetime, timezone, timedelta
from backend.app.models.telemetry import TelemetryReading


def utc_now():
    return datetime.now(timezone.utc)


def test_telemetry_persistence_and_retrieval(client, db_session, sample_motor):
    now = utc_now()
    # Add 5 telemetry readings
    for i in range(5):
        reading = TelemetryReading(
            asset_id=sample_motor.id,
            timestamp=now + timedelta(seconds=i * 2),
            metrics={"temperature": 60.0 + i, "vibration": 1.5 + i * 0.1},
            calculated_health_score=95.0 - i,
            is_simulated=True,
        )
        db_session.add(reading)
    db_session.commit()

    resp = client.get(f"/api/assets/{sample_motor.id}/telemetry")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 5
    assert data[0]["asset_id"] == sample_motor.id
    assert "temperature" in data[0]["metrics"]
    assert data[0]["is_simulated"] is True


def test_telemetry_pagination(client, db_session, sample_motor):
    now = utc_now()
    for i in range(10):
        db_session.add(TelemetryReading(
            asset_id=sample_motor.id,
            timestamp=now + timedelta(seconds=i * 2),
            metrics={"temperature": 60.0 + i},
            calculated_health_score=90.0,
            is_simulated=True,
        ))
    db_session.commit()

    # Limit 3
    resp = client.get(f"/api/assets/{sample_motor.id}/telemetry?limit=3")
    assert resp.status_code == 200
    assert len(resp.json()) == 3


def test_get_latest_telemetry(client, db_session, sample_motor):
    now = utc_now()
    db_session.add(TelemetryReading(
        asset_id=sample_motor.id,
        timestamp=now - timedelta(seconds=10),
        metrics={"temperature": 62.0},
        calculated_health_score=92.0,
        is_simulated=True,
    ))
    db_session.add(TelemetryReading(
        asset_id=sample_motor.id,
        timestamp=now,
        metrics={"temperature": 65.5},
        calculated_health_score=89.0,
        is_simulated=True,
    ))
    db_session.commit()

    # Asset latest
    resp = client.get(f"/api/assets/{sample_motor.id}/telemetry/latest")
    assert resp.status_code == 200
    latest = resp.json()
    assert latest["metrics"]["temperature"] == 65.5

    # All latest
    all_resp = client.get("/api/telemetry/latest")
    assert all_resp.status_code == 200
    all_latest = all_resp.json()
    assert sample_motor.id in all_latest
    assert all_latest[sample_motor.id]["metrics"]["temperature"] == 65.5


def test_telemetry_for_nonexistent_asset(client):
    resp = client.get("/api/assets/ghost-asset-404/telemetry")
    assert resp.status_code == 404
