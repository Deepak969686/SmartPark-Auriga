from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint
)
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Garage(Base):
    __tablename__ = "garages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String)

    # Kept for backward compatibility with the existing database.
    # New fee calculation will use RateCard.
    first_hour_rate = Column(Float, default=50)
    additional_hour_rate = Column(Float, default=30)
    daily_cap = Column(Float, default=300)

    spots = relationship(
        "ParkingSpot",
        back_populates="garage",
        cascade="all, delete-orphan"
    )

    rate_cards = relationship(
        "RateCard",
        back_populates="garage",
        cascade="all, delete-orphan"
    )


class ParkingSpot(Base):
    __tablename__ = "parking_spots"

    id = Column(Integer, primary_key=True, index=True)
    garage_id = Column(Integer, ForeignKey("garages.id"))
    level = Column(Integer, nullable=False)
    spot_number = Column(String, nullable=False)
    spot_type = Column(String, nullable=False)
    is_occupied = Column(Boolean, default=False)

    garage = relationship(
        "Garage",
        back_populates="spots"
    )


class RateCard(Base):
    """
    Parking rates for each spot type in a garage.

    Example:
        COMPACT  -> 40 / 25 / 200
        STANDARD -> 50 / 30 / 300
        EV       -> 70 / 40 / 400
    """

    __tablename__ = "rate_cards"

    id = Column(Integer, primary_key=True, index=True)

    garage_id = Column(
        Integer,
        ForeignKey("garages.id"),
        nullable=False,
        index=True
    )

    spot_type = Column(
        String,
        nullable=False
    )

    first_hour_rate = Column(
        Float,
        nullable=False
    )

    additional_hour_rate = Column(
        Float,
        nullable=False
    )

    daily_cap = Column(
        Float,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    garage = relationship(
        "Garage",
        back_populates="rate_cards"
    )

    __table_args__ = (
        UniqueConstraint(
            "garage_id",
            "spot_type",
            name="uq_garage_spot_type_rate"
        ),
    )


class ParkingSession(Base):
    __tablename__ = "parking_sessions"

    id = Column(Integer, primary_key=True, index=True)

    garage_id = Column(
        Integer,
        ForeignKey("garages.id")
    )

    spot_id = Column(
        Integer,
        ForeignKey("parking_spots.id")
    )

    license_plate = Column(
        String,
        index=True,
        nullable=False
    )

    vehicle_type = Column(
        String,
        nullable=False
    )

    check_in = Column(
        DateTime,
        default=datetime.utcnow
    )

    check_out = Column(
        DateTime,
        nullable=True
    )

    fee = Column(
        Float,
        nullable=True
    )

    status = Column(
        String,
        default="PARKED"
    )

    # NORMAL = attendant checked out
    # AUTO_24H = automatically closed by /clock
    close_reason = Column(
        String,
        nullable=True
    )