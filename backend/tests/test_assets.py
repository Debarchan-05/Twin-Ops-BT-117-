def test_create_asset_success(client):
    payload = {
        "id": "pump-aux-99",
        "name": "Auxiliary Cooling Pump",
        "asset_type": "water_pump",
        "location": "Basement Aux",
        "manufacturer": "Grundfos",
        "model_number": "CR 15-3",
        "operational_status": "running",
        "sensors": [
            {
                "sensor_key": "pressure",
                "name": "Discharge Pressure",
                "unit": "bar",
                "min_valid": 0.0,
                "max_valid": 16.0,
                "warning_threshold": 8.0,
                "critical_threshold": 10.0,
                "nominal_value": 5.5,
                "weight": 1.2
            }
        ]
    }
    resp = client.post("/api/assets", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["id"] == "pump-aux-99"
    assert data["name"] == "Auxiliary Cooling Pump"
    assert len(data["sensors"]) == 1
    assert data["sensors"][0]["sensor_key"] == "pressure"


def test_create_duplicate_asset_fails(client, sample_motor):
    payload = {
        "id": sample_motor.id,
        "name": "Duplicate Asset",
        "asset_type": "electric_motor",
        "location": "Shop Floor 1",
    }
    resp = client.post("/api/assets", json=payload)
    assert resp.status_code == 400
    assert "already exists" in resp.json()["detail"]


def test_get_asset_by_id(client, sample_motor):
    resp = client.get(f"/api/assets/{sample_motor.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == sample_motor.id
    assert data["name"] == sample_motor.name
    assert len(data["sensors"]) == 2


def test_get_nonexistent_asset(client):
    resp = client.get("/api/assets/nonexistent-999")
    assert resp.status_code == 404


def test_update_asset(client, sample_motor):
    payload = {
        "name": "Updated Motor Name",
        "operational_status": "stopped"
    }
    resp = client.put(f"/api/assets/{sample_motor.id}", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Updated Motor Name"
    assert data["operational_status"] == "stopped"


def test_delete_asset(client, sample_motor):
    resp = client.delete(f"/api/assets/{sample_motor.id}")
    assert resp.status_code == 204

    # Verify deleted
    get_resp = client.get(f"/api/assets/{sample_motor.id}")
    assert get_resp.status_code == 404
