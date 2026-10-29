from datetime import datetime, timezone, timedelta


def utc_now():
    return datetime.now(timezone.utc)


def test_create_maintenance_record(client, sample_motor):
    sched_date = (utc_now() + timedelta(days=7)).isoformat()
    payload = {
        "asset_id": sample_motor.id,
        "maintenance_type": "preventive",
        "priority": "medium",
        "description": "Quarterly stator winding resistance inspection",
        "scheduled_date": sched_date,
        "technician": "Technician J. Ray",
        "notes": "Verify megohmmeter insulation resistance above 100M-ohms."
    }
    resp = client.post("/api/maintenance", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["asset_id"] == sample_motor.id
    assert data["maintenance_type"] == "preventive"
    assert data["status"] == "scheduled"
    assert data["technician"] == "Technician J. Ray"


def test_create_maintenance_invalid_asset(client):
    payload = {
        "asset_id": "nonexistent-asset-00",
        "maintenance_type": "corrective",
        "priority": "high",
        "description": "Fix broken pump",
        "scheduled_date": utc_now().isoformat()
    }
    resp = client.post("/api/maintenance", json=payload)
    assert resp.status_code == 404


def test_update_maintenance_to_completed(client, sample_motor):
    # 1. Create record
    sched_date = (utc_now() - timedelta(days=1)).isoformat()
    create_resp = client.post("/api/maintenance", json={
        "asset_id": sample_motor.id,
        "maintenance_type": "corrective",
        "priority": "high",
        "description": "Replace worn drive belt",
        "scheduled_date": sched_date
    })
    rec_id = create_resp.json()["id"]

    # 2. Update to completed
    patch_resp = client.patch(f"/api/maintenance/{rec_id}", json={
        "status": "completed",
        "actions_taken": "Installed new Gates Quad-Power 4 cogged belt, aligned pulleys with laser tool."
    })
    assert patch_resp.status_code == 200
    updated = patch_resp.json()
    assert updated["status"] == "completed"
    assert updated["completed_date"] is not None
    assert "Gates Quad-Power" in updated["actions_taken"]
