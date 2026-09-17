import math
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    ParkingSpot,
    ParkingSession,
    Garage,
    RateCard
)
from ..schemas import (
    CheckInRequest,
    CheckOutRequest,
    TransferRequest
)

router = APIRouter(
    prefix="/api/parking",
    tags=["Parking"]
)


# =========================================================
# FEE CALCULATION
# =========================================================

def calculate_fee(
    check_in: datetime,
    check_out: datetime,
    first_hour_rate: float,
    additional_hour_rate: float,
    daily_cap: float
):
    """
    Calculate parking fee.

    Rules:
    - Part-hours are rounded up.
    - First hour uses first_hour_rate.
    - Additional hours use additional_hour_rate.
    - Daily cap is applied per 24-hour billing block.
    """

    duration_seconds = (
        check_out - check_in
    ).total_seconds()

    # At least 1 billable hour.
    hours = max(
        1,
        math.ceil(duration_seconds / 3600)
    )

    if hours == 1:
        fee = first_hour_rate
    else:
        fee = (
            first_hour_rate
            + (hours - 1) * additional_hour_rate
        )

    # Apply daily cap.
    #
    # Each started 24-hour period has its own cap.
    days = math.ceil(hours / 24)

    fee = min(
        fee,
        days * daily_cap
    )

    return round(fee, 2), hours


# =========================================================
# RATE LOOKUP
# =========================================================

def get_rate_for_spot(
    db: Session,
    garage: Garage,
    spot_type: str
):
    """
    Get the rate for a specific garage + spot type.

    T4 uses RateCard as the primary source.

    Old Garage rates are kept as a fallback so that
    existing garages continue working if a rate card
    has not been imported yet.
    """

    normalized_type = spot_type.strip().upper()

    rate = (
        db.query(RateCard)
        .filter(
            RateCard.garage_id == garage.id,
            RateCard.spot_type == normalized_type
        )
        .first()
    )

    if rate:
        return (
            rate.first_hour_rate,
            rate.additional_hour_rate,
            rate.daily_cap
        )

    # Backward-compatible fallback.
    return (
        garage.first_hour_rate,
        garage.additional_hour_rate,
        garage.daily_cap
    )


# =========================================================
# CHECK-IN
# =========================================================

@router.post("/check-in")
def check_in(
    data: CheckInRequest,
    db: Session = Depends(get_db)
):
    garage = db.query(Garage).filter(
        Garage.id == data.garage_id
    ).first()

    if not garage:
        raise HTTPException(
            status_code=404,
            detail="Garage not found"
        )

    plate = data.license_plate.strip().upper()
    vehicle_type = data.vehicle_type.strip().upper()

    # -----------------------------------------------------
    # Prevent duplicate active parking
    # -----------------------------------------------------

    existing = db.query(ParkingSession).filter(
        ParkingSession.license_plate == plate,
        ParkingSession.status == "PARKED"
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Vehicle is already parked"
        )

    # -----------------------------------------------------
    # Validate vehicle type
    # -----------------------------------------------------

    if vehicle_type not in {
        "COMPACT",
        "STANDARD",
        "EV"
    }:
        raise HTTPException(
            status_code=400,
            detail="Invalid vehicle type"
        )

    # -----------------------------------------------------
    # Determine allowed spot types
    # -----------------------------------------------------

    # EV MUST use EV spot.
    if vehicle_type == "EV":
        allowed_types = ["EV"]

    # Standard vehicle uses Standard spot.
    elif vehicle_type == "STANDARD":
        allowed_types = ["STANDARD"]

    # Compact vehicle can use Compact or Standard.
    else:
        allowed_types = [
            "COMPACT",
            "STANDARD"
        ]

    # -----------------------------------------------------
    # Find available spot
    # -----------------------------------------------------

    spot = db.query(ParkingSpot).filter(
        ParkingSpot.garage_id == data.garage_id,
        ParkingSpot.spot_type.in_(allowed_types),
        ParkingSpot.is_occupied == False
    ).first()

    if not spot:
        raise HTTPException(
            status_code=409,
            detail="No suitable parking spot available"
        )

    # -----------------------------------------------------
    # Occupy spot
    # -----------------------------------------------------

    spot.is_occupied = True

    session = ParkingSession(
        garage_id=data.garage_id,
        spot_id=spot.id,
        license_plate=plate,
        vehicle_type=vehicle_type,
        check_in=datetime.utcnow(),
        status="PARKED"
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "message": "Vehicle checked in successfully",
        "session_id": session.id,
        "license_plate": plate,
        "spot": spot.spot_number,
        "spot_type": spot.spot_type,
        "check_in": session.check_in
    }


# =========================================================
# CHECK-OUT
# =========================================================

