from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.alert import Alert
from backend.app.schemas.alert import AlertResponse, AlertUpdate

router = APIRouter(prefix="/alerts", tags=["alerts"])


def utc_now():
    return datetime.now(timezone.utc)


@router.get("", response_model=List[AlertResponse])
def get_alerts(
    asset_id: Optional[str] = Query(None, description="Filter by asset ID"),
    severity: Optional[str] = Query(None, description="warning or critical"),
    status: Optional[str] = Query(None, description="active, acknowledged, or resolved"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)

    if asset_id:
        query = query.filter(Alert.asset_id == asset_id)
    if severity:
        query = query.filter(Alert.severity == severity)
    if status:
        query = query.filter(Alert.status == status)

    return query.order_by(Alert.timestamp.desc()).offset(offset).limit(limit).all()


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert '{alert_id}' not found."
        )
    return alert


@router.patch("/{alert_id}", response_model=AlertResponse)
def update_alert(alert_id: str, alert_in: AlertUpdate, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert '{alert_id}' not found."
        )

    now = utc_now()

    if alert_in.status:
        if alert_in.status == "acknowledged":
            alert.status = "acknowledged"
            alert.acknowledged_at = now
            if alert_in.acknowledged_by:
                alert.acknowledged_by = alert_in.acknowledged_by
        elif alert_in.status == "resolved":
            alert.status = "resolved"
            alert.resolved_at = now
            if alert_in.resolution_notes:
                alert.resolution_notes = alert_in.resolution_notes

    if alert_in.acknowledged_by and not alert.acknowledged_by:
        alert.acknowledged_by = alert_in.acknowledged_by
    if alert_in.resolution_notes:
        alert.resolution_notes = alert_in.resolution_notes

    db.commit()
    db.refresh(alert)
    return alert
