# ===================================================
# CivicShield AI — Application entrypoint
# Author: Divyansh Gupta
# ===================================================
import asyncio
import logging
import os
import sys

# Make absolute imports work regardless of the working directory.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from analyzer.phishing_detector import warmup as warmup_phishing_model
from config import settings
from database.db import Base, engine
from database.models import Scan, User, Vulnerability  # noqa: F401 (register tables)
from ratelimit import limiter
from routers import auth, meta, phishing, scans
from services.keepwarm import keep_warm_loop

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("civicshield")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    Base.metadata.create_all(bind=engine)

    if settings.is_production and settings.secret_key == "dev-insecure-change-me":
        logger.error(
            "SECURITY: SECRET_KEY is the insecure default in production. "
            "Set a strong SECRET_KEY env var immediately."
        )

    # Preload the ML model so the first phishing request isn't slow (cold start).
    if warmup_phishing_model():
        logger.info("Phishing model warmed up")
    else:
        logger.warning(
            "Phishing model not found — /phishing/check will 503 until "
            "`python ml/train_phishing_model.py` is run"
        )

    warm_task = asyncio.create_task(keep_warm_loop())

    yield

    # --- Shutdown ---
    warm_task.cancel()
    try:
        await warm_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title=settings.app_name, lifespan=lifespan)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS (env-driven; supports the local dev origins and the deployed frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault(
        "Permissions-Policy", "geolocation=(), microphone=(), camera=()"
    )
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Never leak stack traces to clients; log server-side with context.
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(meta.router)
app.include_router(auth.router)
app.include_router(scans.router)
app.include_router(phishing.router)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=settings.debug,
    )
