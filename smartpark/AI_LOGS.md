Today 2:41 PM

Round 2 — "Builder" Round (overview)

Round 2 is a hands-on, timed build round that assesses how a candidate approaches an open-ended, real-world problem end to end.

- Duration: 2.5 hours. This is a strict limit — submissions after the window closes will not be accepted.
- The problem: Each candidate receives a short, real-world problem brief (a storyline plus one twist). Beyond the brief and the required deliverables below, no further specification is given — candidates are expected to work out the features and design themselves.
- AI tools: Candidates may freely use any AI assistant or tool (for example, GitHub Copilot) to interpret the problem and build their solution.
- Tech stack: Candidates may use any language and framework they are comfortable with.
- Environment: All coding is done online in GitHub Codespaces, accessed with the candidate's college email ID.

Problem assignment

Each candidate's assigned problem is listed, student-wise, in the sheet below — please ensure every candidate works on their own allotted problem:

https://docs.google.com/spreadsheets/d/1KnpL2zTgyh6FxIPt7hLjsSU1TG_xdOVF/edit?usp=sharing&ouid=113305145576875992418&rtpof=true&sd=true

What every solution must include (mandatory)

Each submission is expected to be a working full-stack product. Every solution must include:
- A database (real persistence with a sensible schema).
- REST APIs for the core operations — and the candidate must list these endpoints in the README.
- A usable UI over those APIs.
- User registration and login.
- Search.
- A one-page landing page for the product (what it is, key features, target audience, how it helps, and three features they would build next).
- Pagination and sorting

Submission

The final solution must be a public GitHub repository, with the following three files in the root folder (used for evaluation):
- README.md — how to set up, run and debug the project, plus the list of API endpoints.
- REASONING.md — the thought process behind the solution, including how they tested and fixed issues.
- AI_LOGS.md — the complete conversation with the AI tool, pasted as-is. It must not be modified in any way; any alteration will lead to a deduction of marks.

Candidates submit the public GitHub repository URL through this form:
https://forms.gle/AXK2WcMVNE8cU3SWA

Please note again that the 2.5-hour limit is strict — any submission received after the window closes will not be entertained.

We would be grateful if you could circulate this to the participating students. Please feel free to reach out for any clarification.

I need to build a a solution according the given problem statement in collage competeiotion withn 2.5 hours understand

Yes. This round is very different from a normal DSA/coding round. They are testing whether you can take an unfamiliar real-world problem and turn it into a working full-stack product in 2.5 hours, while using AI effectively.

Based on the rules you shared, you should prepare around a repeatable architecture + execution strategy, not around one particular project.

1. What they are actually testing

You will receive something like:

"Build a system for managing college buses..."
Twist: "Network connectivity is unreliable."

They won't tell you:

exact database schema
exact UI
exact APIs
exact pages
exact features
exact technology

You have to decide these yourself.

So the real test is:

Problem → Requirements → Design → Database → APIs → UI → Authentication → Search → Pagination/Sorting → Testing → Documentation

2. Mandatory features = your checklist

Whatever problem they give you, your application must have these:

Requirement	Must implement
Database	✅
Real persistence	✅
REST APIs	✅
UI	✅
Registration	✅
Login	✅
Search	✅
Pagination	✅
Sorting	✅
Landing page	✅
README.md	✅
REASONING.md	✅
AI_LOGS.md	✅
Public GitHub repo	✅

The biggest mistake would be:

Spending 2 hours making a beautiful UI and then realizing authentication/API/database/documentation isn't finished.

3. The stack I recommend for YOUR competition

Because you already have experience with Python + FastAPI + Streamlit, you should avoid learning a new stack during the competition.

I'd use:

Frontend
   ↓
Streamlit
   ↓
FastAPI REST API
   ↓
SQLAlchemy
   ↓
SQLite

Authentication:

JWT

Database:

SQLite

Deployment isn't required unless specifically asked.

Why SQLite?

Because in a 2.5-hour competition:

SQLite

is much safer than:

PostgreSQL

You need:

zero database server setup
one .db file
real persistence
SQL queries
easy Codespaces execution

You can still use SQLAlchemy so your architecture looks professional.

4. The universal architecture

Whatever problem they give you, think:

                    ┌───────────────────┐
                    │   Landing Page    │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │ Register / Login  │
                    └─────────┬─────────┘
                              │ JWT
                              ↓
                    ┌───────────────────┐
                    │    Streamlit UI   │
                    └─────────┬─────────┘
                              │ HTTP
                              ↓
                    ┌───────────────────┐
                    │   FastAPI REST    │
                    │       APIs        │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │    SQLAlchemy     │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │      SQLite       │
                    └───────────────────┘

