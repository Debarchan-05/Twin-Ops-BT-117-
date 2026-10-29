from typing import Dict, List, Tuple, Any
from backend.app.models.asset import Asset, SensorDefinition
from backend.app.config import settings


class HealthAssessmentResult:
    def __init__(
        self,
        health_score: float,
        health_condition: str,
        degradation_indicator: float,
        maintenance_priority: str,
        recommended_action: str,
        sensor_statuses: Dict[str, Dict[str, Any]],
        detected_anomalies: List[str],
        critical_violations: List[Dict[str, Any]],
        warning_violations: List[Dict[str, Any]],
    ):
        self.health_score = round(max(0.0, min(100.0, health_score)), 1)
        self.health_condition = health_condition
        self.degradation_indicator = round(max(0.0, min(100.0, degradation_indicator)), 1)
        self.maintenance_priority = maintenance_priority
        self.recommended_action = recommended_action
        self.sensor_statuses = sensor_statuses
        self.detected_anomalies = detected_anomalies
        self.critical_violations = critical_violations
        self.warning_violations = warning_violations

    def to_dict(self) -> Dict[str, Any]:
        return {
            "health_score": self.health_score,
            "health_condition": self.health_condition,
            "degradation_indicator": self.degradation_indicator,
            "maintenance_priority": self.maintenance_priority,
            "recommended_action": self.recommended_action,
            "sensor_statuses": self.sensor_statuses,
            "detected_anomalies": self.detected_anomalies,
            "critical_violations": self.critical_violations,
            "warning_violations": self.warning_violations,
        }


def assess_sensor_status(
    sensor: SensorDefinition,
    value: float,
    previous_status: str = "normal"
) -> Tuple[str, float, Optional[str], Optional[Dict[str, Any]]]:
    """
    Evaluates an individual sensor reading against warning and critical boundaries.
    Applies 5% hysteresis buffer to prevent state flapping at boundary edges.
    Returns: (status, penalty_points, anomaly_description, violation_info)
    """
    # 5% hysteresis band
    hysteresis_ratio = 0.05

    # Check upper limits
    warn_thresh = sensor.warning_threshold
    crit_thresh = sensor.critical_threshold
    nom_val = sensor.nominal_value

    status = "normal"
    penalty = 0.0
    anomaly = None
    violation_info = None

    # Check if value exceeds upper critical
    crit_buffer = crit_thresh - (crit_thresh - warn_thresh) * hysteresis_ratio if previous_status == "critical" else crit_thresh
    warn_buffer = warn_thresh - (warn_thresh - nom_val) * hysteresis_ratio if previous_status in ("warning", "critical") else warn_thresh

    # Upper threshold checks
    if value >= crit_buffer:
        status = "critical"
        # Severe penalty for critical breach (scaled by sensor weight)
        ratio = (value - crit_thresh) / max(1.0, sensor.max_valid - crit_thresh)
        penalty = 55.0 + min(35.0, ratio * 35.0)
        anomaly = f"{sensor.name} critically high at {value:.1f} {sensor.unit} (Critical limit: {crit_thresh:.1f} {sensor.unit})"
        violation_info = {
            "sensor_key": sensor.sensor_key,
            "severity": "critical",
            "measured": value,
            "threshold": crit_thresh,
            "message": anomaly
        }
    elif value >= warn_buffer:
        status = "warning"
        ratio = (value - warn_thresh) / max(1.0, crit_thresh - warn_thresh)
        penalty = 20.0 + min(25.0, ratio * 25.0)
        anomaly = f"{sensor.name} elevated at {value:.1f} {sensor.unit} (Warning limit: {warn_thresh:.1f} {sensor.unit})"
        violation_info = {
            "sensor_key": sensor.sensor_key,
            "severity": "warning",
            "measured": value,
            "threshold": warn_thresh,
            "message": anomaly
        }

    # Check lower threshold limits if configured (e.g. pressure/speed drops)
    if sensor.lower_critical_threshold is not None:
        low_crit = sensor.lower_critical_threshold
        low_crit_buf = low_crit + (sensor.lower_warning_threshold - low_crit) * hysteresis_ratio if previous_status == "critical" else low_crit
        if value <= low_crit_buf:
            status = "critical"
            penalty = max(penalty, 60.0)
            anomaly = f"{sensor.name} critically low at {value:.1f} {sensor.unit} (Min limit: {low_crit:.1f} {sensor.unit})"
            violation_info = {
                "sensor_key": sensor.sensor_key,
                "severity": "critical",
                "measured": value,
                "threshold": low_crit,
                "message": anomaly
            }
    elif sensor.lower_warning_threshold is not None:
        low_warn = sensor.lower_warning_threshold
        low_warn_buf = low_warn + (nom_val - low_warn) * hysteresis_ratio if previous_status in ("warning", "critical") else low_warn
        if value <= low_warn_buf and status != "critical":
            status = "warning"
            penalty = max(penalty, 25.0)
            anomaly = f"{sensor.name} depressed at {value:.1f} {sensor.unit} (Min limit: {low_warn:.1f} {sensor.unit})"
            violation_info = {
                "sensor_key": sensor.sensor_key,
                "severity": "warning",
                "measured": value,
                "threshold": low_warn,
                "message": anomaly
            }

    # Out of valid physical range check (sensor error)
    if value < sensor.min_valid or value > sensor.max_valid:
        status = "critical"
        penalty = 70.0
        anomaly = f"{sensor.name} sensor telemetry invalid/out-of-range: {value:.1f} {sensor.unit} (Valid range: {sensor.min_valid} to {sensor.max_valid})"
        violation_info = {
            "sensor_key": sensor.sensor_key,
            "severity": "critical",
            "measured": value,
            "threshold": sensor.max_valid if value > sensor.max_valid else sensor.min_valid,
            "message": anomaly
        }

    return status, penalty, anomaly, violation_info


