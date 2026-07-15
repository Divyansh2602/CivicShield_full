"""Seed a completed demo scan so the frontend dashboard has data to render.

Usage: python seed_db.py   (backend package importable from this dir)
"""
import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.db import Base, SessionLocal, engine
from database.models import Scan, Vulnerability


def seed_db() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        surface = {
            "http://demo-vulnerable-site.com/login": {"risk": "HIGH"},
            "http://demo-vulnerable-site.com/api/v1/users": {"risk": "MEDIUM"},
            "http://demo-vulnerable-site.com/about": {"risk": "LOW"},
        }
        scan = Scan(
            target_url="http://demo-vulnerable-site.com",
            status="completed",
            surface_map=json.dumps(surface),
            created_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
        )
        db.add(scan)
        db.commit()
        db.refresh(scan)

        vulns = [
            Vulnerability(scan_id=scan.id, risk="CRITICAL", vuln_type="SQLi", url="http://demo-vulnerable-site.com/login", param="username", payload="' OR 1=1--", evidence="Syntax error in SQL query"),
            Vulnerability(scan_id=scan.id, risk="HIGH", vuln_type="XSS", url="http://demo-vulnerable-site.com/search", param="q", payload="<script>alert(1)</script>", evidence="Reflected malicious script"),
            Vulnerability(scan_id=scan.id, risk="MEDIUM", vuln_type="IDOR", url="http://demo-vulnerable-site.com/profile", param="id", payload="id=5 -> id=6", evidence="Accessed another user's profile"),
            Vulnerability(scan_id=scan.id, risk="CRITICAL", vuln_type="SQLi", url="http://demo-vulnerable-site.com/products", param="category", payload="1 UNION SELECT * FROM users", evidence="Dumped database rows"),
            Vulnerability(scan_id=scan.id, risk="HIGH", vuln_type="XSS", url="http://demo-vulnerable-site.com/contact", param="message", payload="<img src=x onerror=alert(1)>", evidence="Stored XSS on admin panel"),
        ]
        db.add_all(vulns)
        db.commit()
        print(f"Seeded demo scan id={scan.id} with {len(vulns)} findings")
    finally:
        db.close()


if __name__ == "__main__":
    seed_db()