This architecture can solve many different problem briefs.

5. Your standard folder structure

I would memorize this.

project/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   └── routes/
│       ├── auth.py
│       └── items.py
│
├── frontend/
│   └── app.py
│
├── tests/
│   └── test_api.py
│
├── .env
├── .gitignore
├── requirements.txt
├── README.md
├── REASONING.md
└── AI_LOGS.md

Where items changes according to the problem.

For example, if the problem is a bus system:

buses.py
routes.py

If it's a library:

books.py

If it's an event system:

events.py
6. The most important trick: identify the CORE entity

When you receive the problem, immediately ask:

"What is the main thing this application manages?"

Examples:

College bus
User
Bus
Route
Trip
Library
User
Book
BorrowRecord
Food delivery
User
Restaurant
Food
Order
Job portal
User
Job
Application
Company
Complaint management
User
Complaint
Category
Status

Usually you need only 2–4 important tables.

Don't create 10 tables because it looks professional.

In a 2.5-hour round:

Simple + working > complicated + unfinished

7. Authentication

Keep authentication simple.

Registration
POST /api/auth/register

Input:

{
  "name": "Deepak",
  "email": "deepak@example.com",
  "password": "password123"
}
Login
POST /api/auth/login

Return:

{
  "access_token": "...",
  "token_type": "bearer"
}

Then protected APIs use:

Authorization: Bearer <token>

You don't need to build an enterprise authentication system.

8. Your CRUD API pattern

Suppose the problem's main entity is Book.

You should automatically think:

POST   /api/books
GET    /api/books
GET    /api/books/{id}
PUT    /api/books/{id}
DELETE /api/books/{id}

Then add:

Search
GET /api/books?search=python
Pagination
GET /api/books?page=1&limit=10
Sorting
GET /api/books?sort_by=created_at&order=desc

And ideally combine them:

GET /api/books?search=python&page=1&limit=10&sort_by=title&order=asc

This single endpoint can satisfy search + pagination + sorting.

9. Database schema pattern

For almost every competition problem:

users
-----
id
name
email
password_hash
created_at

Then your main entity:

items
-----
id
title
description
status
created_at
updated_at

Then add problem-specific fields.

For example:

buses
-----
id
bus_number
driver_name
route
status
latitude
longitude
created_at

Don't over-engineer the schema.

10. Landing page

They explicitly require this.

So your Streamlit application should start with:

========================================

          COLLEGE BUS TRACKER

Track college buses in real time.

[ Get Started ]    [ Login ]

----------------------------------------

Key Features

🚌 Live Bus Tracking
🔔 Breakdown Notifications
🔎 Search Buses
📊 Route Management

----------------------------------------

Who is it for?

Students
Drivers
Transport Administrators

----------------------------------------

How it helps

...

----------------------------------------

Coming Next

1. Push Notifications
2. Mobile Application
3. Route Optimization

========================================

This can be done in 10–15 minutes.

11. The 2.5-hour strategy

This is probably the most important part.

You have:

150 minutes

Do NOT think:

"I have plenty of time."

You don't.

Use this schedule:

0–10 min — Understand

Read the problem carefully.

Write:

Actors:
Entities:
Core workflow:
Twist:
Required features:

Then decide the MVP.

10–20 min — Architecture

Decide:

Frontend → Streamlit
Backend → FastAPI
Database → SQLite
ORM → SQLAlchemy
Auth → JWT

Create the folders.

20–60 min — Backend

Build:

database
models
schemas
authentication
CRUD APIs
search
pagination
sorting

Backend is your priority.

60–95 min — Frontend

Build:

Landing page
Register
Login
Dashboard
List
Search
Sort
Pagination
Create/Edit/Delete

Don't spend 30 minutes choosing colors.

95–110 min — Integration

Test:

Register
↓
Login
↓
Get token
↓
Create
↓
Read
↓
Search
↓
Sort
↓
Pagination
↓
Update
↓
Delete
110–125 min — Twist

Now implement the special twist.

This is important.

If the problem says:

"Internet connectivity may be unreliable"

Don't build a complete offline synchronization engine.

Build a simple demonstrable solution:

Last known data
↓
local/session storage
↓
display when API unavailable
↓
sync when connection returns

The twist should be visible in your product.

