# ===================================================
# CivicShield AI — API schemas (request/response)
# Field names here are part of the frontend contract — do not rename
# without updating the Next.js proxy routes / pages.
# ===================================================
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ---------- Auth ----------
class AuthRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=6, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Scan ----------
class ScanRequest(BaseModel):
    target: str = Field(min_length=3, max_length=2048)


class ScanCreatedResponse(BaseModel):
    scan_id: int
    status: str


class Finding(BaseModel):
    risk: str
    vuln: str
    url: str
    param: Optional[str] = None
    payload: Optional[str] = None
    evidence: Optional[str] = None


class ScanResult(BaseModel):
    target: str
    findings: List[Finding]
    surface_map: Dict[str, Any] = Field(default_factory=dict)


class ScanStatusResponse(BaseModel):
    scan_id: int
    status: str
    error: Optional[str] = None
    result: Optional[ScanResult] = None


# ---------- Phishing ----------
class PhishingFeatures(BaseModel):
    url_length: int
    suspicious_keywords: int
    special_char_count: int
    uses_ip: int
    subdomain_count: int


class PhishingResponse(BaseModel):
    url: str
    risk_level: str
    phishing_probability_percent: float
    ml_prediction: int
    features: PhishingFeatures
    raw_ml_probability_percent: float
