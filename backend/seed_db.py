import sys
import os

# Add the backend directory to sys.path so absolute imports work from anywhere
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime
from database.db import SessionLocal
from database.models import Scan, Vulnerability

def seed_db():
    db = SessionLocal()
    try:
        # Create a scan
        scan = Scan(
            target_url="http://demo-vulnerable-site.com",
            status="completed",
            created_at=datetime.utcnow()
        )
        db.add(scan)
        db.commit()
        db.refresh(scan)
        
        # Add vulnerabilities
        vulns = [
            Vulnerability(scan_id=scan.id, risk="CRITICAL", vuln_type="SQLi", url="http://demo-vulnerable-site.com/login", param="username", payload="' OR 1=1--", evidence="Syntax error in SQL query"),
            Vulnerability(scan_id=scan.id, risk="HIGH", vuln_type="XSS", url="http://demo-vulnerable-site.com/search", param="q", payload="<script>alert(1)</script>", evidence="Reflected malicious script"),
            Vulnerability(scan_id=scan.id, risk="MEDIUM", vuln_type="IDOR", url="http://demo-vulnerable-site.com/profile", param="id", payload="id=5 -> id=6", evidence="Accessed another user's profile"),
            Vulnerability(scan_id=scan.id, risk="CRITICAL", vuln_type="SQLi", url="http://demo-vulnerable-site.com/products", param="category", payload="1 UNION SELECT * FROM users", evidence="Dumped database rows"),
            Vulnerability(scan_id=scan.id, risk="HIGH", vuln_type="XSS", url="http://demo-vulnerable-site.com/contact", param="message", payload="<img src=x onerror=alert(XSS)>", evidence="Stored XSS on admin panel")
        ]
        
        db.add_all(vulns)
        db.commit()
        print(f"Successfully seeded DB. Scan ID: {scan.id}, Vulns added: {len(vulns)}")
    except Exception as e:
        print(f"Error seeding DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
