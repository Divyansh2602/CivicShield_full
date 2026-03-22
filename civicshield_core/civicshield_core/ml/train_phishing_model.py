import os
import random
import sys
import warnings
from typing import Dict, List
from urllib.parse import quote

import joblib
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")

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
    "github", "coinbase", "binance", "outlook", "office365", "steam",
    "chase", "wellsfargo", "bankofamerica"
]
LEGIT_DOMAINS = [
    "google.com", "github.com", "wikipedia.org", "microsoft.com", "apple.com",
    "amazon.com", "netflix.com", "stackoverflow.com", "openai.com", "linkedin.com",
    "dropbox.com", "mozilla.org", "python.org", "gov.in", "irs.gov", "icici.com",
    "chase.com", "wellsfargo.com", "ycombinator.com", "aws.amazon.com"
]
PHISHING_TLDS = ["top", "xyz", "click", "work", "support", "live", "site", "gq", "vip", "club"]
SAFE_PATHS = [
    "", "about", "pricing", "docs", "blog", "products", "contact", "support/article",
    "developers/api", "careers", "newsroom", "account/security", "search"
]
PHISH_PATHS = [
    "login", "signin", "verify", "secure-login", "account/verify", "billing/update",
    "webscr", "session/recover", "wallet/restore", "password/reset", "auth/token",
    "update-payment", "confirm-identity"
]
QUERY_KEYS = ["session", "email", "continue", "redirect", "id", "token", "auth", "customer", "ref"]

def lexical_features(url: str) -> Dict[str, float]:
    from analyzer.phishing_detector import PhishingDetector
    return PhishingDetector().extract_features(url)

def build_legitimate_url() -> str:
    domain = random.choice(LEGIT_DOMAINS)
    scheme = "https" if random.random() < 0.95 else "http"
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
    
    # Introduce deliberate typosquatting for the new Levenshtein feature to train on!
    typo_brand = brand
    if random.random() < 0.3:
        if "o" in brand: typo_brand = brand.replace("o", "0", 1)
        elif "l" in brand: typo_brand = brand.replace("l", "1", 1)
        elif "e" in brand: typo_brand = brand.replace("e", "3", 1)
        elif "a" in brand: typo_brand = brand.replace("a", "@", 1)
        
    decoy = random.choice([f"{typo_brand}-secure", f"{typo_brand}-verify", f"login-{typo_brand}", f"{brand}-account"])
    
    host_style = random.choice([
        f"{decoy}.{tld}",
        f"{brand}.security-check.{tld}",
        f"{typo_brand}.auth-update.{tld}",
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
            "true", "pending", "verify-now", f"{brand}-alert",
        ])
        params.append(f"{key}={value}")
    if params:
        url += "?" + "&".join(params)
    if random.random() < 0.25:
        url = url.replace("//", "//https-")
    return url

def generate_enterprise_dataset(samples=10000) -> pd.DataFrame:
    print(f"Generating massive synthetic Enterprise dataset with {samples * 2} rows...")
    rows: List[Dict[str, object]] = []

    for _ in range(samples):
        url = build_legitimate_url()
        rows.append({"url": url, "label": 0, **lexical_features(url)})

    for _ in range(samples):
        url = build_phishing_url()
        rows.append({"url": url, "label": 1, **lexical_features(url)})

    anchors = [
        ("https://github.com/login", 0),
        ("https://accounts.google.com/signin", 0),
        ("https://www.amazon.com/ap/signin", 0),
        ("http://paypal.verify-account.top/webscr?auth=reset", 1),
        ("http://microsoft.security-check.click/login?email=user%40gmail.com", 1),
        ("http://198.51.100.24/secure-login?session=445566", 1),
        ("http://amaz0n-secure-login.xyz/update-payment", 1), # Typosquatting
    ]
    for url, label in anchors:
        rows.append({"url": url, "label": label, **lexical_features(url)})

    df = pd.DataFrame(rows)
    return df.sample(frac=1, random_state=SEED).reset_index(drop=True)

def train_enterprise_model(df: pd.DataFrame):
    print("Preparing XGBoost Pipeline...")
    X = df.drop(columns=["label"])
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=SEED
    )

    numeric_features = [col for col in X.columns if col != "url"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("url_text", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), min_df=3, max_features=3000), "url"),
            ("numeric", Pipeline([("scale", StandardScaler())]), numeric_features),
        ]
    )

    print("Training XGBoost Classifier on highly diverse synthetic data...")
    base_estimator = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=SEED,
        eval_metric="logloss",
        n_jobs=-1
    )
    
    calibrated = CalibratedClassifierCV(base_estimator, cv=3, method="isotonic")

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
    # 10,000 bad and 10,000 good = 20,000 robust rows
    df = generate_enterprise_dataset(samples=10000)
    model, metrics = train_enterprise_model(df)

    artifact = {
        "model": model,
        "metadata": {
            "version": "0.2.0",
            "model_type": "Enterprise_XGBoost_Calibrated_Synthetic_Typosquatting",
            "seed": SEED,
            "dataset_size": int(len(df)),
            "metrics": metrics,
        },
    }

    joblib.dump(artifact, MODEL_PATH)
    joblib.dump(artifact, LOCAL_MODEL_PATH)

    print(f"\nEnterprise XGBoost Model built and saved to {MODEL_PATH}")
    print(f"Model Accuracy (XGBoost): {metrics['accuracy']}")
    print(f"ROC AUC Score: {metrics['roc_auc']}")

if __name__ == "__main__":
    main()
