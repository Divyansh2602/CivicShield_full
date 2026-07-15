# ===================================================
# CivicShield AI — Scan routes: start, status, report
# Contract preserved for the Next.js frontend:
#   POST /scan            {target}          -> {scan_id, status}
#   GET  /scan/{scan_id}                    -> {scan_id, status, error, result?}
#   GET  /report/{scan_id}                  -> application/pdf
# ===================================================
import logging
import os

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from starlette.background import BackgroundTask

from config import settings
from database.db import get_db
from database.models import Scan, Vulnerability
from ratelimit import limiter
from schemas import ScanCreatedResponse, ScanRequest, ScanStatusResponse
from services.reporting import generate_report
from services.scanner import build_status_payload, create_scan, run_scan_task
from ssrf import TargetNotAllowed, validate_target

logger = logging.getLogger("civicshield.scans")
router = APIRouter(tags=["scans"])


@router.post("/scan", response_model=ScanCreatedResponse, status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(settings.rate_limit_scan)
def start_scan(
    request: Request,
    payload: ScanRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # SSRF guard + normalization: rejects private/reserved targets.
    try:
        target = validate_target(payload.target)
    except TargetNotAllowed as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    scan = create_scan(db, target)
    background_tasks.add_task(run_scan_task, scan.id, target)
    return ScanCreatedResponse(scan_id=scan.id, status="queued")


@router.get("/scan/{scan_id}", response_model=ScanStatusResponse)
def scan_status(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if scan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan ID not found")
    return build_status_payload(scan, db)


@router.get("/report/{scan_id}")
def generate_scan_report(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if scan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan ID not found")
    if scan.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Scan not completed yet"
        )

    vulns = db.query(Vulnerability).filter(Vulnerability.scan_id == scan_id).all()
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
        pdf_path = generate_report(scan_id, scan.target_url, findings)
    except Exception:  # noqa: BLE001
        logger.exception("Report generation failed for scan %s", scan_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Report generation failed",
        )

    # Delete the temp file after the response is fully sent.
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"report_{scan_id}.pdf",
        background=BackgroundTask(_safe_unlink, pdf_path),
    )


def _safe_unlink(path: str) -> None:
    try:
        os.remove(path)
    except OSError:
        pass
