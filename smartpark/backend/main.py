from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine, SessionLocal
from .models import Garage, ParkingSpot
from .routes import auth, garages, parking, rates, clock


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartPark API",
    description="Parking Garage Management System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth.router)
app.include_router(garages.router)
app.include_router(parking.router)
app.include_router(rates.router)
app.include_router(clock.router)


@app.get("/")
def root():
    return {
        "message": "SmartPark API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


def seed_database():
    db = SessionLocal()

    try:
        if db.query(Garage).count() > 0:
            return

        garage = Garage(
            name="City Center Garage",
            address="Downtown",
            first_hour_rate=50,
            additional_hour_rate=30,
            daily_cap=300
        )

        db.add(garage)
        db.commit()
        db.refresh(garage)

        spots = []

        for i in range(1, 6):
            spots.append(
                ParkingSpot(
                    garage_id=garage.id,
                    level=1,
                    spot_number=f"C-{i:02d}",
                    spot_type="COMPACT"
                )
            )

        for i in range(1, 11):
            spots.append(
                ParkingSpot(
                    garage_id=garage.id,
                    level=1,
                    spot_number=f"S-{i:02d}",
                    spot_type="STANDARD"
                )
            )

        for i in range(1, 6):
            spots.append(
                ParkingSpot(
                    garage_id=garage.id,
                    level=2,
                    spot_number=f"EV-{i:02d}",
                    spot_type="EV"
                )
            )

        db.add_all(spots)
        db.commit()

    finally:
        db.close()


seed_database()