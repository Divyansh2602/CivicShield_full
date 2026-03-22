import ipaddress
import math
import os
import re
from collections import Counter
from typing import Dict, List
from urllib.parse import urlparse
import difflib

import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "phishing_model.pkl")

try:
    artifact = joblib.load(MODEL_PATH)
    if isinstance(artifact, dict) and "model" in artifact:
        model = artifact["model"]
        model_metadata = artifact.get("metadata", {})
    else:
        model = artifact
        model_metadata = {"model_type": "legacy"}
except Exception:
    model = None
    model_metadata = {}


class PhishingDetector:
    suspicious_keywords = [
        "login", "verify", "update", "secure", "account", "bank", "confirm",
        "password", "signin", "wallet", "crypto", "unlock", "recover", "billing",
        "invoice", "suspended", "payment", "webscr", "auth", "token"
    ]

    trusted_brands = [
        "google", "microsoft", "apple", "paypal", "amazon", "netflix",
        "instagram", "facebook", "whatsapp", "telegram", "dropbox", "linkedin",
        "github", "coinbase", "binance", "outlook", "chase", "wellsfargo"
    ]

    suspicious_tlds = {"top", "xyz", "click", "gq", "ml", "cf", "ga", "work", "support", "vip", "club", "site"}

    def _fuzzy_brand_match(self, hostname: str) -> int:
        """Calculate max similarity of hostname parts to trusted brands."""
        max_sim = 0.0
        parts = re.split(r"[^a-z0-9]+", hostname)
        for part in parts:
            if not part: continue
            for brand in self.trusted_brands:
                sim = difflib.SequenceMatcher(None, part, brand).ratio()
                if sim > max_sim:
                    max_sim = sim
        # Return 1 if highly similar (typosquatting like amaz0n = ~0.85) but not identical
        return 1 if 0.8 < max_sim < 1.0 else 0

    def extract_features(self, url: str) -> Dict[str, float]:
        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower()
        path = parsed.path or ""
        query = parsed.query or ""
        full = url.lower()
        tokens = [t for t in re.split(r"[^a-z0-9]+", full) if t]
        token_lengths = [len(t) for t in tokens]

        digit_count = sum(ch.isdigit() for ch in full)
        letter_count = sum(ch.isalpha() for ch in full)
        special_char_count = sum(not ch.isalnum() for ch in full)
        separators = sum(ch in "/._-?=&%@" for ch in full)
        unique_chars = len(set(full))

        keyword_hits = [kw for kw in self.suspicious_keywords if kw in full]
        brand_hits = [brand for brand in self.trusted_brands if brand in full]
        subdomain_parts = [part for part in hostname.split(".") if part]
        registered_domain_parts = subdomain_parts[-2:] if len(subdomain_parts) >= 2 else subdomain_parts
        registered_domain = ".".join(registered_domain_parts)
        tld = subdomain_parts[-1] if subdomain_parts else ""

        try:
            ipaddress.ip_address(hostname)
            uses_ip = 1
        except ValueError:
            uses_ip = 0

        entropy = 0.0
        if full:
            counts = Counter(full)
            entropy = -sum((count / len(full)) * math.log2(count / len(full)) for count in counts.values())

        features = {
            "url_length": len(url),
            "hostname_length": len(hostname),
            "path_length": len(path),
            "query_length": len(query),
            "token_count": len(tokens),
            "avg_token_length": round(sum(token_lengths) / len(token_lengths), 3) if token_lengths else 0.0,
            "max_token_length": max(token_lengths) if token_lengths else 0,
            "digit_count": digit_count,
            "digit_ratio": round(digit_count / max(len(full), 1), 4),
            "letter_ratio": round(letter_count / max(len(full), 1), 4),
            "special_char_count": special_char_count,
            "separator_count": separators,
            "unique_char_count": unique_chars,
            "entropy": round(entropy, 4),
            "https_token_count": full.count("https"),
            "http_token_count": full.count("http"),
            "subdomain_count": max(len(subdomain_parts) - 2, 0),
            "hyphen_count": hostname.count("-"),
            "underscore_count": full.count("_"),
            "at_symbol_count": full.count("@"),
            "double_slash_count": full.count("//"),
            "equals_count": full.count("="),
            "ampersand_count": full.count("&"),
            "percent_count": full.count("%"),
            "suspicious_keywords": len(keyword_hits),
            "brand_count": len(brand_hits),
            "brand_in_subdomain": int(any(brand in hostname and brand not in registered_domain for brand in brand_hits)),
            "typosquatting_detected": self._fuzzy_brand_match(hostname),
            "uses_ip": uses_ip,
            "has_port": int(parsed.port is not None),
            "is_https": int(parsed.scheme.lower() == "https"),
            "has_query": int(bool(query)),
            "has_login_path": int("login" in path.lower() or "signin" in path.lower()),
            "has_account_path": int(any(token in path.lower() for token in ["account", "verify", "update", "secure", "billing"])),
            "suspicious_tld": int(tld in self.suspicious_tlds),
        }

        return features

    def _build_reason_flags(self, features: Dict[str, float]) -> List[str]:
        reasons: List[str] = []

        if features["uses_ip"]:
            reasons.append("URL uses an IP address instead of a domain")
        if features["brand_in_subdomain"]:
            reasons.append("Trusted brand appears in the subdomain (Common spoofing strategy)")
        if features["typosquatting_detected"]:
            reasons.append("Typosquatting detected (Domain looks suspiciously similar to a trusted brand)")
        if features["suspicious_keywords"] >= 2:
            reasons.append("Multiple phishing-related keywords were detected in the URL path")
        if features["suspicious_tld"]:
            reasons.append("Domain uses a high-risk top-level domain (.click, .xyz, etc)")
        if features["subdomain_count"] >= 3:
            reasons.append("URL has many subdomains, which often indicates obfuscation")
        if features["url_length"] >= 90:
            reasons.append("URL is unusually long")
        if not features["is_https"]:
            reasons.append("URL does not use HTTPS")
        if not reasons:
            reasons.append("No major phishing indicators were manually detected in the URL structure")

        return reasons[:4]

    def analyze(self, url: str) -> Dict:
        if not model:
            return {"error": "Phishing Model not trained or missing."}

        features = self.extract_features(url)
        model_input = pd.DataFrame([{"url": url, **features}])

        probability = float(model.predict_proba(model_input)[0][1])
        prediction = int(probability >= 0.5)
        probability_percent = round(probability * 100, 2)

        if probability_percent >= 80:
            risk = "High"
        elif probability_percent >= 45:
            risk = "Medium"
        else:
            risk = "Low"

        return {
            "url": url,
            "risk_level": risk,
            "phishing_probability_percent": probability_percent,
            "ml_prediction": prediction,
            "features": features,
            "raw_ml_probability_percent": probability_percent,
            "model_type": model_metadata.get("model_type", "Enterprise-XGBoost"),
            "model_version": model_metadata.get("version", "0.2.0"),
            "reasons": self._build_reason_flags(features),
        }
