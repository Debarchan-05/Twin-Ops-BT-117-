from datetime import datetime
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.asset import Asset
from backend.app.models.telemetry import TelemetryReading
from backend.app.schemas.telemetry import (
    TelemetryReadingResponse,
    LatestTelemetryMap,
)
from backend.app.schemas.asset import AssetHealthDetail
from backend.app.analytics.health_engine import calculate_health_assessment

router = APIRouter(tags=["telemetry"])


@router.get("/assets/{asset_id}/telemetry", response_model=List[TelemetryReadingResponse])
def get_asset_telemetry(
    asset_id: str,
    start_time: Optional[datetime] = Query(None, description="Start timestamp UTC"),
    end_time: Optional[datetime] = Query(None, description="End timestamp UTC"),
    limit: int = Query(100, ge=1, le=1000, description="Max readings to return"),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset '{asset_id}' not found."
        )

    query = db.query(TelemetryReading).filter(TelemetryReading.asset_id == asset_id)

    if start_time:
        query = query.filter(TelemetryReading.timestamp >= start_time)
    if end_time:
        query = query.filter(TelemetryReading.timestamp <= end_time)

    # Return chronological order for charts (oldest to newest)
    readings = query.order_by(TelemetryReading.timestamp.desc()).offset(offset).limit(limit).all()
    return list(reversed(readings))


@router.get("/assets/{asset_id}/telemetry/latest", response_model=TelemetryReadingResponse)
def get_latest_telemetry_for_asset(asset_id: str, db: Session = Depends(get_db)):
    reading = (
        db.query(TelemetryReading)
        .filter(TelemetryReading.asset_id == asset_id)
        .order_by(TelemetryReading.timestamp.desc())
        .first()
    )
    if not reading:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No telemetry found for asset '{asset_id}'."
        )
    return reading


@router.get("/telemetry/latest", response_model=Dict[str, TelemetryReadingResponse])
def get_all_latest_telemetry(db: Session = Depends(get_db)):
    assets = db.query(Asset).all()
    result = {}
    for asset in assets:
        reading = (
            db.query(TelemetryReading)
            .filter(TelemetryReading.asset_id == asset.id)
            .order_by(TelemetryReading.timestamp.desc())
            .first()
        )
        if reading:
            result[asset.id] = reading
    return result


@router.get("/assets/{asset_id}/health", response_model=AssetHealthDetail)
def get_asset_health(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset '{asset_id}' not found."
        )

    reading = (
        db.query(TelemetryReading)
        .filter(TelemetryReading.asset_id == asset_id)
        .order_by(TelemetryReading.timestamp.desc())
        .first()
    )

    metrics = reading.metrics if reading else {}
    assessment = calculate_health_assessment(asset, metrics)

    return AssetHealthDetail(
        asset_id=asset.id,
        name=asset.name,
        asset_type=asset.asset_type,
        operational_status=asset.operational_status,
        health_score=assessment.health_score,
        health_condition=assessment.health_condition,
        degradation_indicator=assessment.degradation_indicator,
        maintenance_priority=assessment.maintenance_priority,
        recommended_action=assessment.recommended_action,
        sensor_statuses=assessment.sensor_statuses,
        active_anomalies=assessment.detected_anomalies,
        timestamp=reading.timestamp if reading else asset.updated_at,
    )
