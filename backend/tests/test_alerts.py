from backend.app.services.alert_service import process_violations
from backend.app.models.alert import Alert


def test_alert_creation_and_deduplication(db_session, sample_motor):
    crit_violation = [{
        "sensor_key": "temperature",
        "severity": "critical",
        "measured": 91.2,
        "threshold": 85.0,
        "message": "Temperature exceeded critical threshold"
    }]

    # First violation event creates alert
    created = process_violations(db_session, sample_motor.id, crit_violation, [])
    db_session.commit()
    assert len(created) == 1

    alerts_in_db = db_session.query(Alert).filter(Alert.asset_id == sample_motor.id).all()
    assert len(alerts_in_db) == 1
    alert_id = alerts_in_db[0].id
    assert alerts_in_db[0].severity == "critical"
    assert alerts_in_db[0].measured_value == 91.2

    # Second violation tick: SAME condition still active -> DEDUPLICATION
    second_crit_violation = [{
        "sensor_key": "temperature",
        "severity": "critical",
        "measured": 92.5,
        "threshold": 85.0,
        "message": "Temperature exceeded critical threshold"
    }]
    created_second = process_violations(db_session, sample_motor.id, second_crit_violation, [])
    db_session.commit()

    # No new alert should be created!
    assert len(created_second) == 0
    all_alerts = db_session.query(Alert).filter(Alert.asset_id == sample_motor.id).all()
    assert len(all_alerts) == 1
    # Existing alert updated with latest measurement
    assert all_alerts[0].id == alert_id
    assert all_alerts[0].measured_value == 92.5


def test_alert_acknowledge_and_resolve(client, db_session, sample_motor):
    alert = Alert(
        asset_id=sample_motor.id,
        severity="warning",
        title="Elevated Vibration",
        description="Vibration 5.1 mm/s",
        sensor_key="vibration",
        measured_value=5.1,
        threshold_value=4.5,
        status="active",
    )
    db_session.add(alert)
    db_session.commit()
    db_session.refresh(alert)

    # 1. Acknowledge
    ack_resp = client.patch(f"/api/alerts/{alert.id}", json={
        "status": "acknowledged",
        "acknowledged_by": "Operator_Alex"
    })
    assert ack_resp.status_code == 200
    ack_data = ack_resp.json()
    assert ack_data["status"] == "acknowledged"
    assert ack_data["acknowledged_by"] == "Operator_Alex"
    assert ack_data["acknowledged_at"] is not None

    # 2. Resolve
    res_resp = client.patch(f"/api/alerts/{alert.id}", json={
        "status": "resolved",
        "resolution_notes": "Realigned motor mounting bracket. Vibration returned to 1.4 mm/s."
    })
    assert res_resp.status_code == 200
    res_data = res_resp.json()
    assert res_data["status"] == "resolved"
    assert res_data["resolved_at"] is not None
    assert "Realigned" in res_data["resolution_notes"]


def test_filter_alerts(client, db_session, sample_motor):
    a1 = Alert(
        asset_id=sample_motor.id,
        severity="warning",
        title="Warn 1",
        description="Warn 1",
        sensor_key="temp",
        measured_value=76.0,
        threshold_value=75.0,
        status="active"
    )
    a2 = Alert(
        asset_id=sample_motor.id,
        severity="critical",
        title="Crit 1",
        description="Crit 1",
        sensor_key="temp",
        measured_value=89.0,
        threshold_value=85.0,
        status="resolved"
    )
    db_session.add_all([a1, a2])
    db_session.commit()

    crit_resp = client.get("/api/alerts?severity=critical")
    assert crit_resp.status_code == 200
    crit_list = crit_resp.json()
    assert len(crit_list) == 1
    assert crit_list[0]["severity"] == "critical"

    active_resp = client.get("/api/alerts?status=active")
    assert active_resp.status_code == 200
    active_list = active_resp.json()
    assert len(active_list) == 1
    assert active_list[0]["status"] == "active"
