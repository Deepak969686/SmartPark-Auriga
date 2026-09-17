import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://127.0.0.1:8000";

function App() {
  // =========================================================
  // AUTH / NAVIGATION
  // =========================================================

  const [page, setPage] = useState("landing");
  const [authMode, setAuthMode] = useState("login");

  const [token, setToken] = useState(
    localStorage.getItem("smartpark_token")
  );

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("smartpark_user") || "null")
  );

  // =========================================================
  // COMMON
  // =========================================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // =========================================================
  // AUTH FORM
  // =========================================================

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  // =========================================================
  // GARAGE / DASHBOARD
  // =========================================================

  const [garages, setGarages] = useState([]);
  const [garage, setGarage] = useState(null);
  const [availability, setAvailability] = useState(null);

  // =========================================================
  // CHECK-IN
  // =========================================================

  const [checkInForm, setCheckInForm] = useState({
    license_plate: "",
    vehicle_type: "STANDARD",
  });

  const [checkInResult, setCheckInResult] = useState(null);

  // =========================================================
  // CHECK-OUT
  // =========================================================

  const [checkoutPlate, setCheckoutPlate] = useState("");
  const [checkoutResult, setCheckoutResult] = useState(null);

  // =========================================================
  // RECORDS
  // =========================================================

  const [records, setRecords] = useState([]);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsPages, setRecordsPages] = useState(0);
  const [recordsTotal, setRecordsTotal] = useState(0);

  const [recordsSearch, setRecordsSearch] = useState("");
  const [recordsSort, setRecordsSort] = useState("check_in");
  const [recordsOrder, setRecordsOrder] = useState("desc");

  // =========================================================
  // T4 — RATE CARD
  // =========================================================

  const [rates, setRates] = useState([]);
  const [rateImportResult, setRateImportResult] = useState(null);

  // =========================================================
  // T6 — TRANSFER
  // =========================================================

  const [transferOldPlate, setTransferOldPlate] = useState("");
  const [transferNewPlate, setTransferNewPlate] = useState("");
  const [transferResult, setTransferResult] = useState(null);

  // =========================================================
  // T2 — CLOCK
  // =========================================================

  const [clockTime, setClockTime] = useState("");
  const [clockResult, setClockResult] = useState(null);

  // =========================================================
  // HELPERS
  // =========================================================

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  const handleError = (err, fallback) => {
    setError(
      err?.response?.data?.detail ||
        err?.response?.data?.message ||
        fallback
    );
  };

  // =========================================================
  // AUTH
  // =========================================================

  const handleAuthChange = (e) => {
    setAuthForm({
      ...authForm,
      [e.target.name]: e.target.value,
    });
  };

  const submitAuth = async (e) => {
    e.preventDefault();

    clearMessages();
    setLoading(true);

    try {
      if (authMode === "register") {
        await axios.post(`${API}/api/auth/register`, {
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
        });

        setMessage(
          "Account created successfully. Please sign in."
        );

        setAuthMode("login");

        setAuthForm({
          name: "",
          email: authForm.email,
          password: "",
        });
      } else {
        const response = await axios.post(
          `${API}/api/auth/login`,
          {
            email: authForm.email,
            password: authForm.password,
          }
        );

        const accessToken =
          response.data.access_token;

        localStorage.setItem(
          "smartpark_token",
          accessToken
        );

        localStorage.setItem(
          "smartpark_user",
          JSON.stringify({
            email: authForm.email,
          })
        );

        setToken(accessToken);

        setUser({
          email: authForm.email,
        });

        setAuthForm({
          name: "",
          email: "",
          password: "",
        });

        setPage("dashboard");
      }
    } catch (err) {
      handleError(
        err,
        authMode === "register"
          ? "Registration failed."
          : "Login failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("smartpark_token");
    localStorage.removeItem("smartpark_user");

    setToken(null);
    setUser(null);

    setPage("landing");
    clearMessages();
  };

  // =========================================================
  // GARAGES
  // =========================================================

  const loadGarages = async () => {
    try {
      const response = await axios.get(
        `${API}/api/garages`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.garages || [];

      setGarages(data);

      if (data.length > 0) {
        setGarage(data[0]);
      }
    } catch (err) {
      handleError(
        err,
        "Unable to load garages."
      );
    }
  };

  // =========================================================
  // AVAILABILITY
  // =========================================================

  const loadAvailability = async (
    selectedGarageId = garage?.id
  ) => {
    if (!selectedGarageId) return;

    try {
      const response = await axios.get(
        `${API}/api/parking/availability`,
        {
          params: {
            garage_id: selectedGarageId,
          },
        }
      );

      setAvailability(response.data);
    } catch (err) {
      handleError(
        err,
        "Unable to load parking availability."
      );
    }
  };

  // =========================================================
  // DASHBOARD
  // =========================================================

  const loadDashboard = async () => {
    clearMessages();

    try {
      await loadGarages();

      // The availability call is made separately after
      // garage information is loaded.
    } catch (err) {
      handleError(
        err,
        "Unable to load dashboard."
      );
    }
  };

  // =========================================================
  // CHECK-IN
  // =========================================================

  const handleCheckInChange = (e) => {
    setCheckInForm({
      ...checkInForm,
      [e.target.name]: e.target.value,
    });
  };

  const checkIn = async (e) => {
    e.preventDefault();

    clearMessages();
    setCheckInResult(null);
    setLoading(true);

    if (!garage) {
      setError("No garage is available.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API}/api/parking/check-in`,
        {
          garage_id: garage.id,
          license_plate:
            checkInForm.license_plate
              .trim()
              .toUpperCase(),
          vehicle_type:
            checkInForm.vehicle_type,
        }
      );

      setCheckInResult(response.data);

      setMessage(
        "Vehicle checked in successfully."
      );

      setCheckInForm({
        license_plate: "",
        vehicle_type: "STANDARD",
      });

      await loadAvailability(garage.id);
    } catch (err) {
      handleError(
        err,
        "Check-in failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CHECK-OUT
  // =========================================================

  const checkOut = async (e) => {
    e.preventDefault();

    clearMessages();
    setCheckoutResult(null);
    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/api/parking/check-out`,
        {
          license_plate:
            checkoutPlate
              .trim()
              .toUpperCase(),
        }
      );

      setCheckoutResult(response.data);

      setMessage(
        "Vehicle checked out successfully."
      );

      setCheckoutPlate("");

      await loadAvailability(
        garage?.id
      );
    } catch (err) {
      handleError(
        err,
        "Check-out failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RECORDS
  // =========================================================

  const loadRecords = async (
    requestedPage = recordsPage
  ) => {
    clearMessages();

    try {
      const response = await axios.get(
        `${API}/api/parking/sessions`,
        {
          params: {
            page: requestedPage,
            limit: 10,
            search: recordsSearch,
            sort_by: recordsSort,
            order: recordsOrder,
          },
        }
      );

      const data = response.data;

      setRecords(data.data || []);
      setRecordsPage(data.page || requestedPage);
      setRecordsPages(data.pages || 0);
      setRecordsTotal(data.total || 0);
    } catch (err) {
      handleError(
        err,
        "Unable to load parking records."
      );
    }
  };

  const searchRecords = () => {
    setRecordsPage(1);
    loadRecords(1);
  };

  // =========================================================
  // T4 — LOAD RATE CARD
  // =========================================================

  const loadRates = async () => {
    clearMessages();

    if (!garage) {
      setError(
        "Garage information is unavailable."
      );
      return;
    }

    try {
      const response = await axios.get(
        `${API}/api/rates/${garage.id}`
      );

      setRates(
        response.data.rates || []
      );
    } catch (err) {
      handleError(
        err,
        "Unable to load rate card."
      );
    }
  };

  // =========================================================
  // T4 — IMPORT RATE CARD
  // =========================================================

  const importRates = async () => {
    clearMessages();
    setRateImportResult(null);

    if (!garage) {
      setError(
        "Garage information is unavailable."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/api/rates/import`,
        {
          garage_id: garage.id,
          rates: [
            {
              spot_type: " compact ",
              first_hour_rate: "₹40",
              additional_hour_rate: "25/hr",
              daily_cap: "₹200",
            },
            {
              spot_type: "STANDARD",
              first_hour_rate: "50",
              additional_hour_rate:
                "₹30/hour",
              daily_cap: "300",
            },
            {
              spot_type: " ev ",
              first_hour_rate: "₹70",
              additional_hour_rate:
                "40/hr",
              daily_cap: "₹400",
            },
          ],
        }
      );

      setRateImportResult(
        response.data
      );

      setRates(
        response.data.rates || []
      );

      setMessage(
        "Rate card imported and cleaned successfully."
      );
    } catch (err) {
      handleError(
        err,
        "Rate card import failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // T6 — TRANSFER
  // =========================================================

  const transferSession = async (e) => {
    e.preventDefault();

    clearMessages();
    setTransferResult(null);
    setLoading(true);

    if (
      !transferOldPlate.trim() ||
      !transferNewPlate.trim()
    ) {
      setError(
        "Please enter both license plates."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API}/api/parking/transfer`,
        {
          old_license_plate:
            transferOldPlate
              .trim()
              .toUpperCase(),

          new_license_plate:
            transferNewPlate
              .trim()
              .toUpperCase(),
        }
      );

      setTransferResult(
        response.data
      );

      setMessage(
        "Parking session transferred successfully."
      );

      setTransferOldPlate("");
      setTransferNewPlate("");

      await loadAvailability(
        garage?.id
      );

      await loadRecords(1);
    } catch (err) {
      handleError(
        err,
        "Session transfer failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // T2 — CLOCK
  // =========================================================

  const runClock = async () => {
    clearMessages();
    setClockResult(null);
    setLoading(true);

    try {
      const payload = clockTime
        ? {
            current_time: new Date(
              clockTime
            ).toISOString(),
          }
        : {};

      const response = await axios.post(
        `${API}/clock`,
        payload
      );

      setClockResult(
        response.data
      );

      setMessage(
        `Clock job completed. ${
          response.data.auto_closed_count || 0
        } session(s) auto-closed.`
      );

      await loadAvailability(
        garage?.id
      );

      await loadRecords(1);
    } catch (err) {
      handleError(
        err,
        "Clock job failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // EFFECTS
  // =========================================================

  useEffect(() => {
    if (token) {
      setPage("dashboard");
      loadDashboard();
    }
  }, []);

  useEffect(() => {
    if (garage?.id) {
      loadAvailability(garage.id);
    }
  }, [garage?.id]);

  // =========================================================
  // LANDING PAGE
  // =========================================================

  if (page === "landing") {
    return (
      <div className="app landing-page">

        <header className="landing-nav">

          <div className="brand">
            <div className="brand-mark">
              SP
            </div>

            <span>
              SmartPark
            </span>
          </div>

          <div className="landing-actions">

            <button
              className="text-button"
              onClick={() => {
                setAuthMode("login");
                setPage("auth");
              }}
            >
              Sign in
            </button>

            <button
              className="dark-button small-button"
              onClick={() => {
                setAuthMode("register");
                setPage("auth");
              }}
            >
              Get started
            </button>

          </div>

        </header>


        <main>

          <section className="hero">

            <div className="hero-copy">

              <div className="eyebrow">
                PARKING OPERATIONS PLATFORM
              </div>

              <h1>
                Parking management,
                <br />
                without the paperwork.
              </h1>

              <p>
                SmartPark helps parking attendants
                check vehicles in and out, assign the
                right spot, calculate accurate fees,
                and manage a growing parking log from
                one simple workspace.
              </p>

              <div className="hero-actions">

                <button
                  className="dark-button"
                  onClick={() => {
                    setAuthMode("register");
                    setPage("auth");
                  }}
                >
                  Create account
                </button>

                <button
                  className="outline-button"
                  onClick={() => {
                    setAuthMode("login");
                    setPage("auth");
                  }}
                >
                  Sign in
                </button>

              </div>

            </div>


            <div className="hero-panel">

              <div className="dashboard-preview">

                <div className="preview-header">
                  <span>
                    Today's operations
                  </span>

                  <span className="status-dot">
                    Live
                  </span>
                </div>

                <div className="preview-stats">

                  <div>
                    <strong>
                      {availability?.total || 0}
                    </strong>
                    <span>Total spots</span>
                  </div>

                  <div>
                    <strong>
                      {availability?.available || 0}
                    </strong>
                    <span>Available</span>
                  </div>

                  <div>
                    <strong>
                      {availability?.occupied || 0}
                    </strong>
                    <span>Occupied</span>
                  </div>

                </div>

                <div className="preview-list">

                  <div>
                    <span className="preview-icon">
                      ✓
                    </span>

                    <div>
                      <strong>
                        Fast check-in
                      </strong>

                      <small>
                        Assign the right spot
                        automatically
                      </small>
                    </div>
                  </div>


                  <div>
                    <span className="preview-icon">
                      ₹
                    </span>

                    <div>
                      <strong>
                        Accurate billing
                      </strong>

                      <small>
                        Tiered rates and daily
                        caps
                      </small>
                    </div>
                  </div>


                  <div>
                    <span className="preview-icon">
                      EV
                    </span>

                    <div>
                      <strong>
                        EV availability
                      </strong>

                      <small>
                        Find charger-enabled
                        spots
                      </small>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </section>


          <section className="landing-section">

            <div className="section-heading">

              <div className="eyebrow">
                KEY FEATURES
              </div>

              <h2>
                Everything the attendant needs.
              </h2>

            </div>


            <div className="feature-grid">

              <div className="feature-card">
                <span className="feature-number">
                  01
                </span>

                <h3>
                  Check-in & check-out
                </h3>

                <p>
                  Quickly register vehicles, assign
                  compatible spots, and close sessions
                  with calculated fees.
                </p>
              </div>


              <div className="feature-card">
                <span className="feature-number">
                  02
                </span>

                <h3>
                  Smart billing
                </h3>

                <p>
                  Apply first-hour rates, additional
                  hourly rates, part-hour rounding and
                  daily caps consistently.
                </p>
              </div>


              <div className="feature-card">
                <span className="feature-number">
                  03
                </span>

                <h3>
                  Search & operations
                </h3>

                <p>
                  Find vehicles by plate, inspect
                  parking records, sort activity and
                  monitor spot availability.
                </p>
              </div>

            </div>

          </section>


          <section className="audience-section">

            <div>

              <div className="eyebrow">
                BUILT FOR
              </div>

              <h2>
                Busy city-centre garages.
              </h2>

            </div>

            <p>
              SmartPark is designed for parking
              attendants and garage operators who
              need a reliable way to handle cars,
              limited spots, EV charging spaces and
              high-volume daily records.
            </p>

          </section>


          <section className="next-section">

            <div className="section-heading">

              <div className="eyebrow">
                NEXT FEATURES
              </div>

              <h2>
                What's coming next.
              </h2>

            </div>


            <div className="next-grid">

              <div>
                <strong>
                  Reservations
                </strong>

                <span>
                  Let drivers reserve spots before
                  arrival.
                </span>
              </div>

              <div>
                <strong>
                  Notifications
                </strong>

                <span>
                  Send automated arrival and billing
                  alerts.
                </span>
              </div>

              <div>
                <strong>
                  Analytics
                </strong>

                <span>
                  Understand occupancy, revenue and
                  peak parking periods.
                </span>
              </div>

            </div>

          </section>

        </main>


        <footer className="landing-footer">

          <div className="brand">
            <div className="brand-mark">
              SP
            </div>

            <span>
              SmartPark
            </span>
          </div>

          <span>
            Parking operations made simple.
          </span>

        </footer>

      </div>
    );
  }

  // =========================================================
  // AUTH PAGE
  // =========================================================

  if (page === "auth") {
    return (
      <div className="auth-page">

        <div className="auth-brand">
          <div className="brand-mark">
            SP
          </div>

          <span>
            SmartPark
          </span>
        </div>


        <div className="auth-card">

          <button
            className="back-button"
            onClick={() => setPage("landing")}
          >
            ← Back
          </button>


          <div className="auth-heading">

            <div className="eyebrow">
              {authMode === "login"
                ? "WELCOME BACK"
                : "GET STARTED"}
            </div>

            <h1>
              {authMode === "login"
                ? "Sign in"
                : "Create account"}
            </h1>

            <p>
              {authMode === "login"
                ? "Access your SmartPark operations workspace."
                : "Set up your SmartPark account."}
            </p>

          </div>


          {error && (
            <div className="error">
              {error}
            </div>
          )}

          {message && (
            <div className="success">
              {message}
            </div>
          )}


          <form
            className="auth-form"
            onSubmit={submitAuth}
          >

            {authMode === "register" && (
              <div className="form-field">

                <label>Name</label>

                <input
                  name="name"
                  value={authForm.name}
                  onChange={handleAuthChange}
                  placeholder="Your name"
                  required
                />

              </div>
            )}


            <div className="form-field">

              <label>Email</label>

              <input
                name="email"
                type="email"
                value={authForm.email}
                onChange={handleAuthChange}
                placeholder="you@example.com"
                required
              />

            </div>


            <div className="form-field">

              <label>Password</label>

              <input
                name="password"
                type="password"
                value={authForm.password}
                onChange={handleAuthChange}
                placeholder="Minimum 6 characters"
                required
              />

            </div>


            <button
              className="dark-button full-button"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : authMode === "login"
                ? "Sign in"
                : "Create account"}
            </button>

          </form>


          <div className="auth-switch">

            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              onClick={() => {
                clearMessages();

                setAuthMode(
                  authMode === "login"
                    ? "register"
                    : "login"
                );
              }}
            >
              {authMode === "login"
                ? "Create one"
                : "Sign in"}
            </button>

          </div>

        </div>

      </div>
    );
  }

  // =========================================================
  // APPLICATION LAYOUT
  // =========================================================

  const navigate = (target) => {
    clearMessages();
    setPage(target);

    if (target === "dashboard") {
      loadDashboard();
    }

    if (target === "records") {
      loadRecords(1);
    }

    if (target === "operations") {
      loadRates();
    }
  };

  return (
    <div className="app-shell">

      {/* ===================================================
          SIDEBAR
          =================================================== */}

      <aside className="sidebar">

        <div className="sidebar-top">

          <div className="sidebar-brand">

            <div className="brand-mark">
              SP
            </div>

            <div>
              <strong>
                SmartPark
              </strong>

              <span>
                Operations
              </span>
            </div>

          </div>


          <div className="sidebar-section">

            <span className="sidebar-label">
              MANAGEMENT
            </span>


            <button
              className={
                page === "dashboard"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() =>
                navigate("dashboard")
              }
            >
              <span>⌂</span>
              Dashboard
            </button>


            <button
              className={
                page === "checkin"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() =>
                navigate("checkin")
              }
            >
              <span>+</span>
              Check In
            </button>


            <button
              className={
                page === "checkout"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() =>
                navigate("checkout")
              }
            >
              <span>→</span>
              Check Out
            </button>


            <button
              className={
                page === "records"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() =>
                navigate("records")
              }
            >
              <span>≡</span>
              Parking Records
            </button>


            <button
              className={
                page === "operations"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() =>
                navigate("operations")
              }
            >
              <span>⚙</span>
              Operations
            </button>

          </div>

        </div>


        <div className="sidebar-bottom">

          <div className="system-status">
            <span className="status-dot"></span>

            <div>
              <strong>
                System operational
              </strong>

              <span>
                API connected
              </span>
            </div>
          </div>


          <div className="sidebar-user">

            <div className="avatar">
              {(user?.email || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="user-info">

              <strong>
                {user?.email || "Operator"}
              </strong>

              <span>
                Attendant
              </span>

            </div>


            <button
              className="logout-button"
              onClick={logout}
              title="Sign out"
            >
              ↪
            </button>

          </div>

        </div>

      </aside>


      {/* ===================================================
          MAIN
          =================================================== */}

      <main className="main-content">

        {/* =================================================
            TOP BAR
            ================================================= */}

        <header className="topbar">

          <div className="mobile-brand">

            <div className="brand-mark">
              SP
            </div>

            <strong>
              SmartPark
            </strong>

          </div>


          <div className="garage-selector">

            <span>
              GARAGE
            </span>

            <select
              value={garage?.id || ""}
              onChange={(e) => {
                const selected =
                  garages.find(
                    (g) =>
                      g.id ===
                      Number(e.target.value)
                  );

                setGarage(selected || null);
              }}
            >

              {garages.length === 0 && (
                <option value="">
                  No garages
                </option>
              )}

              {garages.map((g) => (
                <option
                  key={g.id}
                  value={g.id}
                >
                  {g.name}
                </option>
              ))}

            </select>

          </div>

        </header>


        <div className="content-area">

          {error && (
            <div className="error global-message">
              {error}
            </div>
          )}

          {message && (
            <div className="success global-message">
              {message}
            </div>
          )}


          {/* =================================================
              DASHBOARD
              ================================================= */}

          {page === "dashboard" && (
            <div>

              <div className="page-header">

                <div>
                  <div className="breadcrumb">
                    OVERVIEW
                  </div>

                  <h1>
                    Good day.
                  </h1>

                  <p>
                    Monitor parking activity and
                    availability from one place.
                  </p>
                </div>

              </div>


              <div className="stats-grid">

                <div className="stat-card">

                  <span>
                    TOTAL SPOTS
                  </span>

                  <strong>
                    {availability?.total || 0}
                  </strong>

                  <small>
                    Across this garage
                  </small>

                </div>


                <div className="stat-card">

                  <span>
                    AVAILABLE
                  </span>

                  <strong>
                    {availability?.available || 0}
                  </strong>

                  <small>
                    Ready for vehicles
                  </small>

                </div>


                <div className="stat-card">

                  <span>
                    OCCUPIED
                  </span>

                  <strong>
                    {availability?.occupied || 0}
                  </strong>

                  <small>
                    Currently parked
                  </small>

                </div>


                <div className="stat-card">

                  <span>
                    EV AVAILABLE
                  </span>

                  <strong>
                    {availability?.spots
                      ? availability.spots.filter(
                          (spot) =>
                            spot.spot_type ===
                              "EV" &&
                            spot.available
                        ).length
                      : 0}
                  </strong>

                  <small>
                    Charger-enabled spots
                  </small>

                </div>

              </div>


              <div className="dashboard-grid">

                <div className="content-card">

                  <div className="card-header">

                    <div>
                      <h2>
                        Parking map
                      </h2>

                      <p>
                        Current spot occupancy.
                      </p>
                    </div>

                    <button
                      className="outline-button"
                      onClick={() =>
                        loadAvailability(
                          garage?.id
                        )
                      }
                    >
                      Refresh
                    </button>

                  </div>


                  <div className="spot-grid">

                    {availability?.spots?.map(
                      (spot) => (
                        <div
                          key={spot.id}
                          className={
                            spot.available
                              ? "spot available"
                              : "spot occupied"
                          }
                        >

                          <div className="spot-top">

                            <span>
                              {spot.spot_number}
                            </span>

                            <span>
                              {spot.available
                                ? "FREE"
                                : "BUSY"}
                            </span>

                          </div>

                          <strong>
                            {spot.spot_type}
                          </strong>

                          <small>
                            Level {spot.level}
                          </small>

                        </div>
                      )
                    )}

                    {!availability?.spots
                      ?.length && (
                      <div className="empty">
                        No parking spots found.
                      </div>
                    )}

                  </div>

                </div>


                <div className="content-card quick-card">

                  <div className="eyebrow">
                    QUICK ACTION
                  </div>

                  <h2>
                    Vehicle arriving?
                  </h2>

                  <p>
                    Start a new parking session
                    and let SmartPark find a
                    compatible spot.
                  </p>

                  <button
                    className="dark-button"
                    onClick={() =>
                      navigate("checkin")
                    }
                  >
                    Check in vehicle
                  </button>


                  <div className="quick-divider"></div>


                  <div className="quick-link">

                    <div>
                      <strong>
                        Need to close a session?
                      </strong>

                      <span>
                        Search by license plate.
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        navigate("checkout")
                      }
                    >
                      →
                    </button>

                  </div>

                </div>

              </div>

            </div>
          )}


          {/* =================================================
              CHECK-IN
              ================================================= */}

          {page === "checkin" && (
            <div>

              <div className="page-header">

                <div>
                  <div className="breadcrumb">
                    PARKING
                  </div>

                  <h1>
                    Check in vehicle
                  </h1>

                  <p>
                    Assign a compatible parking
                    spot automatically.
                  </p>
                </div>

              </div>


              <div className="form-layout">

                <div className="content-card form-card">

                  <form onSubmit={checkIn}>

                    <div className="form-field">

                      <label>
                        License plate
                      </label>

                      <input
                        name="license_plate"
                        value={
                          checkInForm.license_plate
                        }
                        onChange={
                          handleCheckInChange
                        }
                        placeholder="RJ14AB1234"
                        required
                      />

                      <small>
                        Plate numbers are stored
                        in uppercase.
                      </small>

                    </div>


                    <div className="form-field">

                      <label>
                        Vehicle type
                      </label>

                      <select
                        name="vehicle_type"
                        value={
                          checkInForm.vehicle_type
                        }
                        onChange={
                          handleCheckInChange
                        }
                      >
                        <option value="COMPACT">
                          Compact
                        </option>

                        <option value="STANDARD">
                          Standard
                        </option>

                        <option value="EV">
                          EV
                        </option>
                      </select>

                    </div>


                    <button
                      className="dark-button full-button"
                      disabled={loading}
                    >
                      {loading
                        ? "Checking in..."
                        : "Check in vehicle"}
                    </button>

                  </form>

                </div>


                <div className="info-panel">

                  <div className="eyebrow">
                    SPOT RULES
                  </div>

                  <h3>
                    Smart spot assignment
                  </h3>

                  <div className="rule-list">

                    <div>
                      <strong>
                        Compact
                      </strong>

                      <span>
                        Compact or standard spot
                      </span>
                    </div>

                    <div>
                      <strong>
                        Standard
                      </strong>

                      <span>
                        Standard spot
                      </span>
                    </div>

                    <div>
                      <strong>
                        EV
                      </strong>

                      <span>
                        EV charging spot only
                      </span>
                    </div>

                  </div>

                </div>

              </div>


              {checkInResult && (
                <div className="receipt-card">

                  <div className="receipt-icon">
                    ✓
                  </div>

                  <div>
                    <span>
                      VEHICLE PARKED
                    </span>

                    <h2>
                      {checkInResult.license_plate}
                    </h2>

                    <p>
                      Spot{" "}
                      <strong>
                        {checkInResult.spot}
                      </strong>{" "}
                      ·{" "}
                      {checkInResult.spot_type}
                    </p>
                  </div>

                </div>
              )}

            </div>
          )}


          {/* =================================================
              CHECK-OUT
              ================================================= */}

          {page === "checkout" && (
            <div>

              <div className="page-header">

                <div>
                  <div className="breadcrumb">
                    PARKING
                  </div>

                  <h1>
                    Check out vehicle
                  </h1>

                  <p>
                    Enter a license plate to close
                    the active session and calculate
                    the final fee.
                  </p>
                </div>

              </div>


              <div className="form-layout">

                <div className="content-card form-card">

                  <form onSubmit={checkOut}>

                    <div className="form-field">

                      <label>
                        License plate
                      </label>

                      <input
                        value={checkoutPlate}
                        onChange={(e) =>
                          setCheckoutPlate(
                            e.target.value
                          )
                        }
                        placeholder="RJ14AB1234"
                        required
                      />

                    </div>


                    <button
                      className="dark-button full-button"
                      disabled={loading}
                    >
                      {loading
                        ? "Calculating..."
                        : "Check out vehicle"}
                    </button>

                  </form>

                </div>


                <div className="info-panel">

                  <div className="eyebrow">
                    BILLING
                  </div>

                  <h3>
                    Accurate fee calculation
                  </h3>

                  <p>
                    SmartPark rounds part-hours up
                    and applies the correct rate card
                    for the occupied spot type.
                  </p>

                  <div className="billing-points">

                    <span>
                      ✓ First-hour rate
                    </span>

                    <span>
                      ✓ Additional hourly rate
                    </span>

                    <span>
                      ✓ Daily cap
                    </span>

                  </div>

                </div>

              </div>


              {checkoutResult && (
                <div className="receipt-card billing-receipt">

                  <div className="receipt-icon">
                    ₹
                  </div>

                  <div className="receipt-main">

                    <span>
                      PARKING BILL
                    </span>

                    <h2>
                      ₹{checkoutResult.fee}
                    </h2>

                    <p>
                      {checkoutResult.license_plate}
                      {" · "}
                      {checkoutResult.spot}
                      {" · "}
                      {checkoutResult.billable_hours}
                      {" billable hour(s)"}
                    </p>

                  </div>

                  <div className="receipt-meta">

                    <span>
                      CHECKED OUT
                    </span>

                    <strong>
                      {checkoutResult.check_out
                        ? new Date(
                            checkoutResult.check_out
                          ).toLocaleString()
                        : "-"}
                    </strong>

                  </div>

                </div>
              )}

            </div>
          )}


          {/* =================================================
              RECORDS
              ================================================= */}

          {page === "records" && (
            <div>

              <div className="page-header">

                <div>
                  <div className="breadcrumb">
                    RECORDS
                  </div>

                  <h1>
                    Parking records
                  </h1>

                  <p>
                    Search, sort and review parking
                    sessions.
                  </p>
                </div>

              </div>


              <div className="content-card">

                <div className="records-toolbar">

                  <div className="search-box">

                    <input
                      value={recordsSearch}
                      onChange={(e) =>
                        setRecordsSearch(
                          e.target.value
                        )
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter"
                        ) {
                          searchRecords();
                        }
                      }}
                      placeholder="Search license plate..."
                    />

                    <button
                      className="dark-button"
                      onClick={searchRecords}
                    >
                      Search
                    </button>

                  </div>


                  <div className="sort-controls">

                    <select
                      value={recordsSort}
                      onChange={(e) => {
                        setRecordsSort(
                          e.target.value
                        );
                        setRecordsPage(1);
                      }}
                    >
                      <option value="check_in">
                        Check-in
                      </option>

                      <option value="check_out">
                        Check-out
                      </option>

                      <option value="license_plate">
                        License plate
                      </option>

                      <option value="fee">
                        Fee
                      </option>

                      <option value="status">
                        Status
                      </option>
                    </select>


                    <button
                      className="outline-button"
                      onClick={() => {
                        const next =
                          recordsOrder ===
                          "asc"
                            ? "desc"
                            : "asc";

                        setRecordsOrder(
                          next
                        );

                        setTimeout(
                          () =>
                            loadRecords(
                              1
                            ),
                          0
                        );
                      }}
                    >
                      {recordsOrder === "asc"
                        ? "↑ Asc"
                        : "↓ Desc"}
                    </button>

                  </div>

                </div>


                <div className="records-summary">

                  <span>
                    {recordsTotal} total records
                  </span>

                  <button
                    className="text-button"
                    onClick={() =>
                      loadRecords(
                        recordsPage
                      )
                    }
                  >
                    Refresh
                  </button>

                </div>


                <div className="table-wrapper">

                  <table className="records-table">

                    <thead>

                      <tr>

                        <th>
                          Plate
                        </th>

                        <th>
                          Vehicle
                        </th>

                        <th>
                          Check-in
                        </th>

                        <th>
                          Check-out
                        </th>

                        <th>
                          Fee
                        </th>

                        <th>
                          Status
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {records.map(
                        (record) => (
                          <tr
                            key={
                              record.id
                            }
                          >

                            <td>
                              <strong>
                                {
                                  record.license_plate
                                }
                              </strong>
                            </td>

                            <td>
                              {record.vehicle_type}
                            </td>

                            <td>
                              {record.check_in
                                ? new Date(
                                    record.check_in
                                  ).toLocaleString()
                                : "-"}
                            </td>

                            <td>
                              {record.check_out
                                ? new Date(
                                    record.check_out
                                  ).toLocaleString()
                                : "-"}
                            </td>

                            <td>
                              {record.fee !==
                              null &&
                              record.fee !==
                              undefined
                                ? `₹${record.fee}`
                                : "-"}
                            </td>

                            <td>

                              <span
                                className={
                                  record.status ===
                                  "PARKED"
                                    ? "status-badge parked"
                                    : record.status ===
                                      "AUTO_CLOSED"
                                    ? "status-badge auto"
                                    : "status-badge completed"
                                }
                              >
                                {
                                  record.status
                                }
                              </span>

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>


                  {records.length === 0 && (
                    <div className="empty">
                      No parking records found.
                    </div>
                  )}

                </div>


                <div className="pagination">

                  <button
                    className="outline-button"
                    disabled={
                      recordsPage <= 1
                    }
                    onClick={() =>
                      loadRecords(
                        recordsPage - 1
                      )
                    }
                  >
                    ← Previous
                  </button>


                  <span>
                    Page{" "}
                    <strong>
                      {recordsPage}
                    </strong>{" "}
                    of{" "}
                    <strong>
                      {recordsPages ||
                        1}
                    </strong>
                  </span>


                  <button
                    className="outline-button"
                    disabled={
                      recordsPages === 0 ||
                      recordsPage >=
                        recordsPages
                    }
                    onClick={() =>
                      loadRecords(
                        recordsPage + 1
                      )
                    }
                  >
                    Next →
                  </button>

                </div>

              </div>

            </div>
          )}


          {/* =================================================
              OPERATIONS
              ================================================= */}

          {page === "operations" && (
            <div>

              <div className="page-header">

                <div>

                  <div className="breadcrumb">
                    OPERATIONS
                  </div>

                  <h1>
                    Parking operations
                  </h1>

                  <p>
                    Manage rates, valet transfers
                    and automated 24-hour closing.
                  </p>

                </div>

              </div>


              {/* -------------------------------------------
                  T4 RATE CARD
                  ------------------------------------------- */}

              <div className="content-card operation-card">

                <div className="card-header">

                  <div>

                    <div className="eyebrow">
                      T4 · RATE CARD
                    </div>

                    <h2>
                      Parking rates
                    </h2>

                    <p>
                      Pricing is stored separately
                      for each parking spot type.
                    </p>

                  </div>


                  <button
                    className="outline-button"
                    onClick={loadRates}
                  >
                    Refresh
                  </button>

                </div>


                {rates.length > 0 ? (

                  <div className="table-wrapper">

                    <table className="records-table">

                      <thead>

                        <tr>
                          <th>
                            Spot type
                          </th>

                          <th>
                            First hour
                          </th>

                          <th>
                            Extra hour
                          </th>

                          <th>
                            Daily cap
                          </th>
                        </tr>

                      </thead>


                      <tbody>

                        {rates.map(
                          (rate) => (
                            <tr
                              key={
                                rate.id
                              }
                            >

                              <td>
                                <strong>
                                  {
                                    rate.spot_type
                                  }
                                </strong>
                              </td>

                              <td>
                                ₹
                                {
                                  rate.first_hour_rate
                                }
                              </td>

                              <td>
                                ₹
                                {
                                  rate.additional_hour_rate
                                }
                              </td>

                              <td>
                                ₹
                                {
                                  rate.daily_cap
                                }
                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                ) : (

                  <div className="empty">
                    No rate card loaded.
                  </div>

                )}


                <button
                  className="dark-button"
                  onClick={importRates}
                  disabled={loading}
                >
                  {loading
                    ? "Importing..."
                    : "Import sample messy rate card"}
                </button>


                {rateImportResult && (
                  <div className="success operation-result">
                    Rate card cleaned and stored
                    successfully.
                  </div>
                )}

              </div>


              {/* -------------------------------------------
                  T6 TRANSFER
                  ------------------------------------------- */}

              <div className="content-card operation-card">

                <div className="card-header">

                  <div>

                    <div className="eyebrow">
                      T6 · VALET HAND-OFF
                    </div>

                    <h2>
                      Transfer open session
                    </h2>

                    <p>
                      Change the active vehicle
                      plate while preserving the
                      parking spot and entry time.
                    </p>

                  </div>

                </div>


                <form
                  onSubmit={
                    transferSession
                  }
                >

                  <div className="operation-form">

                    <div className="form-field">

                      <label>
                        Current license plate
                      </label>

                      <input
                        value={
                          transferOldPlate
                        }
                        onChange={(e) =>
                          setTransferOldPlate(
                            e.target.value
                              .toUpperCase()
                          )
                        }
                        placeholder="RJ14AB1234"
                        required
                      />

                    </div>


                    <div className="form-field">

                      <label>
                        New license plate
                      </label>

                      <input
                        value={
                          transferNewPlate
                        }
                        onChange={(e) =>
                          setTransferNewPlate(
                            e.target.value
                              .toUpperCase()
                          )
                        }
                        placeholder="RJ14XY9999"
                        required
                      />

                    </div>

                  </div>


                  <button
                    className="dark-button"
                    disabled={loading}
                  >
                    {loading
                      ? "Transferring..."
                      : "Transfer session"}
                  </button>

                </form>


                {transferResult && (
                  <div className="success operation-result">

                    Session #
                    {
                      transferResult.session_id
                    }{" "}
                    transferred from{" "}

                    <strong>
                      {
                        transferResult
                          .old_license_plate
                      }
                    </strong>{" "}

                    to{" "}

                    <strong>
                      {
                        transferResult
                          .new_license_plate
                      }
                    </strong>
                    .

                    <br />

                    Spot #
                    {
                      transferResult.spot_id
                    }{" "}
                    and entry time were
                    preserved.

                  </div>
                )}

              </div>


              {/* -------------------------------------------
                  T2 CLOCK
                  ------------------------------------------- */}

              <div className="content-card operation-card">

                <div className="card-header">

                  <div>

                    <div className="eyebrow">
                      T2 · AUTOMATION
                    </div>

                    <h2>
                      24-hour auto-close
                    </h2>

                    <p>
                      Automatically bill and close
                      sessions parked for more than
                      24 hours.
                    </p>

                  </div>

                </div>


                <div className="operation-form">

                  <div className="form-field">

                    <label>
                      Simulated current time
                    </label>

                    <input
                      type="datetime-local"
                      value={clockTime}
                      onChange={(e) =>
                        setClockTime(
                          e.target.value
                        )
                      }
                    />

                    <small>
                      Leave empty to use the
                      server's current UTC time.
                    </small>

                  </div>

                </div>


                <button
                  className="dark-button"
                  onClick={runClock}
                  disabled={loading}
                >
                  {loading
                    ? "Running..."
                    : "Run clock job"}
                </button>


                {clockResult && (
                  <div className="clock-result">

                    <div className="clock-summary">

                      <strong>
                        {
                          clockResult
                            .auto_closed_count
                        }
                      </strong>

                      <span>
                        session(s) auto-closed
                      </span>

                    </div>


                    {clockResult.sessions
                      ?.length > 0 && (

                      <div className="clock-list">

                        {clockResult.sessions.map(
                          (item) => (
                            <div
                              key={
                                item.session_id
                              }
                              className="clock-item"
                            >

                              <strong>
                                {
                                  item.license_plate
                                }
                              </strong>

                              <span>
                                {
                                  item.billable_hours
                                }{" "}
                                hours
                              </span>

                              <strong>
                                ₹
                                {
                                  item.fee
                                }
                              </strong>

                            </div>
                          )
                        )}

                      </div>

                    )}

                  </div>
                )}

              </div>

            </div>
          )}

        </div>

      </main>

    </div>
  );
}

export default App;