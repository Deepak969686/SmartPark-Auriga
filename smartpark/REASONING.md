# SmartPark — Reasoning and Development Process

## 1. Understanding the Problem

The problem was approached as a parking operations system rather than only a parking-space database.

The main operational workflow is:

```text
Vehicle Arrival
      ↓
Identify Vehicle Type
      ↓
Find Compatible Available Spot
      ↓
Create Parking Session
      ↓
Vehicle Remains Parked
      ↓
Search / Monitor Session
      ↓
Vehicle Exit
      ↓
Calculate Fee
      ↓
Close Session
      ↓
Release Parking Spot
```

The implementation was designed around this workflow because check-in, check-out, spot assignment, and fee correctness are the primary operations.

---

# 2. Main Design Decisions

## 2.1 Full-Stack Architecture

A separate frontend and backend were used.

```text
React Frontend
      ↓
REST API
      ↓
FastAPI Backend
      ↓
SQLAlchemy
      ↓
SQLite Database
```

React was selected for the user interface so the application could provide a structured operations dashboard.

FastAPI was selected for the backend because it provides REST API support, request validation, and automatically generated Swagger documentation.

SQLite was used as the database because it provides a real relational database while keeping the competition project easy to run without requiring an external database server.

---

# 3. Database Design

The main entities are:

```text
User
Garage
ParkingSpot
ParkingSession
RateCard
```

The relationships are centered around the garage and parking session.

A garage contains multiple parking spots.

A parking session belongs to a garage and references the parking spot assigned to the vehicle.

A rate configuration belongs to a garage and defines the pricing rules used for billing.

---

# 4. Parking Spot Assignment

The parking system cannot assign any arbitrary spot to a vehicle.

The compatibility rules are:

```text
COMPACT Vehicle
    → COMPACT or STANDARD spot

STANDARD Vehicle
    → STANDARD spot

EV Vehicle
    → EV spot only
```

The backend first determines the allowed spot types and then searches for an unoccupied compatible spot.

This prevents an EV from being assigned to a normal parking spot.

The spot is marked occupied when the parking session is created.

When the session is completed, the spot is released.

---

# 5. Duplicate Vehicle Prevention

A vehicle should not have multiple active parking sessions.

Before creating a new session, the backend searches for an existing session with:

```text
same license plate
AND
status = PARKED
```

If one exists, the check-in request is rejected.

This prevents inconsistent parking records and multiple simultaneous assignments for the same vehicle.

---

# 6. Billing Logic

The billing system follows the required tiered-rate behavior.

The duration is calculated from:

```text
check-out time - check-in time
```

The duration is converted into billable hours using upward rounding.

Therefore:

```text
1 hour 1 minute → 2 billable hours

2 hours 20 minutes → 3 billable hours
```

The first billable hour uses the first-hour rate.

Remaining billable hours use the additional-hour rate.

The calculation is:

```text
If hours = 1:

Fee = first_hour_rate

Otherwise:

Fee =
first_hour_rate
+
(hours - 1) × additional_hour_rate
```

A daily cap is then applied.

---

# 7. Messy Rate Card — T4

The rate-card requirement introduced unclean input values.

Examples include:

```text
" compact "
"₹40"
"25/hr"
"₹200"
```

The backend normalizes the data before storing or using it.

The cleaning process includes:

```text
Spot type
    ↓
Trim whitespace
    ↓
Normalize case

Price
    ↓
Remove currency symbols
    ↓
Remove text such as /hr or /hour
    ↓
Convert to numeric value
```

For example:

```text
"₹40" → 40
"25/hr" → 25
"₹200" → 200
" compact " → COMPACT
```

The purpose is to make the billing logic independent of formatting noise in the input rate card.

---

# 8. Automatic 24-Hour Closure — T2

The second competition twist required a nightly automated process.

Instead of depending on a real operating-system cron job during the competition, the application exposes:

```text
POST /clock
```

This allows a supplied current time to be used to process active sessions.

The processing logic is conceptually:

