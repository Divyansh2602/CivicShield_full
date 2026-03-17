import os
import random

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

random.seed(42)

# ------------------------------------------------------------
# 1. Generate a synthetic dataset with realistic overlap
# ------------------------------------------------------------
data = []

# Legitimate URLs
for _ in range(1200):
    length = random.randint(15, 65)
    kw = 0 if random.random() > 0.2 else random.randint(1, 2)
    sp = random.randint(2, 9)
    ip = 0
    sub = random.randint(0, 2)
    data.append([length, kw, sp, ip, sub, 0])

# Suspicious but non-phishing URLs (overlapping features)
for _ in range(400):
    length = random.randint(40, 90)
    kw = random.randint(0, 3)
    sp = random.randint(5, 12)
    ip = 0
    sub = random.randint(1, 4)
    data.append([length, kw, sp, ip, sub, 0])

# Phishing URLs
for _ in range(1200):
    length = random.randint(50, 150)
    kw = random.randint(1, 6)
    sp = random.randint(8, 25)
    ip = 1 if random.random() > 0.4 else 0
    sub = random.randint(1, 5)
    data.append([length, kw, sp, ip, sub, 1])

columns = [
    "url_length",
    "suspicious_keywords",
    "special_char_count",
    "uses_ip",
    "subdomain_count",
    "label",
]

df = pd.DataFrame(data, columns=columns)

X = df.drop("label", axis=1)
y = df["label"]

# ------------------------------------------------------------
# 2. Train a probabilistic classifier (Random Forest)
# ------------------------------------------------------------
# max_depth=6 prevents the model from perfectly memorizing the synthetic data,
# ensuring it outputs graduated probabilities like 12%, 35%, 80% instead of just 0% or 100%.
model = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
model.fit(X, y)

# ------------------------------------------------------------
# 3. Save model exactly where backend expects it
# ------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "phishing_model.pkl")
joblib.dump(model, model_path)

print(f"Model trained and saved as {model_path}")