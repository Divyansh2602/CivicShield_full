# ===================================================
# CivicShield AI – API Layer
# Author: Divyansh Gupta
# ===================================================

from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from datetime import datetime, timedelta
import os
import threading
from sqlalchemy import func
import uvicorn
import sys

# Add the backend directory to sys.path so absolute imports work from anywhere
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from analyzer.phishing_detector import PhishingDetector
from analyzer.engine import run_scan
from analyzer.pdf_report_generator import PDFReportGenerator

from database.db import engine, SessionLocal
from database.models import Base, Scan, Vulnerability, User

from api.auth import (
    hash_password,
    verify_password,
    create_access_token,
    verify_token
)

# ===================================================
# DB Init
# ===================================================
Base.metadata.create_all(bind=engine)

# ===================================================
# FastAPI App
# ===================================================
app = FastAPI(title="CivicShield AI")
templates = Jinja2Templates(directory="templates")


# ===================================================
# CORS Configuration for Next.js Frontend
# ===================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scan_store = {}
scan_id_lock = threading.Lock()
scan_id_counter = 0
report_lock = threading.Lock()

# ===================================================
# MODELS
# ===================================================
class ScanRequest(BaseModel):
    target: str


class AuthRequest(BaseModel):
    username: str
    password: str

# ===================================================
# ROOT
# ===================================================
@app.get("/")
def root():
    return {"message": "CivicShield AI API Running"}

# ===================================================
# DASHBOARD
# ===================================================
@app.get("/dashboard")
def dashboard(request: Request):

    db = SessionLocal()

    try:
        # -------------------------------
        # BASIC COUNTS
        # -------------------------------
        total_scans = db.query(Scan).count()
        total_vulns = db.query(Vulnerability).count()

        critical_risk = db.query(Vulnerability).filter(
            func.lower(Vulnerability.risk) == "critical"
        ).count()

        high_risk = db.query(Vulnerability).filter(
            func.lower(Vulnerability.risk) == "high"
        ).count()

        medium_risk = db.query(Vulnerability).filter(
            func.lower(Vulnerability.risk) == "medium"
        ).count()

        # -------------------------------
        # IMPROVED WEIGHTED RISK SCORE
        # -------------------------------
        critical_weight = 5
        high_weight = 3
        medium_weight = 1

        raw_score = (
            critical_risk * critical_weight +
            high_risk * high_weight +
            medium_risk * medium_weight
        )

        max_possible = total_vulns * critical_weight if total_vulns > 0 else 1

        risk_score = int((raw_score / max_possible) * 100)
        risk_score = min(risk_score, 100)

        if risk_score >= 75:
            risk_label = "CRITICAL"
            risk_color = "danger"
        elif risk_score >= 50:
            risk_label = "HIGH"
            risk_color = "warning"
        elif risk_score >= 25:
            risk_label = "MEDIUM"
            risk_color = "info"
        else:
            risk_label = "LOW"
            risk_color = "success"

        # -------------------------------
        # LAST 7 DAYS TREND (NO GAPS)
        # -------------------------------
        trend_labels = []
        trend_counts = []

        today = datetime.utcnow().date()

        for i in range(6, -1, -1):
            day = today - timedelta(days=i)

            count = db.query(Scan).filter(
                func.date(Scan.created_at) == day
            ).count()

            trend_labels.append(day.strftime("%Y-%m-%d"))
            trend_counts.append(count)

        # -------------------------------
        # LATEST 10 VULNERABILITIES
        # -------------------------------
        latest_vulns = (
            db.query(Vulnerability)
            .order_by(Vulnerability.id.desc())
            .limit(10)
            .all()
        )

        vuln_list = [
            {
                "risk": v.risk,
                "type": v.vuln_type,
                "url": v.url,
                "param": v.param
            }
            for v in latest_vulns
        ]

        return templates.TemplateResponse(
            "dashboard.html",
            {
                "request": request,
                "total_scans": total_scans,
                "total_vulns": total_vulns,
                "critical_risk": critical_risk,
                "high_risk": high_risk,
                "medium_risk": medium_risk,
                "trend_labels": trend_labels,
                "trend_counts": trend_counts,
                "vuln_list": vuln_list,
                "risk_score": risk_score,
                "risk_label": risk_label,
                "risk_color": risk_color
            }
        )

    finally:
        db.close()

# ===================================================
# REGISTER
# ===================================================
@app.post("/register")
def register(request: AuthRequest):

    db = SessionLocal()

    if db.query(User).filter(User.username == request.username).first():
        db.close()
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(
        username=request.username,
        password_hash=hash_password(request.password)
    )

    db.add(user)
    db.commit()
    db.close()

    return {"message": "User registered successfully"}

