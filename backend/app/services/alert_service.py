from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.alert import Alert


def utc_now():
    return datetime.now(timezone.utc)


def process_violations(
    db: Session,
    asset_id: str,
    critical_violations: List[Dict[str, Any]],
    warning_violations: List[Dict[str, Any]]
) -> List[Alert]:
    """
    Evaluates violation events for an asset and manages alert creation with deduplication:
    - If an active alert already exists for (asset_id, sensor_key), updates latest measured value
      rather than flooding the database with duplicate records.
    - If severity escalated from warning to critical, updates the alert severity.
    - Returns list of newly created or updated Alert objects.
    """
    new_alerts = []
    all_violations = critical_violations + warning_violations

    for viol in all_violations:
        sensor_key = viol["sensor_key"]
        severity = viol["severity"]
        measured = viol["measured"]
        thresh = viol["threshold"]
        message = viol["message"]

        # Look for existing active/acknowledged alert for this asset and sensor
        existing = db.query(Alert).filter(
            Alert.asset_id == asset_id,
            Alert.sensor_key == sensor_key,
            Alert.status.in_(["active", "acknowledged"])
        ).first()

        if existing:
            # Update measured value and threshold
            existing.measured_value = measured
            existing.threshold_value = thresh
            # Escalate if changed to critical
            if severity == "critical" and existing.severity == "warning":
                existing.severity = "critical"
                existing.title = f"CRITICAL: {sensor_key.replace('_', ' ').title()} Limit Exceeded"
                existing.description = message
        else:
            # Create a brand new alert
            title = f"{severity.upper()}: {sensor_key.replace('_', ' ').title()} Limit Exceeded"
            alert = Alert(
                asset_id=asset_id,
                severity=severity,
                title=title,
                description=message,
                sensor_key=sensor_key,
                measured_value=measured,
                threshold_value=thresh,
                timestamp=utc_now(),
                status="active",
            )
            db.add(alert)
            new_alerts.append(alert)

    return new_alerts
