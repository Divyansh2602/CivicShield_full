import os
import random
import sys
from typing import Dict, List
from urllib.parse import quote

import joblib
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

SEED = 42
random.seed(SEED)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
sys.path.insert(0, ROOT_DIR)
MODEL_PATH = os.path.join(ROOT_DIR, "phishing_model.pkl")
LOCAL_MODEL_PATH = os.path.join(BASE_DIR, "phishing_model.pkl")

BRANDS = [
    "paypal", "microsoft", "google", "apple", "amazon", "netflix",
    "instagram", "facebook", "whatsapp", "telegram", "dropbox", "linkedin",
    "github", "coinbase", "binance", "outlook", "office365", "steam"
]
LEGIT_DOMAINS = [
    "google.com", "github.com", "wikipedia.org", "microsoft.com", "apple.com",
    "amazon.com", "netflix.com", "stackoverflow.com", "openai.com", "linkedin.com",
    "dropbox.com", "mozilla.org", "python.org", "gov.in", "irs.gov", "icici.com"
]
PHISHING_TLDS = ["top", "xyz", "click", "work", "support", "live", "site", "gq"]
SAFE_PATHS = [
    "", "about", "pricing", "docs", "blog", "products", "contact", "support/article",
    "developers/api", "careers", "newsroom", "account/security"
]
PHISH_PATHS = [
    "login", "signin", "verify", "secure-login", "account/verify", "billing/update",
    "webscr", "session/recover", "wallet/restore", "password/reset", "auth/token"
]
QUERY_KEYS = ["session", "email", "continue", "redirect", "id", "token", "auth", "customer"]


def lexical_features(url: str) -> Dict[str, float]:
    from analyzer.phishing_detector import PhishingDetector
    return PhishingDetector().extract_features(url)


def build_legitimate_url() -> str:
    domain = random.choice(LEGIT_DOMAINS)
    scheme = "https" if random.random() < 0.9 else "http"
    path = random.choice(SAFE_PATHS)
    url = f"{scheme}://{domain}"
    if path:
        url += f"/{path}"
    if random.random() < 0.35:
        key = random.choice(["page", "ref", "tab", "lang"])
        value = random.choice(["1", "docs", "pricing", "en", "security"])
        url += f"?{key}={value}"
    return url


def build_phishing_url() -> str:
    brand = random.choice(BRANDS)
    lure = random.choice(PHISH_PATHS)
    tld = random.choice(PHISHING_TLDS)
    decoy = random.choice([f"{brand}-secure", f"{brand}-verify", f"login-{brand}", f"{brand}-account"])
    host_style = random.choice([
        f"{decoy}.{tld}",
        f"{brand}.security-check.{tld}",
        f"{brand}.auth-update.{tld}",
        f"verify-{brand}.{tld}",
        f"{random.randint(10,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}",
    ])
    scheme = "http" if random.random() < 0.7 else "https"
    url = f"{scheme}://{host_style}/{lure}"
    params = []
    for _ in range(random.randint(1, 4)):
        key = random.choice(QUERY_KEYS)
        value = random.choice([
            quote(f"user{random.randint(10, 999)}@gmail.com"),
            str(random.randint(1000, 999999)),
            "true",
            "pending",
            "verify-now",
            f"{brand}-alert",
        ])
        params.append(f"{key}={value}")
    if params:
        url += "?" + "&".join(params)
    if random.random() < 0.25:
        url = url.replace("//", "//https-")
    return url


def build_dataset() -> pd.DataFrame:
    rows: List[Dict[str, object]] = []

    for _ in range(2500):
        url = build_legitimate_url()
        rows.append({"url": url, "label": 0, **lexical_features(url)})

    for _ in range(2500):
        url = build_phishing_url()
        rows.append({"url": url, "label": 1, **lexical_features(url)})

    # Hard-coded anchor examples improve stability for a demo.
    anchors = [
        ("https://github.com/login", 0),
        ("https://accounts.google.com/signin", 0),
        ("https://www.amazon.com/ap/signin", 0),
        ("http://paypal.verify-account.top/webscr?auth=reset", 1),
        ("http://microsoft.security-check.click/login?email=user%40gmail.com", 1),
        ("http://198.51.100.24/secure-login?session=445566", 1),
    ]
    for url, label in anchors:
        rows.append({"url": url, "label": label, **lexical_features(url)})

    df = pd.DataFrame(rows)
    return df.sample(frac=1, random_state=SEED).reset_index(drop=True)


def train_model(df: pd.DataFrame):
    X = df.drop(columns=["label"])
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=SEED
    )

    numeric_features = [col for col in X.columns if col != "url"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("url_text", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), min_df=2), "url"),
            ("numeric", Pipeline([("scale", StandardScaler())]), numeric_features),
        ]
    )

    base_estimator = LogisticRegression(max_iter=2000, class_weight="balanced")
    calibrated = CalibratedClassifierCV(base_estimator, cv=3, method="sigmoid")

    pipeline = Pipeline([
        ("features", preprocessor),
        ("classifier", calibrated),
    ])

    pipeline.fit(X_train, y_train)

    predictions = pipeline.predict(X_test)
    probabilities = pipeline.predict_proba(X_test)[:, 1]

    metrics = {
        "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, probabilities)), 4),
        "report": classification_report(y_test, predictions, output_dict=True),
        "train_size": int(len(X_train)),
        "test_size": int(len(X_test)),
    }

    return pipeline, metrics


def main():
    df = build_dataset()
    model, metrics = train_model(df)

    artifact = {
        "model": model,
        "metadata": {
            "version": "2026.03-hackathon",
            "model_type": "calibrated_logistic_regression_with_char_tfidf_and_lexical_features",
            "seed": SEED,
            "dataset_size": int(len(df)),
            "metrics": metrics,
        },
    }

    joblib.dump(artifact, MODEL_PATH)
    joblib.dump(artifact, LOCAL_MODEL_PATH)

    print(f"Model trained and saved to {MODEL_PATH}")
    print(f"Accuracy: {metrics['accuracy']}")
    print(f"ROC AUC: {metrics['roc_auc']}")


if __name__ == "__main__":
    main()
