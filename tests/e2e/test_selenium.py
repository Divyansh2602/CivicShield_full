"""
CivicShield — UI / end-to-end tests (Selenium).

Drives a real Chrome browser through the user journey:
    landing page -> type a target -> Begin scan -> dashboard populates.

Selenium 4 ships "Selenium Manager", so it downloads the matching
chromedriver automatically — you only need Chrome installed.

    pip install -r tests/requirements.txt
    FRONTEND_URL=http://localhost:3000 pytest tests/e2e -v
    HEADLESS=1 FRONTEND_URL=http://localhost:3000 pytest tests/e2e -v   # CI mode
"""

import os

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
SCAN_TARGET = os.getenv("SCAN_TARGET", "http://example.com")


@pytest.fixture()
def driver():
    opts = Options()
    if os.getenv("HEADLESS", "1") == "1":
        opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1400,1000")
    d = webdriver.Chrome(options=opts)
    d.implicitly_wait(5)
    yield d
    d.quit()


def test_landing_page_loads(driver):
    driver.get(FRONTEND_URL)
    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.XPATH, "//h1"))
    )
    assert "CivicShield" in driver.title or "CivicShield" in driver.page_source


def test_scan_flow_end_to_end(driver):
    """Submit a scan from the UI and confirm the dashboard reaches COMPLETED."""
    driver.get(FRONTEND_URL)

    # Type a target into the URL box and submit.
    box = WebDriverWait(driver, 20).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "input"))
    )
    box.clear()
    box.send_keys(SCAN_TARGET)

    driver.find_element(
        By.XPATH, "//button[contains(., 'Begin scan') or contains(., 'Scan')]"
    ).click()

    # It should route to the dashboard with a scanId.
    WebDriverWait(driver, 30).until(EC.url_contains("/dashboard"))
    assert "scanId=" in driver.current_url

    # The dashboard polls; wait for the scan to finish.
    WebDriverWait(driver, 120).until(
        lambda d: "COMPLETED" in d.page_source or "FAILED" in d.page_source
    )
    assert "COMPLETED" in driver.page_source, "scan did not complete in the UI"
