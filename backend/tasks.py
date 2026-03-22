from celery import shared_task
from worker import celery_app
from civicshield_core.analyzer.engine import run_scan
from database.db import SessionLocal
from database.models import Scan, Vulnerability
from datetime import datetime

@celery_app.task(bind=True, name="run_target_scan", track_started=True)
def run_target_scan(self, scan_id: int, target: str):
    def update_progress(stage, percent, message, stats=None):
        self.update_state(
            state='PROGRESS',
            meta={
                'stage': stage, 
                'percent': percent, 
                'message': message, 
                'stats': stats or {},
                'updated_at': datetime.utcnow().isoformat()
            }
        )

    db = SessionLocal()
    try:
        db_scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if db_scan:
            db_scan.status = "running"
            db.commit()

        # Update initial state immediately so the frontend sees it's running
        update_progress("recon", 5, "Preparing scan pipeline")

        # Run the powerful civicshield-core scanner
        result = run_scan(target, progress_callback=update_progress)

        # Store vulnerabilities in the database for persistence
        for finding in result["findings"]:
            db.add(Vulnerability(
                scan_id=scan_id,
                risk=finding["risk"],
                vuln_type=finding["vuln"],
                url=finding["url"],
                param=finding.get("param"),
                payload=finding.get("payload"),
                evidence=finding.get("evidence"),
            ))

        if db_scan:
            db_scan.status = "completed"
        db.commit()

        return {"result": result, "status": "completed"}
    except Exception as e:
        if 'db_scan' in locals() and db_scan:
            db_scan.status = "failed"
            db.commit()
        raise e
    finally:
        db.close()