def calculate_health_assessment(
    asset: Asset,
    metrics: Dict[str, float],
    previous_sensor_statuses: Optional[Dict[str, str]] = None
) -> HealthAssessmentResult:
    """
    Computes transparent, explainable asset health assessment:
    - Overall health score (0 to 100)
    - Condition: healthy (80-100), degraded (50-79), critical (<50)
    - Sensor-level breakdown and hysteresis
    - Direct critical override: If any sensor has a critical violation,
      the condition becomes critical regardless of aggregate baseline.
    - Wear and degradation indicator
    - Specific recommended maintenance actions
    """
    if previous_sensor_statuses is None:
        previous_sensor_statuses = {}

    total_weight = 0.0
    accumulated_penalty = 0.0
    sensor_statuses = {}
    detected_anomalies = []
    critical_violations = []
    warning_violations = []

    sensors = asset.sensors or []

    # If asset is stopped or offline, health behaves differently
    if asset.operational_status == "offline":
        return HealthAssessmentResult(
            health_score=asset.health_score,
            health_condition="offline",
            degradation_indicator=asset.degradation_indicator,
            maintenance_priority="low",
            recommended_action="Asset is offline. No live telemetry available.",
            sensor_statuses={s.sensor_key: {"status": "offline", "value": metrics.get(s.sensor_key, 0.0), "unit": s.unit} for s in sensors},
            detected_anomalies=["Asset connection offline"],
            critical_violations=[],
            warning_violations=[],
        )

    # Process each registered sensor
    for sensor in sensors:
        weight = max(0.1, sensor.weight)
        total_weight += weight
        val = metrics.get(sensor.sensor_key, sensor.nominal_value)
        prev_st = previous_sensor_statuses.get(sensor.sensor_key, "normal")

        status, penalty, anomaly, violation = assess_sensor_status(sensor, val, prev_st)

        sensor_statuses[sensor.sensor_key] = {
            "name": sensor.name,
            "value": round(val, 2),
            "unit": sensor.unit,
            "status": status,
            "nominal": sensor.nominal_value,
            "warning_threshold": sensor.warning_threshold,
            "critical_threshold": sensor.critical_threshold,
        }

        accumulated_penalty += penalty * weight

        if anomaly:
            detected_anomalies.append(anomaly)

        if violation:
            if violation["severity"] == "critical":
                critical_violations.append(violation)
            else:
                warning_violations.append(violation)

    # Weighted penalty calculation
    effective_penalty = (accumulated_penalty / total_weight) if total_weight > 0 else 0.0

    # Progressive wear factor: cumulative operating degradation
    wear_penalty = (asset.degradation_indicator * 0.25)
    base_score = 100.0 - effective_penalty - wear_penalty
    health_score = max(0.0, min(100.0, base_score))

    # CRITICAL RULE OVERRIDE:
    # A critical sensor violation must result in a critical alert and drop the health condition
    # to critical, capping the score at below the degraded threshold (e.g. 45.0 max).
    if len(critical_violations) > 0:
        if health_score >= settings.HEALTH_THRESHOLD_DEGRADED:
            health_score = min(health_score, settings.HEALTH_THRESHOLD_DEGRADED - 5.0)
        health_condition = "critical"
    elif len(warning_violations) > 0 or health_score < settings.HEALTH_THRESHOLD_HEALTHY:
        if health_score >= settings.HEALTH_THRESHOLD_HEALTHY:
            health_score = min(health_score, settings.HEALTH_THRESHOLD_HEALTHY - 3.0)
        health_condition = "degraded" if health_score >= settings.HEALTH_THRESHOLD_DEGRADED else "critical"
    else:
        health_condition = "healthy"

    # Maintenance Priority determination
    if health_condition == "critical":
        maintenance_priority = "critical"
    elif health_condition == "degraded" or asset.degradation_indicator > 65.0:
        maintenance_priority = "high"
    elif asset.degradation_indicator > 35.0 or len(warning_violations) > 0:
        maintenance_priority = "medium"
    else:
        maintenance_priority = "low"

    # Actionable Recommendation generation based on asset type and violations
    recommended_action = generate_recommendation(asset.asset_type, critical_violations, warning_violations, asset.degradation_indicator)

    return HealthAssessmentResult(
        health_score=health_score,
        health_condition=health_condition,
        degradation_indicator=asset.degradation_indicator,
        maintenance_priority=maintenance_priority,
        recommended_action=recommended_action,
        sensor_statuses=sensor_statuses,
        detected_anomalies=detected_anomalies,
        critical_violations=critical_violations,
        warning_violations=warning_violations,
    )


