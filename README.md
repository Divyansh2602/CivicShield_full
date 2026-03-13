🚀 CivicShield AI

AI-Powered Cyber Resilience Platform

⸻

🔥 Overview

CivicShield AI is an intelligent cyber security platform designed to:
	•	🔍 Detect vulnerabilities (SQLi, XSS, Injection flaws)
	•	🎯 Perform attack surface analysis
	•	🛡️ Detect phishing threats
	•	📊 Calculate real-time Cyber Risk Score
	•	📈 Provide executive security dashboard
	•	📄 Generate professional PDF pentest reports
	•	🔐 Secure APIs with JWT authentication

It transforms raw scan data into actionable intelligence.

⸻

🧠 Why CivicShield AI?

Traditional scanners dump findings.

CivicShield AI:
	•	Prioritizes risk
	•	Quantifies impact
	•	Visualizes threat trends
	•	Converts technical findings into executive insights

Built for modern cyber defense.

⸻
```
🏗️ System Architecture
flowchart TD

User -->|Login/Register| AuthAPI
User -->|Start Scan| ScanAPI
User -->|Phishing Check| PhishingAPI
User -->|View Dashboard| Dashboard

ScanAPI --> ScanEngine
PhishingAPI --> PhishingDetector

ScanEngine --> Database
PhishingDetector --> Database

Database --> Dashboard
Database --> ReportGenerator

ReportGenerator --> PDFReport
```
```
🧩 Internal Architecture

flowchart LR

subgraph Backend
    A[FastAPI App]
    B[Auth Module]
    C[Scan Engine]
    D[Phishing Detector]
    E[Risk Engine]
    F[PDF Generator]
end

subgraph Database
    G[(Scan Table)]
    H[(Vulnerability Table)]
    I[(User Table)]
end

A --> B
A --> C
A --> D
C --> G
C --> H
D --> H
A --> E
E --> H
A --> F
F --> H
```
![WhatsApp Image 2026-02-28 at 12 41 26](https://github.com/user-attachments/assets/d6869d39-ee2f-4572-a371-089626649cf5)


📊 Dashboard Intelligence Flow

sequenceDiagram
    participant User
    participant FastAPI
    participant Database
    participant RiskEngine
    participant ChartJS

    User->>FastAPI: GET /dashboard
    FastAPI->>Database: Fetch scan + vuln data
    Database-->>FastAPI: Data
    FastAPI->>RiskEngine: Calculate risk score
    RiskEngine-->>FastAPI: Score + Label
    FastAPI-->>User: Render dashboard.html
    User->>ChartJS: Render charts

<img width="2559" height="1152" alt="image" src="https://github.com/user-attachments/assets/f61b1d06-4143-4693-b836-c0d8214016dd" />


⚙️ Tech Stack

Layer
Technology
Backend
FastAPI
Database
SQLAlchemy + SQLite
Auth
JWT + bcrypt
Frontend Framework
Next.js 14 + React 18
Styling & UI
Tailwind CSS + Glassmorphism UX
Animations
Framer Motion (3D Hover & Shimmer)
Data Visualization
Recharts + react-force-graph-2d
Reporting
Custom PDF Generator
Security
Custom Scan Engine


🛡️ Core Features

✅ Automated Scan Engine
	•	SQL Injection Detection
	•	XSS Detection
	•	Parameter Fuzzing
	•	Endpoint Discovery

✅ Phishing Detection
	•	URL heuristic analysis
	•	Suspicious pattern detection

✅ Risk Scoring Engine

Weighted severity model:

Critical × 10
High × 6
Medium × 3
Normalized to 0–100

✅ Executive Dashboard
	•	Interactive Risk Dashboard & SVG Animations
	•	Cyber Attack World Map (Framer Motion lasers)
	•	AI Threat Insights Panel 
	•	Live 7-day scan trends via Recharts
	•	Dynamic Vulnerability Distribution

<img width="1171" height="1033" alt="image" src="https://github.com/user-attachments/assets/02fd33bb-e7ca-4b27-b6ad-5ca0c3ef290d" />
<img width="1086" height="771" alt="image" src="https://github.com/user-attachments/assets/bded3bb5-ec7a-474f-a5f6-436a8319425b" />

✅ Startup-Level UI/UX
	•	Premium Glassmorphism aesthetics with neon glowing CSS properties
	•	Dynamic 3D Hover Lift effects
	•	Pulsing Shimmer Skeleton Loaders
	•	Sleek toast notifications (react-hot-toast)
	•	Fully responsive mobile drawer sidebar

✅ PDF Report Generator
	•	Target summary
	•	Findings
	•	Risk breakdown
	•	Professional formatting

⸻
```
📂 Project Structure

attack_surface_analyzer/
│
├── main.py
├── analyzer/
│   ├── engine.py
│   ├── phishing_detector.py
│   └── pdf_report_generator.py
│
├── api/
│   └── auth.py
│
├── database/
│   ├── db.py
│   └── models.py
│
├── templates/
│   └── dashboard.html
│
├── static/
│
└── README.md
```
```
🔐 API Endpoints

Method
Endpoint
Description
GET
/dashboard
Security dashboard
POST
/register
Create user
POST
/login
JWT login
POST
/scan
Start vulnerability scan
POST
/phishing/check
Phishing detection
GET
/scans
List scans
GET
/scan/status/{id}
Scan status
GET
/scan/results/{id}
Scan results
GET
/report/{id}
Generate PDF report
```
🧪 How to Run (Local)
```bash
# 1. Clone repo
git clone https://github.com/Divyansh2602/CivicShield_full.git
cd CivicShield_full

# 2. Python backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
python main.py  # runs FastAPI on http://localhost:8000

# 3. Next.js frontend (in another terminal, same folder)
npm install
npm run dev     # serves UI on http://localhost:3000

# 4. Open the app
http://localhost:3000
```
📈 Example Risk Output
	•	Critical: 138
	•	High: 378
	•	Medium: 338
	•	Risk Score: 50 / 100 (HIGH)

Dynamic, normalized, realistic.

🧠 Future Enhancements
	•	AI-powered exploit prediction
	•	CVSS scoring integration
	•	Real-time WebSocket updates
	•	Role-based access control
	•	Threat intelligence feeds
	•	Multi-tenant deployment