```text
Get active parking sessions
        ↓
Calculate parked duration
        ↓
Duration > 24 hours?
        ↓
      Yes
        ↓
Calculate fee
        ↓
Set check-out time
        ↓
Set status = AUTO_CLOSED
        ↓
Release parking spot
```

Using a clock endpoint also makes the behavior easier to test because a future time can be supplied without waiting for 24 real hours.

---

# 9. Session Transfer — T6

The third competition twist represents a valet hand-off.

An active session can be transferred from one license plate to another.

Example:

```text
Before:

Plate       RJ14AB1234
Spot        A-12
Check-in    10:00 AM


After:

Plate       RJ14XY5678
Spot        A-12
Check-in    10:00 AM
```

The important rule is that the parking session itself is preserved.

The following values remain unchanged:

```text
Garage
Parking spot
Check-in time
```

Only the license plate is updated.

The operation is restricted to an active parking session.

---

# 10. Search and Large Parking Logs

Parking records can become large over time.

Returning every record at once would become inefficient and difficult to use.

Therefore the records API supports:

```text
Pagination
Search
Sorting
```

Pagination uses:

```text
page
limit
```

Search uses the license plate.

Sorting supports fields such as:

```text
check_in
check_out
fee
license_plate
status
```

The default ordering is descending check-in time so recent parking activity can be viewed first.

---

# 11. Authentication

The application provides:

```text
Registration
Login
Password hashing
```

Passwords are not stored directly as plain text.

During development, a bcrypt/passlib compatibility problem was discovered and fixed by installing:

```text
bcrypt==4.0.1
```

This restored password hashing and allowed registration to work correctly.

---

# 12. Frontend Design

The first implementation included a Streamlit frontend.

During development, the frontend was moved to React to provide a more structured application interface.

The React frontend contains:

```text
Landing Page
     ↓
Authentication
     ↓
Dashboard
     ├── Check In
     ├── Check Out
     ├── Parking Records
     └── Operations
          ├── Rate Card Import
          ├── Session Transfer
          └── Clock Processing
```

The dashboard displays parking availability and operational information.

Axios is used to communicate with the FastAPI REST API.

---

# 13. Testing Strategy

Testing was performed progressively instead of waiting until the end.

The main sequence was:

```text
Backend startup
      ↓
Swagger/API testing
      ↓
Database persistence
      ↓
Authentication
      ↓
Parking operations
      ↓
React frontend
      ↓
Frontend/backend integration
      ↓
Competition twists
```

---

# 14. Backend Testing

The backend was checked using the FastAPI Swagger interface.

The following operations were tested during development:

### Garage

```text
GET /api/garages
```

### Parking spots

```text
GET /api/garages/1/spots
```

### Check-in

```text
POST /api/parking/check-in
```

### Check-out

```text
POST /api/parking/check-out
```

### Availability

```text
GET /api/parking/availability
```

### Search

```text
GET /api/parking/search
```

### Sessions

```text
GET /api/parking/sessions
```

The parking workflow was tested for normal vehicles and EV vehicles.

Duplicate active check-in behavior was also tested.

---

# 15. Frontend Testing

The React application was started using:

```bash
npm run dev
```

The Vite server successfully started on:

```text
http://localhost:5173/
```

The frontend was then opened through the GitHub Codespaces forwarded port.

The following UI workflow was tested:

```text
Landing Page
     ↓
Register
     ↓
Login
     ↓
Dashboard
```

Registration initially failed because of a backend bcrypt compatibility issue.

After fixing the bcrypt dependency, registration succeeded and the application redirected to the sign-in page.

Login then successfully opened the SmartPark dashboard.

---

# 16. Issues Found and Fixes

## Issue 1 — Backend Module Error

### Problem

The backend was initially started from the repository root.

This caused:

```text
ModuleNotFoundError: No module named 'backend'
```

### Cause

The Python package path was based on the `smartpark` directory.

### Fix

The backend is started using:

```bash
cd /workspaces/SmartPark-Auriga/smartpark
uvicorn backend.main:app --reload
```

---

## Issue 2 — Frontend Empty Response