def generate_recommendation(
    asset_type: str,
    critical_violations: List[Dict[str, Any]],
    warning_violations: List[Dict[str, Any]],
    degradation_indicator: float
) -> str:
    """Produces explainable, actionable industrial maintenance recommendations."""
    crit_keys = [v["sensor_key"] for v in critical_violations]
    warn_keys = [v["sensor_key"] for v in warning_violations]

    if "temperature" in crit_keys or "bearing_temp" in crit_keys:
        return "CRITICAL: Urgent thermal overload detected. Shut down unit immediately and inspect bearing cooling & lubricant viscosity."

    if "vibration" in crit_keys:
        return "CRITICAL: Severe harmonic mechanical vibration. Immediate halt required: check dynamic unbalance, shaft alignment, and loose foundation bolts."

    if "current_amp" in crit_keys or "electrical_current" in crit_keys:
        return "CRITICAL: Severe stator electrical overcurrent. Inspect motor windings for inter-turn shorts and check driven load binding."

    if "pressure" in crit_keys or "flow_rate" in crit_keys:
        return "CRITICAL: Hydraulic delivery pressure/flow critical failure. Check for severe cavitation, suction pipe blockage, or discharge valve failure."

    if len(critical_violations) > 0:
        return "CRITICAL: Sensor critical bounds violated. Dispatch certified technician for emergency inspection."

    if "temperature" in warn_keys:
        return "WARNING: Elevated operating temperature. Verify cooling fan airflow, heat sink dust accumulation, and lubrication level."

    if "vibration" in warn_keys:
        return "WARNING: Elevated vibration detected. Schedule vibration spectrum analysis and inspect flexible shaft coupling wear."

    if "flow_rate" in warn_keys or "pressure" in warn_keys:
        return "WARNING: Hydraulic parameters fluctuating. Inspect suction strainer and pump impeller clearances at next planned downtime."

    if degradation_indicator > 70.0:
        return "ATTENTION: Advanced component wear accumulated. Schedule preventive overhaul and bearing replacement."

    if degradation_indicator > 40.0:
        return "NORMAL: Moderate mechanical wear. Maintain standard preventive maintenance and lubrication cycles."

    return "OPTIMAL: All sensor telemetry and operating conditions are nominal. Continue standard monitoring."
