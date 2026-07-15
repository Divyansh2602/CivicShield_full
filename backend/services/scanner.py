# ===================================================
# CivicShield AI — Scan orchestration service
# The database is the single source of truth for scan state (survives restarts
# and works across workers). Background execution runs the analyzer engine and
# persists status + findings + surface map.
# ===================================================
import json
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from analyzer.engine import run_scan
from database.db import SessionLocal
from database.models import Scan, Vulnerability

logger = logging.getLogger("civicshield.scanner")


def create_scan(db: Session, target: str) -> Scan:
    scan = Scan(target_url=target, status="queued")
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


def run_scan_task(scan_id: int, target: str) -> None:
    """Background task: execute the scan and persist results. Opens its own
    session because it runs outside the request lifecycle."""
    db = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if scan is None:
            logger.error("run_scan_task: scan %s vanished before execution", scan_id)
            return

        scan.status = "running"
        db.commit()

        result = run_scan(target)

        for finding in result.get("findings", []):
            db.add(
                Vulnerability(
                    scan_id=scan_id,
                    risk=finding.get("risk"),
                    vuln_type=finding.get("vuln"),
                    url=finding.get("url"),
                    param=finding.get("param"),
                    payload=finding.get("payload"),
                    evidence=finding.get("evidence"),
                )
            )

        scan.surface_map = json.dumps(result.get("surface_map", {}))
        scan.status = "completed"
        scan.completed_at = datetime.now(timezone.utc)
        db.commit()
        logger.info(
            "Scan %s completed: %d findings", scan_id, len(result.get("findings", []))
        )
    except Exception as exc:  # noqa: BLE001 — persist failure, never crash the worker
        db.rollback()
        logger.exception("Scan %s failed", scan_id)
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if scan is not None:
            scan.status = "failed"
            scan.error = str(exc)[:1000]
            db.commit()
    finally:
        db.close()


def build_status_payload(scan: Scan, db: Session) -> dict:
    """Assemble the GET /scan/{id} response from persisted state."""
    payload = {"scan_id": scan.id, "status": scan.status, "error": scan.error}

    if scan.status == "completed":
        vulns = db.query(Vulnerability).filter(Vulnerability.scan_id == scan.id).all()
        findings = [
            {
                "risk": v.risk,
                "vuln": v.vuln_type,
                "url": v.url,
                "param": v.param,
                "payload": v.payload,
                "evidence": v.evidence,
            }
            for v in vulns
        ]
        try:
            surface_map = json.loads(scan.surface_map) if scan.surface_map else {}
        except (json.JSONDecodeError, TypeError):
            surface_map = {}

        payload["result"] = {
            "target": scan.target_url,
            "findings": findings,
            "surface_map": surface_map,
        }

    return payload
