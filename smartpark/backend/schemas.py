from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# =========================================================
# AUTH
# =========================================================

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


# =========================================================
# GARAGE
# =========================================================

class GarageCreate(BaseModel):
    name: str
    address: str = ""
    first_hour_rate: float = 50
    additional_hour_rate: float = 30
    daily_cap: float = 300


# =========================================================
# PARKING SPOT
# =========================================================

class SpotCreate(BaseModel):
    level: int
    spot_number: str
    spot_type: str


# =========================================================
# PARKING
# =========================================================

class CheckInRequest(BaseModel):
    garage_id: int
    license_plate: str
    vehicle_type: str


class CheckOutRequest(BaseModel):
    license_plate: str


# =========================================================
# T6 — VALET TRANSFER
# =========================================================

class TransferRequest(BaseModel):
    old_license_plate: str
    new_license_plate: str


class TransferResponse(BaseModel):
    session_id: int
    old_license_plate: str
    new_license_plate: str
    spot_id: int
    check_in: datetime
    status: str


# =========================================================
# T4 — RATE CARD
# =========================================================

class RateCardItem(BaseModel):
    """
    Raw rate-card row.

    Strings are intentional because T4 contains messy data,
    for example:
        "₹40"
        "40/hr"
        " 40 "
    """

    spot_type: str
    first_hour_rate: str
    additional_hour_rate: str
    daily_cap: str


class RateCardImportRequest(BaseModel):
    garage_id: int
    rates: list[RateCardItem]


class RateCardResponse(BaseModel):
    id: int
    garage_id: int
    spot_type: str
    first_hour_rate: float
    additional_hour_rate: float
    daily_cap: float

    class Config:
        from_attributes = True


# =========================================================
# T2 — APPLICATION CLOCK
# =========================================================

class ClockRequest(BaseModel):
    """
    Optional simulated application time.

    If current_time is omitted, the server uses UTC now.
    """

    current_time: datetime | None = None