# ===================================================
# LOGIN
# ===================================================
@app.post("/login")
def login(request: AuthRequest):

    db = SessionLocal()

    user = db.query(User).filter(User.username == request.username).first()

    if not user or not verify_password(request.password, user.password_hash):
        db.close()
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.username})
    db.close()

    return {
        "access_token": token,
        "token_type": "bearer"
    }

# ===================================================
# PHISHING CHECK
# ===================================================
@app.post("/phishing/check")
def check_phishing(url: str):

    if not url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid URL format")

    detector = PhishingDetector()
    return detector.analyze(url)

# ===================================================
# BACKGROUND SCAN
# ===================================================
def background_scan(scan_id: int, target: str):

    db = SessionLocal()

    try:
        scan_store[scan_id]["status"] = "running"
        
        db_scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if db_scan:
            db_scan.status = "running"
            db.commit()

        result = run_scan(target)

        db_scan.status = "completed"
        db.commit()

        for finding in result["findings"]:
            vuln = Vulnerability(
                scan_id=db_scan.id,
                risk=finding["risk"],
                vuln_type=finding["vuln"],
                url=finding["url"],
                param=finding["param"],
                payload=finding["payload"],
                evidence=finding["evidence"]
            )
            db.add(vuln)

        db.commit()

        scan_store[scan_id]["status"] = "completed"
        scan_store[scan_id]["result"] = result

    except Exception as e:
        scan_store[scan_id]["status"] = "failed"
        scan_store[scan_id]["error"] = str(e)

    finally:
        db.close()

# ===================================================
# START SCAN
# ===================================================
@app.post("/scan")
def start_scan(
    request: ScanRequest,
    background_tasks: BackgroundTasks
):

    if not request.target.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid URL format")

    db = SessionLocal()
    try:
        db_scan = Scan(target_url=request.target, status="queued")
        db.add(db_scan)
        db.commit()
        db.refresh(db_scan)
        scan_id = db_scan.id
    finally:
        db.close()

    scan_store[scan_id] = {
        "status": "queued",
        "result": None,
        "error": None
    }

    background_tasks.add_task(background_scan, scan_id, request.target)

    return {"scan_id": scan_id, "status": "queued"}

# ===================================================
# SCAN STATUS
# ===================================================
@app.get("/scan/{scan_id}")
def scan_status(scan_id: int):

    db = SessionLocal()
    try:
        if scan_id in scan_store:
            scan_data = scan_store[scan_id]
        else:
            # Fallback to database for historical scans after a server restart
            db_scan = db.query(Scan).filter(Scan.id == scan_id).first()
            if not db_scan:
                raise HTTPException(status_code=404, detail="Scan ID not found")
            
            scan_data = {
                "status": db_scan.status,
                "error": None
            }
            if db_scan.status == "completed":
                vulns = db.query(Vulnerability).filter(Vulnerability.scan_id == scan_id).all()
                findings = []
                for v in vulns:
                    findings.append({
                        "risk": v.risk,
                        "vuln": v.vuln_type,
                        "url": v.url,
                        "param": v.param,
                        "payload": v.payload,
                        "evidence": v.evidence
                    })
                scan_data["result"] = {
                    "target": db_scan.target_url,
                    "findings": findings
                }
                
                # Cache it back in memory for future queries
                scan_store[scan_id] = scan_data

        response = {
            "scan_id": scan_id,
            "status": scan_data["status"],
            "error": scan_data.get("error")
        }

        if scan_data["status"] == "completed" and "result" in scan_data:
            response["result"] = scan_data["result"]

        return response
    finally:
        db.close()

# ===================================================
# REPORT
# ===================================================
@app.get("/report/{scan_id}")
def generate_report(scan_id: int):

    if scan_id not in scan_store:
        raise HTTPException(status_code=404, detail="Scan ID not found")

    if scan_store[scan_id]["status"] != "completed":
        raise HTTPException(status_code=400, detail="Scan not completed yet")

    data = scan_store[scan_id]["result"]

    report_filename = f"pentest_report_{scan_id}.pdf"
    with report_lock:
        pdf = PDFReportGenerator()
        pdf.generate(data["target"], data["findings"])

        if not os.path.exists("pentest_report.pdf"):
            raise HTTPException(status_code=500, detail="Report generation failed")
        os.replace("pentest_report.pdf", report_filename)

    return FileResponse(
        path=report_filename,
        media_type="application/pdf",
        filename=f"report_{scan_id}.pdf"
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