### Problem

The browser displayed:

```text
ERR_EMPTY_RESPONSE
```

for port 5173.

### Cause

The Vite development server was not actually running.

Some Vite output had been entered into the shell as commands rather than being produced by Vite.

### Fix

The frontend was started correctly with:

```bash
cd /workspaces/SmartPark-Auriga/smartpark/frontend-react
npm run dev
```

The server then reported:

```text
VITE v8.3.0 ready
Local: http://localhost:5173/
```

---

## Issue 3 — Registration Failed

### Problem

The React registration form displayed:

```text
Registration failed.
```

### Investigation

The FastAPI backend log showed:

```text
POST /api/auth/register
500 Internal Server Error
```

The traceback showed the failure inside password hashing.

The bcrypt backend also reported a compatibility issue involving:

```text
bcrypt.__about__.__version__
```

and the hashing process failed.

### Fix

The bcrypt package was replaced with:

```bash
pip uninstall bcrypt -y
pip install bcrypt==4.0.1
```

After restarting FastAPI, registration worked successfully.

---

# 17. Integration Testing

After the backend and frontend were running simultaneously:

```text
Backend → 8000
Frontend → 5173
```

the application was tested through the browser.

The successful authentication flow was:

```text
Create Account
      ↓
Account created successfully
      ↓
Sign In
      ↓
Dashboard
```

This confirmed that the React frontend could communicate with the FastAPI authentication API.

---

# 18. Error Handling

The backend returns appropriate HTTP errors for invalid operations.

Examples include:

```text
404
Resource not found

400
Invalid request or duplicate active vehicle

409
No suitable parking spot available
```

This allows the frontend to display meaningful operational messages rather than silently failing.

---

# 19. Data Integrity Considerations

Several checks were added to keep the parking state consistent.

### Check-in

```text
Vehicle must not already be parked
Spot must exist
Spot must be compatible
Spot must be available
```

### Check-out

```text
Active session must exist
Fee must be calculated
Session must be completed
Spot must be released
```

### Transfer

```text
Original active session must exist
New plate must not conflict with another active session
Existing spot and check-in information must remain unchanged
```

### Automatic Closure

```text
Only active sessions over the threshold are processed
Fee is calculated
Session is closed
Spot is released
```

---

# 20. Why the Implementation Uses REST APIs

The core operations are exposed through REST endpoints rather than being implemented only inside the frontend.

This provides a separation between:

```text
Presentation Layer
        ↓
API Layer
        ↓
Business Logic
        ↓
Database
```

The same backend APIs can therefore support the React frontend and future clients such as:

- Mobile applications
- Admin dashboards
- Automated systems

---

# 21. Final Validation Checklist

Before submission, the following should be checked:

```text
[ ] Public GitHub repository
[ ] README.md in root
[ ] REASONING.md in root
[ ] AI_LOGS.md in root
[ ] Backend starts
[ ] Frontend starts
[ ] Database works
[ ] Registration works
[ ] Login works
[ ] Garage data exists
[ ] Parking spots exist
[ ] Check-in works
[ ] Check-out works
[ ] Fee calculation works
[ ] EV restriction works
[ ] Duplicate parking is prevented
[ ] Vehicle search works
[ ] Pagination works
[ ] Sorting works
[ ] T4 messy rate import works
[ ] T4 imported rates affect billing
[ ] T2 clock endpoint works
[ ] T2 automatic closure works
[ ] T2 spot is released
[ ] T6 transfer works
[ ] T6 spot is preserved
[ ] T6 check-in time is preserved
```

---

# 22. Conclusion

The final design focuses on the most important parking operations first:

```text
Check-in
    ↓
Correct Spot Assignment
    ↓
Parking Session
    ↓
Correct Billing
    ↓
Check-out
```

The additional competition requirements were then integrated into the same workflow:

```text
T4 → Clean messy rate data
T2 → Automatically process long-running sessions
T6 → Transfer active parking sessions
```

This keeps the system modular while allowing the core parking workflow and the additional requirements to use the same database and business logic.
