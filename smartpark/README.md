# SmartPark

SmartPark is a full-stack parking garage management system for managing vehicle check-in, parking spot assignment, check-out, billing, vehicle search, parking records, and automated parking operations.

The system is designed to work with multiple garages and supports Compact, Standard, and EV parking spots.

---

## Features

- User registration and login
- Multi-garage support
- Vehicle check-in and check-out
- Automatic parking spot assignment
- Vehicle-type compatible spot assignment
- EV-only parking spots for EV vehicles
- Automatic parking fee calculation
- First-hour and additional-hour rates
- Part-hour rounding
- Daily parking caps
- Vehicle search by license plate
- Parking session history
- Pagination
- Sorting
- Parking availability monitoring
- Messy rate-card import and normalization
- Automatic closure of sessions parked for more than 24 hours
- Parking session transfer to another license plate
- React-based operations dashboard
- FastAPI REST backend
- SQLite database

---

# Technology Stack

## Frontend

- React
- Vite
- JavaScript
- Axios
- HTML
- CSS

## Backend

- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- Pydantic
- Passlib
- bcrypt

## Database

- SQLite

## Development

- Git
- GitHub
- GitHub Codespaces
- VS Code

---

# Project Structure

```text
SmartPark-Auriga/
│
├── .venv/
│
├── smartpark/
│   │
│   ├── backend/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── auth.py
│   │   │
│   │   └── routes/
│   │       ├── auth.py
│   │       ├── garages.py
│   │       ├── parking.py
│   │       ├── rates.py
│   │       └── clock.py
│   │
│   ├── frontend-react/
│   │   ├── src/
│   │   │   ├── App.jsx
│   │   │   ├── App.css
│   │   │   ├── index.css
│   │   │   └── main.jsx
│   │   │
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   ├── tests/
│   └── requirements.txt
│
├── README.md
├── REASONING.md
└── AI_LOGS.md
```

---

# Requirements

Make sure the following are installed:

- Python 3.10+
- Node.js
- npm
- Git

The project was developed and tested in GitHub Codespaces.

---

# Backend Setup

## 1. Go to the repository

```bash
cd /workspaces/SmartPark-Auriga
```

## 2. Activate the virtual environment

```bash
source .venv/bin/activate
```

If the virtual environment does not exist:

```bash
python -m venv .venv
source .venv/bin/activate
```

## 3. Install Python dependencies

```bash
cd smartpark
pip install -r requirements.txt
```

---

# Start the Backend

From:

```text
/workspaces/SmartPark-Auriga/smartpark
```

run:

```bash
uvicorn backend.main:app --reload
```

The backend runs on:

```text
http://127.0.0.1:8000
```

FastAPI Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

Keep this terminal running.

---

# Frontend Setup

Open a second terminal.

```bash
cd /workspaces/SmartPark-Auriga/smartpark/frontend-react
```

Install dependencies:

```bash
npm install
```

Install Axios if required:

```bash
npm install axios
```

---

# Start the Frontend

Run:

```bash
npm run dev
```

The React development server runs on:

```text
http://localhost:5173
```

In GitHub Codespaces, open port `5173` from the **PORTS** panel.

---

# Running Both Services

Two terminals should remain running.

### Terminal 1 — Backend

```bash
cd /workspaces/SmartPark-Auriga
source .venv/bin/activate
cd smartpark
uvicorn backend.main:app --reload
```

Backend:

```text
Port 8000
```

### Terminal 2 — Frontend

```bash
cd /workspaces/SmartPark-Auriga/smartpark/frontend-react
npm run dev
```

Frontend:

```text
Port 5173
```

---

# API Endpoints

All API endpoints use the FastAPI backend running on port `8000`.

---

## Authentication

### Register User

```http
POST /api/auth/register
```

Example request:

```json
{
  "name": "Deepak Kumar Saini",
  "email": "deepak@example.com",
  "password": "Test@12345"
}
```

### Login

```http
POST /api/auth/login
```

Example request:

```json
{
  "email": "deepak@example.com",
  "password": "Test@12345"
}
```

---

# Garage APIs

### Get Garages

```http
GET /api/garages
```

Returns the available garages.

### Get Garage Parking Spots

```http
GET /api/garages/{garage_id}/spots
```

Example:

```http
GET /api/garages/1/spots
```

---

# Parking APIs

## Check In

```http
POST /api/parking/check-in
```

Example:

```json
{
  "garage_id": 1,
  "license_plate": "RJ14AB1234",
  "vehicle_type": "COMPACT"
}
```

Supported vehicle types:

```text
COMPACT
STANDARD
EV
```

The system automatically finds a compatible available parking spot.

---

## Check Out

```http
POST /api/parking/check-out
```

Example:

```json
{
  "license_plate": "RJ14AB1234"
}
```

The system calculates the parking fee and releases the occupied spot.

---

## Search Vehicle

```http
GET /api/parking/search?plate=RJ14
```

The search supports partial license-plate matching.

---

## Parking Sessions

```http
GET /api/parking/sessions
```

Supported query parameters:

```text
page
limit
search
sort_by
order
```

Example:

```http
GET /api/parking/sessions?page=1&limit=10&search=RJ14&sort_by=check_in&order=desc
```

Supported sorting fields:

```text
check_in
check_out
fee
license_plate
status
```

Supported order:

```text
asc
desc
```

---

## Parking Availability

```http
GET /api/parking/availability?garage_id=1
```

Optional spot-type filter:

```http
GET /api/parking/availability?garage_id=1&spot_type=EV
```

The response provides:

- Total spots
- Available spots
- Occupied spots
- Individual spot availability

---

# Rate Card APIs

## Get Garage Rates

