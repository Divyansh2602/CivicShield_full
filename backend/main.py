# ===================================================
# CivicShield AI - API Layer
# Author: Divyansh Gupta
# ===================================================

from fastapi import FastAPI, BackgroundTasks, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from datetime import datetime, timedelta
import os
from sqlalchemy import func
import uvicorn
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from analyzer.phishing_detector import PhishingDetector
from analyzer.engine import run_scan
from analyzer.pdf_report_generator import PDFReportGenerator
from database.db import engine, SessionLocal
from database.models import Base, Scan, Vulnerability, User
from api.auth import hash_password, verify_password, create_access_token

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CivicShield AI")
templates = Jinja2Templates(directory="templates")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scan_store = {}
report_lock = __import__("threading").Lock()


class ScanRequest(BaseModel):
    target: str


class AuthRequest(BaseModel):
    username: str
    password: str


@app.get("/")
def root():
    return {"message": "CivicShield AI API Running"}


@app.get("/dashboard")
def dashboard(request: Request):
    db = SessionLocal()
    try:
        total_scans = db.query(Scan).count()
        total_vulns = db.query(Vulnerability).count()
        critical_risk = db.query(Vulnerability).filter(func.lower(Vulnerability.risk) == "critical").count()
        high_risk = db.query(Vulnerability).filter(func.lower(Vulnerability.risk) == "high").count()
        medium_risk = db.query(Vulnerability).filter(func.lower(Vulnerability.risk) == "medium").count()

        raw_score = (critical_risk * 5 + high_risk * 3 + medium_risk)
        max_possible = total_vulns * 5 if total_vulns > 0 else 1
        risk_score = min(int((raw_score / max_possible) * 100), 100)

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

        trend_labels = []
        trend_counts = []
        today = datetime.utcnow().date()
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            count = db.query(Scan).filter(func.date(Scan.created_at) == day).count()
            trend_labels.append(day.strftime("%Y-%m-%d"))
            trend_counts.append(count)

        latest_vulns = db.query(Vulnerability).order_by(Vulnerability.id.desc()).limit(10).all()
        vuln_list = [{"risk": v.risk, "type": v.vuln_type, "url": v.url, "param": v.param} for v in latest_vulns]

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
                "risk_color": risk_color,
            },
        )
    finally:
        db.close()


@app.post("/register")
def register(request: AuthRequest):
    db = SessionLocal()
    if db.query(User).filter(User.username == request.username).first():
        db.close()
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(username=request.username, password_hash=hash_password(request.password))
    db.add(user)
    db.commit()
    db.close()
    return {"message": "User registered successfully"}


@app.post("/login")
def login(request: AuthRequest):
    db = SessionLocal()
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password_hash):
        db.close()
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.username})
    db.close()
    return {"access_token": token, "token_type": "bearer"}


@app.post("/phishing/check")
def check_phishing(url: str):
    if not url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid URL format")
    return PhishingDetector().analyze(url)


def update_scan_progress(scan_id: int, stage: str, percent: int, message: str, stats=None):
    if scan_id not in scan_store:
        return
    scan_store[scan_id]["progress"] = {
        "stage": stage,
        "percent": percent,
        "message": message,
        "stats": stats or {},
        "updated_at": datetime.utcnow().isoformat(),
    }


def background_scan(scan_id: int, target: str):
    db = SessionLocal()
    try:
        scan_store[scan_id]["status"] = "running"
        update_scan_progress(scan_id, "recon", 10, "Preparing scan pipeline")

        db_scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if db_scan:
            db_scan.status = "running"
            db.commit()

        result = run_scan(
            target,
            progress_callback=lambda stage, percent, message, stats=None: update_scan_progress(
                scan_id, stage, percent, message, stats
            ),
        )

        if db_scan:
            db_scan.status = "completed"
            db.commit()

        for finding in result["findings"]:
            db.add(Vulnerability(
                scan_id=db_scan.id,
                risk=finding["risk"],
                vuln_type=finding["vuln"],
                url=finding["url"],
                param=finding.get("param"),
                payload=finding.get("payload"),
                evidence=finding.get("evidence"),
            ))

        db.commit()
        scan_store[scan_id]["status"] = "completed"
        scan_store[scan_id]["result"] = result
        update_scan_progress(scan_id, "complete", 100, "Scan completed and results are ready", result.get("summary", {}))
    except Exception as e:
        scan_store[scan_id]["status"] = "failed"
        scan_store[scan_id]["error"] = str(e)
        update_scan_progress(scan_id, "failed", 100, "Scan failed before completion")
    finally:
        db.close()


@app.post("/scan")
def start_scan(request: ScanRequest, background_tasks: BackgroundTasks):
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
        "error": None,
        "progress": {
            "stage": "queued",
            "percent": 5,
            "message": "Scan queued and waiting for execution",
            "stats": {},
            "updated_at": datetime.utcnow().isoformat(),
        },
    }
    background_tasks.add_task(background_scan, scan_id, request.target)
    return {"scan_id": scan_id, "status": "queued"}


@app.get("/scan/{scan_id}")
def scan_status(scan_id: int):
    db = SessionLocal()
    try:
        if scan_id in scan_store:
            scan_data = scan_store[scan_id]
        else:
            db_scan = db.query(Scan).filter(Scan.id == scan_id).first()
            if not db_scan:
                raise HTTPException(status_code=404, detail="Scan ID not found")

            scan_data = {
                "status": db_scan.status,
                "error": None,
                "progress": {
                    "stage": db_scan.status,
                    "percent": 100 if db_scan.status == "completed" else 0,
                    "message": "Historical scan loaded from storage",
                    "stats": {},
                    "updated_at": datetime.utcnow().isoformat(),
                },
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
                        "evidence": v.evidence,
                    })
                severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
                vuln_type_counts = {}
                for finding in findings:
                    risk = str(finding.get("risk", "LOW")).lower()
                    severity_counts[risk] = severity_counts.get(risk, 0) + 1
                    vuln_type_counts[finding["vuln"]] = vuln_type_counts.get(finding["vuln"], 0) + 1
                scan_data["result"] = {
                    "target": db_scan.target_url,
                    "findings": findings,
                    "summary": {
                        "confirmed_findings": len(findings),
                        "severity_counts": severity_counts,
                        "vulnerability_types": vuln_type_counts,
                    },
                }
                scan_store[scan_id] = scan_data

        response = {
            "scan_id": scan_id,
            "status": scan_data["status"],
            "error": scan_data.get("error"),
            "progress": scan_data.get("progress"),
        }
        if scan_data["status"] == "completed" and "result" in scan_data:
            response["result"] = scan_data["result"]
        return response
    finally:
        db.close()


@app.get("/report/{scan_id}")
def generate_report(scan_id: int):
    if scan_id not in scan_store:
        raise HTTPException(status_code=404, detail="Scan ID not found")
    if scan_store[scan_id]["status"] != "completed":
        raise HTTPException(status_code=400, detail="Scan not completed yet")

    data = scan_store[scan_id]["result"]
    report_filename = f"pentest_report_{scan_id}.pdf"
    with report_lock:
        PDFReportGenerator().generate(data["target"], data["findings"], data.get("summary"))
        if not os.path.exists("pentest_report.pdf"):
            raise HTTPException(status_code=500, detail="Report generation failed")
        os.replace("pentest_report.pdf", report_filename)

    return FileResponse(path=report_filename, media_type="application/pdf", filename=f"report_{scan_id}.pdf")


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
