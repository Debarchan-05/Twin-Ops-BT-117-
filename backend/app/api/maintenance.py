from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.asset import Asset
from backend.app.models.maintenance import MaintenanceRecord
from backend.app.schemas.maintenance import (
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceResponse,
)

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


def utc_now():
    return datetime.now(timezone.utc)


@router.get("", response_model=List[MaintenanceResponse])
def get_maintenance_records(
    asset_id: Optional[str] = Query(None, description="Filter by asset ID"),
    status: Optional[str] = Query(None, description="scheduled, in_progress, completed, cancelled"),
    priority: Optional[str] = Query(None, description="low, medium, high, critical"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(MaintenanceRecord)

    if asset_id:
        query = query.filter(MaintenanceRecord.asset_id == asset_id)
    if status:
        query = query.filter(MaintenanceRecord.status == status)
    if priority:
        query = query.filter(MaintenanceRecord.priority == priority)

    return query.order_by(MaintenanceRecord.scheduled_date.desc()).offset(offset).limit(limit).all()


@router.post("", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance_record(record_in: MaintenanceCreate, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == record_in.asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset '{record_in.asset_id}' not found."
        )

    record = MaintenanceRecord(**record_in.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.patch("/{record_id}", response_model=MaintenanceResponse)
def update_maintenance_record(record_id: str, record_in: MaintenanceUpdate, db: Session = Depends(get_db)):
    record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance record '{record_id}' not found."
        )

    update_data = record_in.model_dump(exclude_unset=True)

    # If marking completed and completed_date not supplied, set to now
    if update_data.get("status") == "completed" and "completed_date" not in update_data:
        record.completed_date = utc_now()

    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record
