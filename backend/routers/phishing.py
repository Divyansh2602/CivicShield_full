# ===================================================
# CivicShield AI — Phishing route
# NOTE: `url` is a QUERY parameter on purpose — the Next.js proxy calls
# /phishing/check?url=<encoded>. Do not switch to a JSON body without updating
# frontend/app/api/phishing/route.ts.
# ===================================================
import logging

from fastapi import APIRouter, HTTPException, Query, Request, status

from analyzer.phishing_detector import ModelUnavailable, PhishingDetector
from config import settings
from ratelimit import limiter
from schemas import PhishingResponse

logger = logging.getLogger("civicshield.phishing")
router = APIRouter(tags=["phishing"])

_detector = PhishingDetector()


@router.post("/phishing/check", response_model=PhishingResponse)
@limiter.limit(settings.rate_limit_phishing)
def check_phishing(
    request: Request,
    url: str = Query(..., min_length=3, max_length=2048),
):
    if not url.startswith(("http://", "https://")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL format (must start with http:// or https://)",
        )

    try:
        return _detector.analyze(url)
    except ModelUnavailable:
        logger.error("Phishing model unavailable")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Phishing model is not available on the server",
        )
