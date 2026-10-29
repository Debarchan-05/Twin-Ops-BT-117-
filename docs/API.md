# TwinOps REST & WebSocket API Specification

## Base URLs
- REST API Base: `http://localhost:8000/api`
- WebSocket Base: `ws://localhost:8000/ws` (or `ws://localhost:8000/api/ws`)
- Interactive Swagger UI: `http://localhost:8000/docs`
- Redoc Documentation: `http://localhost:8000/redoc`

---

## 1. System Health & Probes

### `GET /health`
Returns system status, service version, and simulation state.

**Response:**
```json
{
  "status": "online",
  "service": "TwinOps Digital Twin Framework",
  "version": "1.0.0",
  "simulation": {
    "is_running": true,
    "interval_seconds": 2.0,
    "seed": 42,
    "tick_count": 85,
    "active_scenarios": {},
    "total_assets_simulated": 3
  }
}
```

---

## 2. Asset Management (`/api/assets`)

### `GET /api/assets`
List registered assets.
- **Query Parameters:**
  - `asset_type`: `electric_motor`, `water_pump`, `industrial_fan`
  - `operational_status`: `running`, `stopped`, `offline`
  - `health_condition`: `healthy`, `degraded`, `critical`
  - `search`: Filter by name, ID, or location

### `POST /api/assets`
Register a new industrial asset with configured sensor definitions.
**Request Body:**
```json
{
  "id": "asset-fan-02",
  "name": "Secondary Flue Gas Booster Fan",
  "asset_type": "industrial_fan",
  "location": "Boiler Island - Duct 4",
  "manufacturer": "Howden Industrial",
  "model_number": "VARAX Axial Series",
  "operational_status": "running",
  "sensors": [
    {
      "sensor_key": "temperature",
      "name": "Thrust Bearing Temperature",
      "unit": "°C",
      "min_valid": -10.0,
      "max_valid": 120.0,
      "warning_threshold": 65.0,
      "critical_threshold": 78.0,
      "nominal_value": 45.0,
      "weight": 1.2
    }
  ]
}
```

### `GET /api/assets/{asset_id}`
Retrieve a specific asset and its sensor configuration.

### `PUT /api/assets/{asset_id}`
Update asset metadata (name, location, operational_status, etc.).

### `DELETE /api/assets/{asset_id}`
Decommission and remove an asset.

---

## 3. Telemetry & Diagnostics

### `GET /api/assets/{asset_id}/telemetry`
Retrieve paginated historical telemetry records for time-series charts.
- **Query Parameters:**
  - `limit`: Number of records (1 to 1000, default 100)
  - `offset`: Record offset (default 0)
  - `start_time`: ISO UTC timestamp
  - `end_time`: ISO UTC timestamp

### `GET /api/assets/{asset_id}/telemetry/latest`
Fetch the single latest telemetry sample for the specified asset.

### `GET /api/telemetry/latest`
Fetch the latest telemetry readings for all registered assets across the entire fleet in a single call.

### `GET /api/assets/{asset_id}/health`
Returns comprehensive explainable health diagnosis, active anomalies, individual sensor statuses, and maintenance recommendations.

---

## 4. Alerts Lifecycle (`/api/alerts`)

### `GET /api/alerts`
Query alarms and anomalies.
- **Query Parameters:**
  - `asset_id`: Filter by asset
  - `severity`: `warning`, `critical`
  - `status`: `active`, `acknowledged`, `resolved`
  - `limit`: Default 100

### `PATCH /api/alerts/{alert_id}`
Acknowledge or resolve an active alarm.
**Request Body:**
```json
{
  "status": "acknowledged",
  "acknowledged_by": "Senior SCADA Operator"
}
```
Or to resolve:
```json
{
  "status": "resolved",
  "resolution_notes": "Cleaned heat exchanger filters. Bearing temperature normalized to 58°C."
}
```

---

## 5. Maintenance Management (`/api/maintenance`)

### `GET /api/maintenance`
List maintenance records.
- **Query Parameters:**
  - `asset_id`: Filter by asset
  - `status`: `scheduled`, `in_progress`, `completed`, `cancelled`
  - `priority`: `low`, `medium`, `high`, `critical`

### `POST /api/maintenance`
Create a new maintenance work order.
**Request Body:**
```json
{
  "asset_id": "asset-motor-01",
  "maintenance_type": "preventive",
  "priority": "medium",
  "description": "Vibration harmonic spectrum analysis and grease replenishment",
  "scheduled_date": "2026-11-05T09:00:00Z",
  "technician": "Sarah Chen",
  "notes": "Verify ISO 10816-3 Class II compliance"
}
```

### `PATCH /api/maintenance/{record_id}`
Update work order status, complete task, and record actions taken.
**Request Body:**
```json
{
  "status": "completed",
  "actions_taken": "Replaced non-drive end ball bearing, dynamic balance verified at 1.4 mm/s RMS."
}
```

---

## 6. Simulation Controls (`/api/simulation`)

### `GET /api/simulation/status`
Get running status, sampling interval, tick count, seed, and active fault scenarios.

### `POST /api/simulation/start`
Start the simulation background worker.

### `POST /api/simulation/pause`
Pause simulation ticks.

### `POST /api/simulation/resume`
Resume simulation ticks.

### `POST /api/simulation/reset`
Reset telemetry accumulators and randomize/set seed.
**Request Body (Optional):**
```json
{
  "seed": 101
}
```

### `POST /api/simulation/scenarios/{asset_id}`
Inject a stress fault scenario into a simulated asset.
- **Supported Scenarios:**
  - `overheating`
  - `excessive_vibration`
  - `abnormal_current`
  - `sensor_failure`
  - `wear_acceleration`
  - `clear` (restores nominal operation)
**Request Body:**
```json
{
  "scenario": "overheating",
  "intensity": 1.5
}
```

---

## 7. WebSocket Streaming (`/ws`)

Clients receive live broadcasts whenever a simulation tick completes.

### Broadcast Message Schema:
```json
{
  "type": "telemetry_update",
  "timestamp": "2026-10-29T08:35:12.450120Z",
  "tick": 142,
  "assets": {
    "asset-motor-01": {
      "asset_id": "asset-motor-01",
      "name": "Main Drive Induction Motor M-101",
      "operational_status": "running",
      "metrics": {
        "temperature": 63.4,
        "vibration": 1.95,
        "rotational_speed": 1483.2,
        "electrical_current": 25.1
      },
      "health_score": 96.2,
      "health_condition": "healthy",
      "degradation_indicator": 13.1,
      "maintenance_priority": "low",
      "recommended_action": "Optimal operation.",
      "sensor_statuses": {
        "temperature": {
          "name": "Stator Core Temperature",
          "value": 63.4,
          "unit": "°C",
          "status": "normal",
          "nominal": 62.0,
          "warning_threshold": 78.0,
          "critical_threshold": 88.0
        }
      },
      "detected_anomalies": [],
      "active_scenario": null
    }
  }
}
```
