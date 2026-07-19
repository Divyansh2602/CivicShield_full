"""
CivicShield — API / functional tests (pytest + requests).

These hit the running backend over HTTP, exactly like a black-box QE suite.
Point them at any environment with the BASE_URL env var:

    # local (docker compose or `uvicorn main:app`)
    BASE_URL=http://localhost:8000 pytest tests/api -v

    # against production
    BASE_URL=https://civicshield-hack.onrender.com pytest tests/api -v

Run one test:  pytest tests/api/test_api.py::test_healthz -v
"""

import os
import time

import pytest
import requests

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000").rstrip("/")
# Backends on a free tier can cold-start; give slow calls room.
TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "90"))


# ---------------------------------------------------------------- health / smoke

def test_healthz():
    """The health endpoint reports the service and DB are up."""
    r = requests.get(f"{BASE_URL}/healthz", timeout=TIMEOUT)
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["database"] == "ok"


def test_root():
    r = requests.get(f"{BASE_URL}/", timeout=TIMEOUT)
    assert r.status_code == 200
    assert "message" in r.json()


# ---------------------------------------------------------------- input validation

def test_scan_rejects_non_http():
    """A target that isn't http(s) is a 400 — basic input validation."""
    r = requests.post(f"{BASE_URL}/scan", json={"target": "ftp://example.com"}, timeout=TIMEOUT)
    assert r.status_code == 400


def test_scan_blocks_internal_ssrf():
    """SSRF guard: internal/metadata targets must be refused (security test)."""
    for target in ("http://localhost", "http://169.254.169.254/latest/meta-data/"):
        r = requests.post(f"{BASE_URL}/scan", json={"target": target}, timeout=TIMEOUT)
        assert r.status_code == 400, f"{target} should be blocked, got {r.status_code}"


# ---------------------------------------------------------------- core scan flow

@pytest.fixture(scope="module")
def completed_scan_id():
    """Submit a scan against a reachable target and poll until it finishes."""
    target = os.getenv("SCAN_TARGET", "http://example.com")
    r = requests.post(f"{BASE_URL}/scan", json={"target": target}, timeout=TIMEOUT)
    assert r.status_code in (200, 202), r.text
    scan_id = r.json()["scan_id"]

    deadline = time.time() + 120
    status = "queued"
    while time.time() < deadline:
        s = requests.get(f"{BASE_URL}/scan/{scan_id}", timeout=TIMEOUT).json()
        status = s["status"]
        if status in ("completed", "failed"):
            break
        time.sleep(3)
    assert status == "completed", f"scan ended as {status}"
    return scan_id


def test_scan_lifecycle_and_shape(completed_scan_id):
    """A completed scan returns the documented result shape."""
    s = requests.get(f"{BASE_URL}/scan/{completed_scan_id}", timeout=TIMEOUT).json()
    assert s["status"] == "completed"
    result = s["result"]
    assert "target" in result
    assert isinstance(result["findings"], list)
    assert "summary" in result


def test_scan_not_found():
    r = requests.get(f"{BASE_URL}/scan/999999999", timeout=TIMEOUT)
    assert r.status_code == 404


# ---------------------------------------------------------------- report

def test_report_is_pdf(completed_scan_id):
    """The report endpoint returns a real PDF for a completed scan."""
    r = requests.get(f"{BASE_URL}/report/{completed_scan_id}", timeout=TIMEOUT)
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert r.content[:5] == b"%PDF-"


# ---------------------------------------------------------------- phishing ML

def test_phishing_flags_suspicious_url():
    """The phishing model scores an obvious phishing URL as high risk."""
    r = requests.post(
        f"{BASE_URL}/phishing/check",
        params={"url": "http://paypal-verify-login.tk/confirm"},
        timeout=TIMEOUT,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["risk_level"] in ("High", "Medium", "Low")
    assert 0 <= body["phishing_probability_percent"] <= 100
    assert "features" in body
