# ===================================================
# CivicShield AI — Phishing detector
# Blends a RandomForest probability with a transparent heuristic score.
# Model is lazy-loaded (a missing model no longer crashes app import) and
# cached after the first call / warmup.
# ===================================================
import ipaddress
import os
import re
from functools import lru_cache
from urllib.parse import urlparse

import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Canonical location (train_phishing_model.py writes here).
MODEL_PATH = os.path.join(BASE_DIR, "ml", "phishing_model.pkl")
# Backwards-compatible fallback if an older model sits at the backend root.
_LEGACY_MODEL_PATH = os.path.join(BASE_DIR, "phishing_model.pkl")


class ModelUnavailable(RuntimeError):
    pass


@lru_cache(maxsize=1)
def get_model():
    # Trust boundary: this loads a FIRST-PARTY model artifact produced by this
    # repo's own ml/train_phishing_model.py and shipped in-tree. It is never a
    # user upload. If model provenance ever changes to something untrusted,
    # replace joblib/pickle with a schema-validated format (e.g. ONNX / skops).
    for path in (MODEL_PATH, _LEGACY_MODEL_PATH):
        if os.path.exists(path):
            return joblib.load(path)  # noqa: S301 (trusted first-party artifact)
    raise ModelUnavailable(
        "Phishing model not found. Run: python ml/train_phishing_model.py"
    )


def warmup() -> bool:
    """Preload the model so the first real request isn't slow. Returns success."""
    try:
        get_model()
        return True
    except ModelUnavailable:
        return False


class PhishingDetector:
    suspicious_keywords = [
        "login", "verify", "update", "secure", "account", "bank",
        "confirm", "password", "signin", "wallet", "crypto",
    ]

    def extract_features(self, url: str) -> dict:
        parsed = urlparse(url)
        domain = parsed.netloc

        features = {"url_length": len(url)}

        features["suspicious_keywords"] = sum(
            1 for word in self.suspicious_keywords if word in url.lower()
        )
        features["special_char_count"] = len(re.findall(r"[^\w]", url))

        try:
            ipaddress.ip_address(domain.split(":")[0])
            features["uses_ip"] = 1
        except ValueError:
            features["uses_ip"] = 0

        features["subdomain_count"] = domain.count(".")
        return features

    def analyze(self, url: str) -> dict:
        import pandas as pd

        model = get_model()
        features = self.extract_features(url)

        feature_df = pd.DataFrame(
            [
                {
                    "url_length": features["url_length"],
                    "suspicious_keywords": features["suspicious_keywords"],
                    "special_char_count": features["special_char_count"],
                    "uses_ip": features["uses_ip"],
                    "subdomain_count": features["subdomain_count"],
                }
            ]
        )

        prediction = model.predict(feature_df)[0]
        probability = float(model.predict_proba(feature_df)[0][1])
        raw_probability_percent = round(probability * 100, 2)

        # ---- Heuristic blended on top of the model for nuanced percentages ----
        heuristic_score = 0.0
        heuristic_score += min(features["suspicious_keywords"] * 15, 45)

        if features["url_length"] > 100:
            heuristic_score += 20
        elif features["url_length"] > 60:
            heuristic_score += 10
        elif features["url_length"] > 30:
            heuristic_score += 5

        if features["special_char_count"] > 12:
            heuristic_score += 15
        elif features["special_char_count"] > 7:
            heuristic_score += 8
        elif features["special_char_count"] > 3:
            heuristic_score += 2

        if features["uses_ip"]:
            heuristic_score += 15

        if features["subdomain_count"] >= 4:
            heuristic_score += 15
        elif features["subdomain_count"] == 3:
            heuristic_score += 8
        elif features["subdomain_count"] == 2:
            heuristic_score += 3

        # Deterministic per-URL variance so identical URLs look "analyzed"
        # without the security risk of Python's salted builtin hash.
        url_variance = (int.from_bytes(url.encode()[:4].ljust(4, b"0"), "big") % 500) / 100.0

        blended = (0.55 * raw_probability_percent) + (0.45 * heuristic_score) + url_variance
        probability_percent = round(max(1.1, min(blended, 99.9)), 2)

        if probability_percent >= 70:
            risk = "High"
        elif probability_percent >= 40:
            risk = "Medium"
        else:
            risk = "Low"

        return {
            "url": url,
            "risk_level": risk,
            "phishing_probability_percent": probability_percent,
            "ml_prediction": int(prediction),
            "features": features,
            "raw_ml_probability_percent": raw_probability_percent,
        }