```http
GET /api/rates/{garage_id}
```

Example:

```http
GET /api/rates/1
```

---

## Import Rate Card

```http
POST /api/rates/import
```

The rate import supports messy values and normalizes them before storing them.

Example:

```json
{
  "garage_id": 1,
  "rates": [
    {
      "spot_type": " compact ",
      "first_hour_rate": "₹40",
      "additional_hour_rate": "25/hr",
      "daily_cap": "₹200"
    },
    {
      "spot_type": "STANDARD",
      "first_hour_rate": "50",
      "additional_hour_rate": "₹30/hour",
      "daily_cap": "300"
    },
    {
      "spot_type": " ev ",
      "first_hour_rate": "₹70",
      "additional_hour_rate": "40/hr",
      "daily_cap": "₹400"
    }
  ]
}
```

---

# Automated Clock Processing

## Process Parking Clock

```http
POST /clock
```

Example:

```json
{
  "current_time": "2026-09-17T23:00:00"
}
```

The endpoint processes active parking sessions against the supplied current time.

Sessions parked for more than 24 hours are automatically:

1. Closed
2. Billed
3. Marked as `AUTO_CLOSED`
4. Released from their parking spot

---

# Session Transfer

## Transfer an Active Session

```http
POST /api/parking/transfer
```

Example:

```json
{
  "old_license_plate": "RJ14AB1234",
  "new_license_plate": "RJ14XY5678"
}
```

The transfer preserves the existing:

- Garage
- Parking spot
- Check-in time

Only the license plate associated with the active session changes.

This represents a valet hand-off scenario.

---

# Parking Assignment Rules

The system prevents incompatible parking assignments.

| Vehicle Type | Allowed Spot Types |
|--------------|--------------------|
| COMPACT | COMPACT, STANDARD |
| STANDARD | STANDARD |
| EV | EV |

An EV vehicle cannot be assigned to a normal Compact or Standard parking spot.

---

# Billing Rules

The system uses tiered hourly pricing.

For a parking duration of up to one hour:

```text
Fee = First Hour Rate
```

For longer parking:

```text
Fee =
First Hour Rate
+
(Additional Billable Hours × Additional Hour Rate)
```

Part-hours are rounded upward.

Example:

```text
Parking duration = 2 hours 20 minutes

Billable hours = 3
```

A daily cap is applied to prevent the calculated fee from exceeding the configured maximum for each 24-hour period.

---

# Example Rate Configuration

The project uses the following sample rate configuration:

| Spot Type | First Hour | Additional Hour | Daily Cap |
|-----------|------------|-----------------|-----------|
| COMPACT | ₹40 | ₹25 | ₹200 |
| STANDARD | ₹50 | ₹30 | ₹300 |
| EV | ₹70 | ₹40 | ₹400 |

These rates are project configuration values used for the parking-rate demonstration.

---

# Competition Requirements Implemented

## Core Parking Operations

- Vehicle check-in
- Vehicle check-out
- Compatible spot assignment
- EV parking restriction
- Fee calculation
- Vehicle search
- Parking records
- Pagination
- Sorting

## T4 — Messy Rate Card

Messy rate values are cleaned and converted into usable numeric rates before billing.

Example:

```text
"₹40"       → 40
"25/hr"     → 25
"₹200"      → 200
" compact " → COMPACT
```

## T2 — Automatic 24-Hour Closure

The `/clock` endpoint processes sessions exceeding the 24-hour threshold and automatically closes, bills, and releases them.

## T6 — Session Transfer

An active session can be transferred to another license plate while preserving its garage, parking spot, and original check-in time.

---

# Debugging

## Backend Import Error

The backend must be started from the `smartpark` directory:

```bash
cd /workspaces/SmartPark-Auriga/smartpark
uvicorn backend.main:app --reload
```

Starting Uvicorn from the repository root with:

```bash
uvicorn backend.main:app --reload
```

can cause:

```text
ModuleNotFoundError: No module named 'backend'
```

---

## Frontend Empty Response

If the browser shows:

```text
ERR_EMPTY_RESPONSE
```

make sure the Vite server is actually running:

```bash
cd /workspaces/SmartPark-Auriga/smartpark/frontend-react
npm run dev
```

The terminal should display:

```text
VITE ready
Local: http://localhost:5173/
```

---

## Registration / bcrypt Error

If registration produces a bcrypt compatibility error, reinstall the compatible bcrypt version:

```bash
pip uninstall bcrypt -y
pip install bcrypt==4.0.1
```

Then restart FastAPI:

```bash
uvicorn backend.main:app --reload
```

---

# Verification Checklist

Before submission, verify:

- [ ] Backend starts successfully
- [ ] Swagger documentation opens
- [ ] React frontend starts successfully
- [ ] User registration works
- [ ] User login works
- [ ] Garage data is available
- [ ] Parking spots are displayed
- [ ] Compact check-in works
- [ ] Standard check-in works
- [ ] EV check-in uses EV spot
- [ ] Duplicate active vehicle is rejected
- [ ] Check-out calculates a fee
- [ ] Spot becomes available after check-out
- [ ] Vehicle search works
- [ ] Records pagination works
- [ ] Records sorting works
- [ ] Messy rate import works
- [ ] Imported rates affect billing
- [ ] `/clock` processes sessions over 24 hours
- [ ] Automatic closure releases the spot
- [ ] Session transfer preserves spot and check-in time
- [ ] README.md is present in repository root
- [ ] REASONING.md is present in repository root
- [ ] AI_LOGS.md is present in repository root

---

# Submission

The final repository should be public on GitHub.

The repository root should contain:

```text
README.md
REASONING.md
AI_LOGS.md
```

Submit the public GitHub repository URL.