@router.post("/check-out")
def check_out(
    data: CheckOutRequest,
    db: Session = Depends(get_db)
):
    plate = data.license_plate.strip().upper()

    # -----------------------------------------------------
    # Find active session
    # -----------------------------------------------------

    session = db.query(ParkingSession).filter(
        ParkingSession.license_plate == plate,
        ParkingSession.status == "PARKED"
    ).first()

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Active parking session not found"
        )

    # -----------------------------------------------------
    # Get garage
    # -----------------------------------------------------

    garage = db.query(Garage).filter(
        Garage.id == session.garage_id
    ).first()

    if not garage:
        raise HTTPException(
            status_code=404,
            detail="Garage not found"
        )

    # -----------------------------------------------------
    # Get spot
    # -----------------------------------------------------

    spot = db.query(ParkingSpot).filter(
        ParkingSpot.id == session.spot_id
    ).first()

    if not spot:
        raise HTTPException(
            status_code=404,
            detail="Parking spot not found"
        )

    check_out_time = datetime.utcnow()

    # -----------------------------------------------------
    # T4 — Get rate according to spot type
    # -----------------------------------------------------

    (
        first_hour_rate,
        additional_hour_rate,
        daily_cap
    ) = get_rate_for_spot(
        db,
        garage,
        spot.spot_type
    )

    # -----------------------------------------------------
    # Calculate fee
    # -----------------------------------------------------

    fee, billable_hours = calculate_fee(
        session.check_in,
        check_out_time,
        first_hour_rate,
        additional_hour_rate,
        daily_cap
    )

    # -----------------------------------------------------
    # Close session
    # -----------------------------------------------------

    session.check_out = check_out_time
    session.fee = fee
    session.status = "COMPLETED"
    session.close_reason = "NORMAL"

    # Release spot.
    spot.is_occupied = False

    db.commit()

    return {
        "message": "Vehicle checked out successfully",
        "license_plate": plate,
        "spot": spot.spot_number,
        "spot_type": spot.spot_type,
        "billable_hours": billable_hours,
        "fee": fee,
        "check_out": check_out_time
    }


# =========================================================
# T6 — TRANSFER OPEN SESSION
# =========================================================

@router.post("/transfer")
def transfer_session(
    data: TransferRequest,
    db: Session = Depends(get_db)
):
    """
    Transfer an active parking session to another plate.

    This represents a valet hand-off.

    The following remain unchanged:
        - session ID
        - parking spot
        - entry time
        - garage
        - status

    Only the license plate changes.
    """

    old_plate = data.old_license_plate.strip().upper()
    new_plate = data.new_license_plate.strip().upper()

    # -----------------------------------------------------
    # Validate plates
    # -----------------------------------------------------

    if not old_plate:
        raise HTTPException(
            status_code=400,
            detail="Old license plate is required"
        )

    if not new_plate:
        raise HTTPException(
            status_code=400,
            detail="New license plate is required"
        )

    if old_plate == new_plate:
        raise HTTPException(
            status_code=400,
            detail="New license plate must be different"
        )

    # -----------------------------------------------------
    # Find active old session
    # -----------------------------------------------------

    session = db.query(ParkingSession).filter(
        ParkingSession.license_plate == old_plate,
        ParkingSession.status == "PARKED"
    ).first()

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Active parking session not found for old plate"
        )

    # -----------------------------------------------------
    # Make sure new plate is not already parked
    # -----------------------------------------------------

    existing_new_plate = db.query(ParkingSession).filter(
        ParkingSession.license_plate == new_plate,
        ParkingSession.status == "PARKED"
    ).first()

    if existing_new_plate:
        raise HTTPException(
            status_code=400,
            detail="New license plate already has an active parking session"
        )

    # -----------------------------------------------------
    # Preserve original information
    # -----------------------------------------------------

    session_id = session.id
    spot_id = session.spot_id
    check_in = session.check_in

    # -----------------------------------------------------
    # Change ONLY the plate
    # -----------------------------------------------------

    session.license_plate = new_plate

    db.commit()
    db.refresh(session)

    return {
        "message": "Parking session transferred successfully",
        "session_id": session_id,
        "old_license_plate": old_plate,
        "new_license_plate": new_plate,
        "spot_id": spot_id,
        "check_in": check_in,
        "status": session.status
    }


# =========================================================
# SEARCH VEHICLE
# =========================================================

@router.get("/search")
def search_vehicle(
    plate: str,
    db: Session = Depends(get_db)
):
    sessions = db.query(ParkingSession).filter(
        ParkingSession.license_plate.contains(
            plate.strip().upper()
        )
    ).all()

    return sessions


# =========================================================
# PARKING SESSIONS
# =========================================================

@router.get("/sessions")
def get_sessions(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str = "",
    sort_by: str = "check_in",
    order: str = "desc",
    db: Session = Depends(get_db)
):
    query = db.query(ParkingSession)

    # -----------------------------------------------------
    # Search
    # -----------------------------------------------------

    if search:
        query = query.filter(
            ParkingSession.license_plate.contains(
                search.strip().upper()
            )
        )

    # -----------------------------------------------------
    # Sorting
    # -----------------------------------------------------

    allowed_sort_fields = {
        "check_in": ParkingSession.check_in,
        "check_out": ParkingSession.check_out,
        "fee": ParkingSession.fee,
        "license_plate": ParkingSession.license_plate,
        "status": ParkingSession.status
    }

    sort_column = allowed_sort_fields.get(
        sort_by,
        ParkingSession.check_in
    )

    if order.lower() == "asc":
        query = query.order_by(
            sort_column.asc()
        )
    else:
        query = query.order_by(
            sort_column.desc()
        )

    # -----------------------------------------------------
    # Pagination
    # -----------------------------------------------------

    total = query.count()

    sessions = query.offset(
        (page - 1) * limit
    ).limit(limit).all()

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": math.ceil(total / limit) if total else 0,
        "data": sessions
    }


# =========================================================
# AVAILABILITY
# =========================================================

@router.get("/availability")
def availability(
    garage_id: int,
    spot_type: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(ParkingSpot).filter(
        ParkingSpot.garage_id == garage_id
    )

    if spot_type:
        query = query.filter(
            ParkingSpot.spot_type == spot_type.upper()
        )

    spots = query.all()

    return {
        "total": len(spots),
        "available": sum(
            not spot.is_occupied
            for spot in spots
        ),
        "occupied": sum(
            spot.is_occupied
            for spot in spots
        ),
        "spots": [
            {
                "id": spot.id,
                "level": spot.level,
                "spot_number": spot.spot_number,
                "spot_type": spot.spot_type,
                "available": not spot.is_occupied
            }
            for spot in spots
        ]
    }