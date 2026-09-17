# SmartPark — Smart Parking Garage Management System

SmartPark is a full-stack parking garage management system designed to help parking attendants efficiently manage vehicles, parking spots, billing, and parking records.

The system supports multiple garages and different parking spot types including Compact, Standard, and EV spots.

---

## 🚗 What is SmartPark?

SmartPark replaces manual parking management with a centralized digital system.

Parking attendants can:

- Register vehicles at entry
- Automatically assign compatible parking spots
- Handle EV-specific parking requirements
- Check vehicles out
- Calculate parking fees automatically
- Search vehicles by license plate
- View and sort parking records
- Paginate large parking logs
- Import messy parking rate cards
- Transfer an active parking session to another license plate
- Automatically close and bill sessions parked for more than 24 hours

---

# ✨ Key Features

## 1. Vehicle Check-In

- Register vehicle using license plate
- Select vehicle type
- Automatically assign an available compatible parking spot
- Prevent duplicate active parking sessions
- EV vehicles can only be assigned to EV spots

Supported vehicle types:

- COMPACT
- STANDARD
- EV

---

## 2. Vehicle Check-Out

The system calculates the parking fee based on:

- First-hour rate
- Additional hourly rate
- Part-hours rounded up
- Daily maximum cap

Example:

If a vehicle stays for 2 hours and 30 minutes, it is billed for 3 hours.

---

## 3. Parking Spot Management

Supported spot types:

| Spot Type | Compatible Vehicle |
|-----------|--------------------|
| COMPACT | Compact, Standard |
| STANDARD | Standard |
| EV | EV |

The system tracks:

- Total spots
- Available spots
- Occupied spots
- EV availability
- Spot level
- Spot number
- Spot type

---

## 4. Vehicle Search

Parking attendants can search parking records using a license plate.

The system supports:

- Partial plate search
- Active session lookup
- Historical parking records

---

## 5. Parking Records

Parking records support:

- Pagination
- Searching
- Sorting
- Ascending order
- Descending order

Sortable fields include:

- License plate
- Check-in time
- Check-out time
- Fee
- Status

---

# 🧩 Competition Twists

SmartPark also implements the additional competition requirements.

## T4 — Messy Rate Card Import

The system accepts messy rate-card data such as:

```text
" compact "
"₹40"
"25/hr"
"₹200"
