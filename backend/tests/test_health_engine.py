from backend.app.analytics.health_engine import (
    calculate_health_assessment,
    assess_sensor_status,
)
from backend.app.models.asset import Asset, SensorDefinition


def test_nominal_telemetry_results_in_healthy(sample_motor):
    nominal_metrics = {
        "temperature": 60.0,
        "vibration": 1.5,
    }
    result = calculate_health_assessment(sample_motor, nominal_metrics)
    assert result.health_condition == "healthy"
    assert result.health_score >= 80.0
    assert len(result.detected_anomalies) == 0
    assert len(result.critical_violations) == 0
    assert len(result.warning_violations) == 0
    assert result.maintenance_priority == "low"


def test_warning_threshold_triggers_degraded(sample_motor):
    # Warning threshold for temperature is 75.0 (critical is 85.0)
    warning_metrics = {
        "temperature": 77.5,
        "vibration": 1.5,
    }
    result = calculate_health_assessment(sample_motor, warning_metrics)
    assert result.health_condition == "degraded"
    assert 50.0 <= result.health_score < 80.0
    assert len(result.warning_violations) == 1
    assert result.warning_violations[0]["sensor_key"] == "temperature"
    assert len(result.critical_violations) == 0


def test_critical_threshold_triggers_critical_override(sample_motor):
    """
    Requirement 5: Critical sensor violations must be able to trigger a critical alert
    even if the aggregate health score is relatively high.
    """
    # Critical threshold for temperature is 85.0.
    critical_metrics = {
        "temperature": 92.0,
        "vibration": 1.5,  # vibration is completely normal
    }
    result = calculate_health_assessment(sample_motor, critical_metrics)
    assert result.health_condition == "critical"
    assert result.health_score < 50.0  # Capped or dropped to critical
    assert len(result.critical_violations) == 1
    assert result.critical_violations[0]["sensor_key"] == "temperature"
    assert result.maintenance_priority == "critical"
    assert "thermal overload" in result.recommended_action.lower() or "urgent" in result.recommended_action.lower()


def test_hysteresis_behavior():
    sensor = SensorDefinition(
        asset_id="test",
        sensor_key="temp",
        name="Temp",
        unit="°C",
        min_valid=0.0,
        max_valid=120.0,
        warning_threshold=70.0,
        critical_threshold=90.0,
        nominal_value=50.0,
        weight=1.0,
    )
    # When already critical, value slightly below critical threshold (e.g. 89.5) stays critical
    status, _, _, _ = assess_sensor_status(sensor, 89.5, previous_status="critical")
    assert status == "critical"

    # If it was normal, 89.5 is warning (<90)
    status_normal, _, _, _ = assess_sensor_status(sensor, 89.5, previous_status="normal")
    assert status_normal == "warning"


def test_invalid_sensor_reading_detected_as_critical(sample_motor):
    # Valid range for temperature is -20 to 150
    invalid_metrics = {
        "temperature": 999.0,
        "vibration": 1.5,
    }
    result = calculate_health_assessment(sample_motor, invalid_metrics)
    assert result.health_condition == "critical"
    assert any("out-of-range" in a or "invalid" in a for a in result.detected_anomalies)
