# Nabh-Rakshak — Space Situational Awareness & Collision Risk Dashboard

> **See the Orbit. Predict the Threat. Protect the Mission.**
<img width="1440" height="730" alt="image" src="https://github.com/user-attachments/assets/a6e43b69-af46-4d53-bce9-d4920fb7bfd2" />

Nabh-Rakshak is a web-based **Space Situational Awareness (SSA)** platform designed to track satellites and space debris, predict potential close-approach events, and present collision risks through an intuitive visual dashboard.

The platform combines **live orbital data, SGP4-based propagation, conjunction screening, risk scoring, 3D visualization, alerts, and space-weather information** in a single interface.

---

Nabh-Rakshak follows a simple pipeline:

```text
TLE / OMM Data Ingestion
        ↓
   Orbit Propagation
        ↓
 Conjunction Detection
        ↓
Risk Scoring & Assessment
        ↓
   ┌────┴────┐
   ▼         ▼
3D Orbit   Alerts &
Visualization  Analytics
```

Users can track orbital objects, explore trajectories, detect conjunctions, compare approaching objects, understand collision risk, monitor space-weather conditions, and review historical risk data — all from one dashboard.

---

## Key Features

### Live Orbital Tracking
- Ingest publicly available TLE/OMM orbital data
- Track satellites and debris objects
- Display orbital objects on an interactive globe

### Orbital Propagation
- Propagate satellite states into the future using SGP4
- Generate predicted orbital trajectories over a configurable window

### Conjunction Detection
- Compare predicted positions between orbital objects
- Detect close approaches within configurable thresholds
- Estimate time and distance of closest approach

### Collision Risk Scoring
- Convert conjunction parameters into an intuitive risk score
- Categorize threats by severity and prioritize events

### 3D Space Visualization
- Interactive Earth-centered orbital visualization
- Orbit-path rendering with highlighted high-risk objects
- Interactive object inspection

### Risk Alerts
- Dedicated high-risk conjunction list
- Time-to-close-approach and closest-approach distance
- Object pair identification and risk-level prioritization

### Space Weather Insights
- Solar activity and geomagnetic condition data
- Environmental context alongside orbital analysis

### Risk History & Analytics
- Per-object risk history and conjunction analytics
- Dashboard-level orbital statistics

---

## Technical Architecture

```text
                         ┌──────────────────────────┐
                         │       Web Dashboard      │
                         │ React + TypeScript       │
                         │ CesiumJS + Three.js      │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │       REST API           │
                         │ Flask Backend            │
                         └────────────┬─────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
          ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
          │ Orbital Data   │ │ Space Weather  │ │ Database       │
          │ Space-Track    │ │ NOAA SWPC      │ │ Object Records │
          │ CelesTrak      │ │                │ │ Alert History  │
          └───────┬────────┘ └────────────────┘ └────────────────┘
                  │
                  ▼
        ┌─────────────────────────┐
        │     Application Layer   │
        │ Orbit Propagation       │
        │ Conjunction Engine      │
        │ Risk Assessment         │
        │ Analytics Engine        │
        └────────────┬────────────┘
                     │
                     ▼
          ┌────────────────────────┐
          │ Dashboard Intelligence │
          │ 3D Visualization       │
          │ Risk Alerts            │
          │ Analytics              │
          └────────────────────────┘
```

---

## Technology Stack

**Frontend:** React, TypeScript, CesiumJS, Three.js

**Backend:** Python, Flask, REST APIs

**Orbital Computation:** SGP4 propagation, TLE/OMM processing, relative-position and closest-approach calculations, conjunction screening

**Data Sources:** Space-Track orbital catalog, CelesTrak orbital data, NOAA Space Weather data

**Data Storage:** Satellite/object records, conjunction events, risk history, analytics data

---

## System Workflow

1. **Data Ingestion** — TLE/OMM data is validated, normalized, and added to the object catalog.
2. **Orbit Propagation** — Orbital elements are propagated with SGP4 to predict future trajectories.
3. **Conjunction Screening** — Predicted trajectories are compared to identify close approaches and closest-approach distance/time.
4. **Risk Assessment** — Conjunctions are scored using predicted separation, time to closest approach, relative motion, object characteristics, and screening thresholds.
5. **Visualization** — Detected threats are surfaced on the dashboard with risk scores and alerts.

---

## Dashboard Modules

| Module | Description |
|---|---|
| **Mission Overview** | High-level view: objects tracked, active conjunctions, high-risk events, space-weather status |
| **3D Orbital View** | Interactive Earth, satellites, debris, orbital paths, flagged conjunctions |
| **Conjunction Monitor** | Scannable list of close approaches with object pair, distance, and risk level |
| **Object Intelligence** | Per-object identification, orbital parameters, trajectory, and risk history |
| **Space Weather** | Solar activity and geomagnetic indicators |

---

## Technical Limitations

Nabh-Rakshak is a prototype intended to demonstrate an accessible approach to Space Situational Awareness. It should **not** be considered a flight-qualified collision-avoidance system.

Prediction accuracy depends on the quality and age of orbital data, TLE uncertainty, propagation model limitations, object-state uncertainty, and screening thresholds. The risk score is intended for **screening and prioritization**, not as a replacement for professional conjunction assessment systems.

---

## Project Structure

```text
Nabh-Rakshak/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   └── utils/
│
├── backend/
│   ├── api/
│   ├── services/
│   ├── propagation/
│   ├── conjunction/
│   ├── risk/
│   └── models/
│
├── data/
│   └── orbital/
│
├── docs/
│   ├── architecture/
│   ├── methodology/
│   └── references/
│
├── tests/
│
├── README.md
└── LICENSE
```

---

## Getting Started

### Prerequisites
- Node.js
- Python
- Git
- A modern web browser

### Clone the Repository

```bash
git clone https://github.com/Ri1tik/NabhRakshak.git
cd Nabh-Rakshak
```

### Start the Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt

python app.py
```

### Start the Frontend

```bash
cd frontend

npm install
npm run dev
```

Open the local development URL displayed by Vite.

---

## References

- **Space-Track.org** — Primary source for publicly available satellite orbital catalog information
- **CelesTrak** — Supplemental TLE/OMM orbital data source
- **NOAA Space Weather Prediction Center (SWPC)** — Solar and geomagnetic activity data
- **NASA Spacecraft Conjunction Assessment and Collision Avoidance Best Practices Handbook**
- **NASA CARA** — Conjunction assessment and collision avoidance resources
- **NASA-STD-8719.14** — Orbital debris mitigation reference

---

## Project Status

**Status:** Working Prototype

Current focus: orbital object visualization, data processing, propagation, conjunction screening, risk prioritization, dashboard analytics, and space-weather insights. Further validation and more advanced collision-probability models are required before operational deployment.

---
