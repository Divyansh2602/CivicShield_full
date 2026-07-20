# syntax=docker/dockerfile:1

# ===================================================
# CivicShield AI - Backend (FastAPI + civicshield_core)
#
# Build context is the REPO ROOT (not backend/) because
# requirements.txt installs the sibling ../civicshield_core
# package with `-e ../civicshield_core`.
#
#   docker build -f backend/Dockerfile -t civicshield-backend .
# ===================================================
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# libgomp1 is a runtime dependency of xgboost (pulled in by civicshield_core).
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the local engine package and backend requirements first so the
# dependency layer is cached across source-only changes.
COPY civicshield_core/ ./civicshield_core/
COPY backend/requirements.txt ./backend/requirements.txt

# Install from the backend dir so `-e ../civicshield_core` resolves to
# /app/civicshield_core unambiguously.
WORKDIR /app/backend
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# Copy the backend source.
COPY backend/ /app/backend/

# Run as an unprivileged user.
RUN useradd --create-home --uid 1000 appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# The image ships without curl; probe with the interpreter instead.
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/healthz', timeout=4).status==200 else 1)"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
