import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Garage, RateCard
from ..schemas import RateCardImportRequest


router = APIRouter(
    prefix="/api/rates",
    tags=["Rate Cards"]
)


# =========================================================
# HELPERS
# =========================================================

def clean_spot_type(value: str) -> str:
    """Normalize spot type names."""

    if not value:
        raise ValueError("Spot type is required")

    normalized = value.strip().upper()

    aliases = {
        "COMPACT": "COMPACT",
        "COM": "COMPACT",
        "STANDARD": "STANDARD",
        "STD": "STANDARD",
        "EV": "EV",
        "E.V.": "EV",
        "ELECTRIC": "EV",
        "ELECTRIC VEHICLE": "EV",
    }

    if normalized not in aliases:
        raise ValueError(f"Invalid spot type: {value}")

    return aliases[normalized]


def clean_rate(value: str) -> float:
    """
    Convert messy rate values into a number.

    Examples:
        ₹40       -> 40.0
        ₹ 40      -> 40.0
        40/hr     -> 40.0
        40 / hour -> 40.0
        " 40 "     -> 40.0
    """

    if value is None:
        raise ValueError("Rate is required")

    text = str(value).strip()

    # Remove commas and currency symbols/text.
    text = text.replace(",", "")
    text = text.replace("₹", "")
    text = text.replace("$", "")
    text = text.replace("INR", "")
    text = text.replace("Rs.", "")
    text = text.replace("Rs", "")

    # Extract the first valid number.
    match = re.search(r"\d+(?:\.\d+)?", text)

    if not match:
        raise ValueError(f"Invalid rate: {value}")

    rate = float(match.group())

    if rate < 0:
        raise ValueError(f"Rate cannot be negative: {value}")

    return rate


# =========================================================
# T4 — IMPORT MESSY RATE CARD
# =========================================================

@router.post("/import")
def import_rate_card(
    request: RateCardImportRequest,
    db: Session = Depends(get_db)
):
    """
    Import and clean a messy rate card.

    Rates are stored per garage + spot type.
    """

    # -----------------------------------------------------
    # Check garage
    # -----------------------------------------------------

    garage = (
        db.query(Garage)
        .filter(Garage.id == request.garage_id)
        .first()
    )

    if not garage:
        raise HTTPException(
            status_code=404,
            detail="Garage not found"
        )

    cleaned_rates = []
    seen_types = set()

    # -----------------------------------------------------
    # Clean and validate each row
    # -----------------------------------------------------

    for item in request.rates:

        try:
            spot_type = clean_spot_type(item.spot_type)

            first_hour = clean_rate(
                item.first_hour_rate
            )

            additional_hour = clean_rate(
                item.additional_hour_rate
            )

            daily_cap = clean_rate(
                item.daily_cap
            )

        except ValueError as exc:

            raise HTTPException(
                status_code=400,
                detail=str(exc)
            )

        # Prevent duplicate spot types in one import.
        if spot_type in seen_types:
            raise HTTPException(
                status_code=400,
                detail=f"Duplicate rate for {spot_type}"
            )

        seen_types.add(spot_type)

        # Basic pricing validation.
        if daily_cap < first_hour:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Daily cap for {spot_type} "
                    "cannot be lower than first-hour rate"
                )
            )

        cleaned_rates.append(
            {
                "spot_type": spot_type,
                "first_hour_rate": first_hour,
                "additional_hour_rate": additional_hour,
                "daily_cap": daily_cap,
            }
        )

    # -----------------------------------------------------
    # Save / update rates
    # -----------------------------------------------------

    saved_rates = []

    for rate in cleaned_rates:

        existing = (
            db.query(RateCard)
            .filter(
                RateCard.garage_id == request.garage_id,
                RateCard.spot_type == rate["spot_type"]
            )
            .first()
        )

        if existing:

            existing.first_hour_rate = rate["first_hour_rate"]
            existing.additional_hour_rate = rate[
                "additional_hour_rate"
            ]
            existing.daily_cap = rate["daily_cap"]

            saved = existing

        else:

            saved = RateCard(
                garage_id=request.garage_id,
                spot_type=rate["spot_type"],
                first_hour_rate=rate["first_hour_rate"],
                additional_hour_rate=rate[
                    "additional_hour_rate"
                ],
                daily_cap=rate["daily_cap"]
            )

            db.add(saved)

        saved_rates.append(saved)

    db.commit()

    # Refresh objects so IDs are available.
    for rate in saved_rates:
        db.refresh(rate)

    return {
        "message": "Rate card imported successfully",
        "garage_id": request.garage_id,
        "rates": [
            {
                "id": rate.id,
                "spot_type": rate.spot_type,
                "first_hour_rate": rate.first_hour_rate,
                "additional_hour_rate": rate.additional_hour_rate,
                "daily_cap": rate.daily_cap,
            }
            for rate in saved_rates
        ]
    }


# =========================================================
# GET CURRENT RATES
# =========================================================

@router.get("/{garage_id}")
def get_rate_card(
    garage_id: int,
    db: Session = Depends(get_db)
):
    """Get the current rate card for a garage."""

    garage = (
        db.query(Garage)
        .filter(Garage.id == garage_id)
        .first()
    )

    if not garage:
        raise HTTPException(
            status_code=404,
            detail="Garage not found"
        )

    rates = (
        db.query(RateCard)
        .filter(RateCard.garage_id == garage_id)
        .order_by(RateCard.spot_type)
        .all()
    )

    return {
        "garage_id": garage_id,
        "rates": [
            {
                "id": rate.id,
                "spot_type": rate.spot_type,
                "first_hour_rate": rate.first_hour_rate,
                "additional_hour_rate": rate.additional_hour_rate,
                "daily_cap": rate.daily_cap,
            }
            for rate in rates
        ]
    }