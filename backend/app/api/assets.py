from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.asset import Asset, SensorDefinition
from backend.app.schemas.asset import (
    AssetCreate,
    AssetUpdate,
    AssetResponse,
)

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("", response_model=List[AssetResponse])
def get_assets(
    asset_type: Optional[str] = Query(None, description="Filter by asset type"),
    operational_status: Optional[str] = Query(None, description="Filter by status (running, stopped, offline)"),
    health_condition: Optional[str] = Query(None, description="Filter by condition (healthy, degraded, critical)"),
    search: Optional[str] = Query(None, description="Search by name, ID or location"),
    db: Session = Depends(get_db)
):
    query = db.query(Asset)

    if asset_type:
        query = query.filter(Asset.asset_type == asset_type)
    if operational_status:
        query = query.filter(Asset.operational_status == operational_status)
    if health_condition:
        query = query.filter(Asset.health_condition == health_condition)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Asset.name.ilike(search_fmt)) |
            (Asset.id.ilike(search_fmt)) |
            (Asset.location.ilike(search_fmt))
        )

    return query.order_by(Asset.name).all()


@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(asset_in: AssetCreate, db: Session = Depends(get_db)):
    existing = db.query(Asset).filter(Asset.id == asset_in.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Asset with ID '{asset_in.id}' already exists."
        )

    asset_data = asset_in.model_dump(exclude={"sensors"})
    asset = Asset(**asset_data)
    db.add(asset)
    db.flush()

    if asset_in.sensors:
        for sensor_data in asset_in.sensors:
            sensor = SensorDefinition(asset_id=asset.id, **sensor_data.model_dump())
            db.add(sensor)

    db.commit()
    db.refresh(asset)
    return asset


@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset '{asset_id}' not found."
        )
    return asset


@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(asset_id: str, asset_in: AssetUpdate, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset '{asset_id}' not found."
        )

    update_data = asset_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asset, field, value)

    db.commit()
    db.refresh(asset)
    return asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset '{asset_id}' not found."
        )

    db.delete(asset)
    db.commit()
    return None
