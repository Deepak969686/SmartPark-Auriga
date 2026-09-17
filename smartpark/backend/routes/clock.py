from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ParkingSession, ParkingSpot, Garage
from ..schemas import ClockRequest
from .parking import calculate_fee, get_rate_for_spot


router = APIRouter(
    tags=["Clock"]
)


# =========================================================
# T2 — POST /clock
# =========================================================

@router.post("/clock")
def run_clock(
    data: ClockRequest | None = None,
    db: Session = Depends(get_db)
):
    """
    Run the nightly parking automation.

    Any active parking session parked for MORE than
    24 hours is automatically:

        1. Billed
        2. Closed
        3. Marked AUTO_24H
        4. Its parking spot is released

    An optional current_time can be supplied for testing.
    """

    # -----------------------------------------------------
    # Determine current application time
    # -----------------------------------------------------

    if data and data.current_time:
        current_time = data.current_time

        # Keep the application clock naive because the
        # existing project stores naive UTC datetimes.
        if current_time.tzinfo is not None:
            current_time = current_time.replace(tzinfo=None)

    else:
        current_time = datetime.utcnow()

    cutoff_time = current_time - timedelta(hours=24)

    # -----------------------------------------------------
    # Find active sessions older than 24 hours
    # -----------------------------------------------------

    sessions = (
        db.query(ParkingSession)
        .filter(
            ParkingSession.status == "PARKED",
            ParkingSession.check_in < cutoff_time
        )
        .all()
    )

    auto_closed = []

    # -----------------------------------------------------
    # Process each expired session
    # -----------------------------------------------------

    for session in sessions:

        garage = (
            db.query(Garage)
            .filter(
                Garage.id == session.garage_id
            )
            .first()
        )

        spot = (
            db.query(ParkingSpot)
            .filter(
                ParkingSpot.id == session.spot_id
            )
            .first()
        )

        if not garage or not spot:
            continue

        # -------------------------------------------------
        # T4 — Use rate for the actual spot type
        # -------------------------------------------------

        (
            first_hour_rate,
            additional_hour_rate,
            daily_cap
        ) = get_rate_for_spot(
            db,
            garage,
            spot.spot_type
        )

        # -------------------------------------------------
        # Calculate final fee
        # -------------------------------------------------

        fee, billable_hours = calculate_fee(
            session.check_in,
            current_time,
            first_hour_rate,
            additional_hour_rate,
            daily_cap
        )

        # -------------------------------------------------
        # Automatically close session
        # -------------------------------------------------

        session.check_out = current_time
        session.fee = fee
        session.status = "AUTO_CLOSED"
        session.close_reason = "AUTO_24H"

        # -------------------------------------------------
        # Release parking spot
        # -------------------------------------------------

        spot.is_occupied = False

        auto_closed.append(
            {
                "session_id": session.id,
                "license_plate": session.license_plate,
                "spot_id": spot.id,
                "spot_number": spot.spot_number,
                "spot_type": spot.spot_type,
                "billable_hours": billable_hours,
                "fee": fee,
                "check_in": session.check_in,
                "check_out": current_time
            }
        )

    db.commit()

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {
        "message": "Clock job completed",
        "current_time": current_time,
        "auto_closed_count": len(auto_closed),
        "sessions": auto_closed
    }