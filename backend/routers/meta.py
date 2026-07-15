# ===================================================
# CivicShield AI — Meta routes: root, health, legacy dashboard
# ===================================================
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import func
from sqlalchemy.orm import Session

from config import settings
from database.db import get_db
from database.models import Scan, Vulnerability

router = APIRouter(tags=["meta"])
templates = Jinja2Templates(directory="templates")


@router.get("/")
def root():
    return {"message": "CivicShield AI API Running", "status": "ok"}


@router.get("/health")
def health():
    """Lightweight liveness probe used by keep-warm and uptime monitors."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "environment": settings.environment,
        "time": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request, db: Session = Depends(get_db)):
    """Legacy server-rendered overview (separate from the Next.js console)."""
    total_scans = db.query(Scan).count()
    total_vulns = db.query(Vulnerability).count()

    def count_risk(level: str) -> int:
        return (
            db.query(Vulnerability)
            .filter(func.lower(Vulnerability.risk) == level)
            .count()
        )

    critical_risk = count_risk("critical")
    high_risk = count_risk("high")
    medium_risk = count_risk("medium")

    raw_score = critical_risk * 5 + high_risk * 3 + medium_risk * 1
    max_possible = total_vulns * 5 if total_vulns > 0 else 1
    risk_score = min(int((raw_score / max_possible) * 100), 100)

    if risk_score >= 75:
        risk_label, risk_color = "CRITICAL", "danger"
    elif risk_score >= 50:
        risk_label, risk_color = "HIGH", "warning"
    elif risk_score >= 25:
        risk_label, risk_color = "MEDIUM", "info"
    else:
        risk_label, risk_color = "LOW", "success"

    trend_labels, trend_counts = [], []
    today = datetime.now(timezone.utc).date()
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        count = db.query(Scan).filter(func.date(Scan.created_at) == day).count()
        trend_labels.append(day.strftime("%Y-%m-%d"))
        trend_counts.append(count)

    latest_vulns = (
        db.query(Vulnerability).order_by(Vulnerability.id.desc()).limit(10).all()
    )
    vuln_list = [
        {"risk": v.risk, "type": v.vuln_type, "url": v.url, "param": v.param}
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
            "risk_color": risk_color,
        },
    )