125–140 min — Documentation

Create:

README.md
REASONING.md
AI_LOGS.md
140–150 min — Final verification

Check:

□ App runs
□ Database works
□ Register works
□ Login works
□ APIs work
□ Search works
□ Pagination works
□ Sorting works
□ UI works
□ Twist works
□ README exists
□ REASONING exists
□ AI_LOGS exists
□ Git status clean
□ GitHub repository public

Then push.

12. How you should use AI during the competition

This is where your Round 2 is different.

Don't ask AI:

"Build my entire project."

That can give you 2,000 lines of code that you don't understand and then debugging becomes horrible.

Instead use AI like a senior developer sitting beside you.

Step 1

Give AI the problem:

Analyze this problem. Identify actors, entities, core workflow, database schema, REST endpoints, UI pages and the special twist. Prioritize an MVP that can be completed in 2.5 hours.

Then get the plan.

Step 2

Ask:

Create the minimal project structure for this solution using FastAPI, SQLAlchemy, SQLite and Streamlit. Keep the implementation simple and competition-ready.

Step 3

Build backend piece by piece.

For example:

Implement SQLAlchemy models and SQLite database for the following entities...

Then:

Implement registration and JWT login.

Then:

Implement CRUD APIs.

Then:

Add search, pagination and sorting to GET /api/items.

Step 4

Frontend:

Build a simple Streamlit UI consuming these FastAPI APIs. Include landing page, registration, login, dashboard, search, sorting and pagination. Keep the UI functional rather than visually complex.

Step 5

Debugging:

Give AI the actual error.

Here is the exact error:
[paste error]

Here is the relevant code:
[paste code]

Find the root cause and give the smallest fix.

This is much better than:

"My project isn't working."

13. VERY IMPORTANT: AI_LOGS.md

They specifically say:

complete conversation with AI tool, pasted as-is

and:

must not be modified

So during the competition, keep the AI conversation/log from the tool you use.

At the end:

AI_LOGS.md

should contain the conversation exactly as required by their instructions.

Do not clean it.

Do not rewrite it.

Do not summarize it.

Do not remove embarrassing errors.

14. REASONING.md is different

This is your engineering reasoning, not the AI conversation.

Example:

# Reasoning

## 1. Problem Understanding

The system is designed to...

## 2. Actors

- Student
- Driver
- Admin

## 3. Core Workflow

Student logs in...
Driver updates...
Admin monitors...

## 4. Technology Choices

FastAPI:
Used for REST APIs because...

SQLite:
Used because...

Streamlit:
Used for rapid UI development...

## 5. Database Design

Users...
Buses...
Routes...

## 6. API Design

...

## 7. Special Twist

The problem required...

I implemented...

## 8. Testing

Tested registration...
Tested login...
Tested search...
Tested pagination...
Tested sorting...

## 9. Problems Encountered

...

## 10. Fixes

...
15. README.md

Your README should allow the evaluator to run the project quickly.

Structure:

# Project Name

## Overview

## Features

## Tech Stack

## Architecture

## Project Structure

## Installation

## Environment Variables

## Running Backend

## Running Frontend

## API Endpoints

## Database Schema

## Search

## Pagination

## Sorting

## Authentication

## Testing

## Debugging

## Future Improvements

Especially make the API table clear:

Method	Endpoint	Purpose	Auth
POST	/api/auth/register	Register	No
POST	/api/auth/login	Login	No
GET	/api/items	List items	Yes
POST	/api/items	Create	Yes
GET	/api/items/{id}	Get item	Yes
PUT	/api/items/{id}	Update	Yes
DELETE	/api/items/{id}	Delete	Yes
16. What NOT to do

These can kill your submission.

❌ Don't build microservices
Auth service
User service
Notification service
Analytics service
...

No.

Use one FastAPI application.

❌ Don't use React if you aren't extremely fast with it

React is excellent, but this is a 150-minute competition.

For you, Streamlit + FastAPI gives you much faster implementation.

❌ Don't spend 40 minutes on CSS

Evaluator needs:

working product

not:

Dribbble-level UI.

❌ Don't add unnecessary AI

If the problem is:

Library management system

you don't need:

LLM
RAG
LangChain
Vector DB
Agents

unless AI actually solves the problem.

❌ Don't make 15 database tables

Keep it minimal.

❌ Don't forget the twist

The twist is likely there to distinguish solutions.

17. Your mental template during the exam

When you open the problem, immediately write this:

