# Running CivicShield with Docker

A complete containerized stack: **Postgres + FastAPI backend + Next.js frontend**,
wired together with Docker Compose.

## Prerequisites

- Docker Engine 24+ / Docker Desktop with the Compose v2 plugin (`docker compose`).

## Quick start

```bash
# from the repo root
cp .env.example .env        # optional — defaults work out of the box
docker compose up --build
```

Then open:

| Service   | URL                              |
| --------- | -------------------------------- |
| Frontend  | http://localhost:3000            |
| Backend   | http://localhost:8000            |
| API docs  | http://localhost:8000/docs       |
| Health    | http://localhost:8000/healthz    |

Stop with `Ctrl+C`, or fully tear down (including the database volume):

```bash
docker compose down          # keep data
docker compose down -v       # also drop the Postgres volume
```

## What's in the box

- **`db`** — Postgres 16, data persisted in the `pgdata` named volume, gated by a
  `pg_isready` healthcheck so the backend only starts once the DB is accepting
  connections.
- **`backend`** — FastAPI served by uvicorn on port 8000. Built from the repo root
  because it installs the local `civicshield_core` engine (`-e ../civicshield_core`).
  Tables are auto-created on startup via SQLAlchemy `create_all`.
- **`frontend`** — Next.js 14 in [standalone](https://nextjs.org/docs/app/api-reference/next-config-js/output)
  mode. Its server-side API routes reach the backend over the compose network at
  `http://backend:8000` (via `BACKEND_URL`).

## Configuration

All settings are optional overrides read from `.env` (see `.env.example`):

| Variable                                          | Default                                                        | Purpose                                  |
| ------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `civicshield`                                             | Bundled Postgres credentials             |
| `DATABASE_URL`                                    | `postgresql://civicshield:civicshield@db:5432/civicshield`    | Backend DB connection                    |
| `BACKEND_PORT`                                    | `8000`                                                        | Host port for the backend               |
| `FRONTEND_PORT`                                   | `3000`                                                        | Host port for the frontend              |
| `NEXT_PUBLIC_SUPABASE_URL` / `..._ANON_KEY`       | *(blank)*                                                     | Optional Supabase integration           |

To point the backend at hosted Supabase instead of the bundled Postgres, set
`DATABASE_URL` in `.env` (append `?sslmode=require`) — you can then drop the `db`
service if you don't need it locally.

## Common tasks

```bash
# Seed the database with sample data (backend must be up)
docker compose exec backend python seed_db.py

# Follow logs for one service
docker compose logs -f backend

# Rebuild a single service after code changes
docker compose up --build backend

# Open a shell in the backend container
docker compose exec backend bash
```

## Building images individually

```bash
# Backend — note the context is the repo root, not backend/
docker build -f backend/Dockerfile -t civicshield-backend .

# Frontend
docker build -t civicshield-frontend ./frontend
```
