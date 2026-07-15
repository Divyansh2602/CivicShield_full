# CivicShield AI — Backend

FastAPI service for scanning, phishing detection, reporting, and auth.

## Architecture

```
backend/
├── main.py              # App factory: lifespan (warmup + keep-warm), middleware, routers
├── config.py            # Pydantic settings (all config via env / .env)
├── ratelimit.py         # Shared slowapi limiter
├── ssrf.py              # SSRF guard for scan targets
├── schemas.py           # Request/response models (frontend contract)
├── api/auth.py          # Password hashing + JWT + auth dependencies
├── database/            # engine, session (get_db), ORM models
├── routers/             # meta · auth · scans · phishing
├── services/            # scanner · reporting · phishing warmup · keepwarm
├── analyzer/ crawler/ recon/   # the scan engine
├── ml/                  # phishing model + training script
└── keep_warm.py         # standalone external pinger
```

The **database is the single source of truth** for scan state (survives restarts,
works across workers). Scans run as background tasks that persist status →
`queued → running → completed | failed`.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env          # then edit
python ml/train_phishing_model.py   # if ml/phishing_model.pkl is missing
python main.py                # http://127.0.0.1:8000  (docs at /docs)
```

Optional demo data for the frontend dashboard:

```bash
python seed_db.py             # prints the seeded scan id
```

## Configuration (env)

| Var | Default | Notes |
|---|---|---|
| `ENVIRONMENT` | development | `production` enables strict warnings |
| `SECRET_KEY` | dev-insecure-change-me | **Required in production.** `python -c "import secrets;print(secrets.token_urlsafe(48))"` |
| `DATABASE_URL` | sqlite:///./civicshield.db | any SQLAlchemy URL |
| `CORS_ORIGINS` | localhost:3000,3001 | comma-separated |
| `ALLOW_PRIVATE_TARGETS` | false | set `true` only to scan your own local apps |
| `SCAN_MAX_PAGES` | 3 | crawl cap |
| `RATE_LIMIT_SCAN` / `_PHISHING` / `_AUTH` | 10/30/5 per min | slowapi syntax |
| `KEEP_WARM_URL` | — | public base URL to self-ping `/health` |

## Endpoints (frontend contract)

| Method | Path | Purpose |
|---|---|---|
| POST | `/scan` | `{target}` → `{scan_id, status}` (SSRF-guarded) |
| GET | `/scan/{id}` | status + `result{target, findings, surface_map}` |
| GET | `/report/{id}` | streams a per-scan PDF |
| POST | `/phishing/check?url=` | ML phishing analysis (**query param**) |
| POST | `/register`, `/login` | JWT auth |
| GET | `/health` | liveness (used by keep-warm/uptime monitors) |

## Cold starts

Free-tier hosts idle-suspend after inactivity. Two mitigations:

1. **Internal** — set `KEEP_WARM_URL` to this API's public URL; it self-pings
   `/health` every `KEEP_WARM_INTERVAL_SECONDS`. Also preloads the ML model at
   startup so the first phishing request isn't slow.
2. **External (more reliable)** — point an uptime monitor (UptimeRobot,
   cron-job.org) at `/health`, or run `python keep_warm.py <url> --interval 600`
   on an always-on box. Use this if your host fully suspends the process.

## Security

SSRF guard on scan targets · env-based secrets · JWT with `exp`/`iss`
validation · per-route rate limiting · security headers · CORS allow-list ·
generic auth errors (no user enumeration) · no stack traces leaked to clients.