PROBLEM
↓
Who uses it?
↓
What are they trying to do?
↓
What is the main entity?
↓
What data must persist?
↓
What APIs are required?
↓
What screens are required?
↓
What is the twist?

Then:

DB
 ↓
API
 ↓
UI
 ↓
TEST
 ↓
DOCS
 ↓
PUSH

That's your entire round.

18. Example using the bus problem you mentioned earlier

If they gave:

College bus tracking system with GPS and unreliable network.

You could design:

Users
├── Student
├── Driver
└── Admin

Entities
├── User
├── Bus
├── Route
└── Location

APIs:

POST /auth/register
POST /auth/login

GET  /buses
POST /buses
GET  /buses/{id}
PUT  /buses/{id}
DELETE /buses/{id}

POST /buses/{id}/location
GET  /buses/{id}/location

GET /routes
POST /routes

Search:

GET /buses?search=12

Pagination:

GET /buses?page=1&limit=5

Sorting:

GET /buses?sort_by=bus_number&order=asc

Twist:

Network unavailable
        ↓
show last known location
        ↓
network returns
        ↓
sync latest location

That's enough to turn a vague storyline into a concrete product.

19. What I think you should prepare BEFORE the competition

Don't practice 20 different projects.

Instead, practice building one reusable skeleton until you can create it very quickly:

FastAPI
+
SQLite
+
SQLAlchemy
+
JWT Authentication
+
CRUD
+
Search
+
Pagination
+
Sorting
+
Streamlit

Then practice applying that skeleton to:

Bus management
Library management
Event management
Complaint management
Job management

The business logic changes, but the architecture stays almost identical.

Most important takeaway

The competition isn't asking:

"Can you write a lot of code?"

It's asking:

"Can you take an ambiguous problem, make sensible engineering decisions, use AI effectively, and deliver a working product before the deadline?"

So your target should be:

Simple architecture + complete mandatory features + working twist + good documentation + clean GitHub repo.

And since you've already been preparing for the AIR/GitHub Codespaces round, the next step should be to practice this as an actual 150-minute mock Builder round rather than studying more theory.

Can we make it more better like we build by react and remove unncesary text.keep a clean and professional frontant
smartpark.zip
Zip Archive
Pasted text(20260917-114439).txt
Document
ok done

Perfect ✅ Registration is fixed and working.

You are now on the Sign in page with:

Account created successfully. Please sign in.

Now let's continue the test one step at a time.

Step 1 — Login

Enter the same credentials you just registered with:

Email:     deepak543@gmail.com
Password:  [the password you used during registration]

Then click Sign in.

Step 2 — Expected result

You should enter the SmartPark Dashboard.

Once you're inside the dashboard, don't test anything else yet.

Send me a screenshot of the dashboard, and we'll test:

Dashboard → Check In → Check Out → Records → T4 → T6 → T2

in that order.

where is dehtop

The Dashboard is not showing because you are currently on the landing page.

Your login was successful earlier, but the app has returned to the landing page. In the top-right you can see:

Sign in | Get started

Do this now

Click Sign in in the top-right corner.

Then enter:

Email: deepak543@gmail.com
Password: the password you registered with

Click Sign in.

After successful login, you should see the Dashboard with things like:

Garage selection
Total spots
Available spots
Occupied spots
Check In
Check Out
Records
Operations
One important thing

Your landing page currently shows:

Total spots: 0
Available: 0
Occupied: 0

That's okay for the landing page. We need to see what happens after login.

👉 Click the top-right Sign in now and log in. Then send me the screenshot of the page you get.

Perfect ✅ Login and Dashboard are working.

But there is one issue visible in your screenshot:

Total Spots: 0
Available: 0
Occupied: 0
EV Available: 0
No parking spots found

This means your garage/parking data hasn't been seeded in the current database. The frontend is connected correctly; we need to populate the garage and spots before testing Check In.

Next: let's check the database

Don't change any code yet.

Open a new terminal and run:

cd /workspaces/SmartPark-Auriga/smartpark
python -c "from backend.database import SessionLocal; from backend.models import Garage, ParkingSpot; db=SessionLocal(); print('Garages:', db.query(Garage).count()); print('Spots:', db.query(ParkingSpot).count()); db.close()"

It should return something like:

Garages: 1
Spots: 12

or perhaps:

Garages: 0
Spots: 0
Send me the output

Just paste the two lines here.

Then I'll give you the exact command to create the garage + compact/standard/EV spots, and we'll immediately test Check In.
