from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Garage, ParkingSpot
from ..schemas import GarageCreate, SpotCreate

router = APIRouter(
    prefix="/api/garages",
    tags=["Garages"]
)


@router.post("")
def create_garage(
    data: GarageCreate,
    db: Session = Depends(get_db)
):
    garage = Garage(**data.model_dump())

    db.add(garage)
    db.commit()
    db.refresh(garage)

    return garage


@router.get("")
def get_garages(
    db: Session = Depends(get_db)
):
    return db.query(Garage).all()


@router.get("/{garage_id}")
def get_garage(
    garage_id: int,
    db: Session = Depends(get_db)
):
    garage = db.query(Garage).filter(
        Garage.id == garage_id
    ).first()

    if not garage:
        raise HTTPException(
            status_code=404,
            detail="Garage not found"
        )

    return garage


@router.post("/{garage_id}/spots")
def create_spot(
    garage_id: int,
    data: SpotCreate,
    db: Session = Depends(get_db)
):
    garage = db.query(Garage).filter(
        Garage.id == garage_id
    ).first()

    if not garage:
        raise HTTPException(
            status_code=404,
            detail="Garage not found"
        )

    spot_type = data.spot_type.upper()

    if spot_type not in {
        "COMPACT",
        "STANDARD",
        "EV"
    }:
        raise HTTPException(
            status_code=400,
            detail="Invalid spot type"
        )

    spot = ParkingSpot(
        garage_id=garage_id,
        level=data.level,
        spot_number=data.spot_number,
        spot_type=spot_type
    )

    db.add(spot)
    db.commit()
    db.refresh(spot)

    return spot


@router.get("/{garage_id}/spots")
def get_spots(
    garage_id: int,
    db: Session = Depends(get_db)
):
    return db.query(ParkingSpot).filter(
        ParkingSpot.garage_id == garage_id
    ).all()