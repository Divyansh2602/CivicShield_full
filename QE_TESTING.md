# CivicShield — QE Testing Guide

A practical, step-by-step guide to testing this project the way a Quality Engineer
would: **run it in Docker → test the API (Postman) → test the UI (Selenium) → wire it
all into CI/CD.** Everything here is scaffolded and ready to run.

## The strategy (test pyramid)

```
        ▲  fewer, slower, higher-confidence
        │   ┌─────────────────────────┐
        │   │  UI / E2E  (Selenium)    │   real browser, whole app
        │   ├─────────────────────────┤
        │   │  API / functional        │   Postman + pytest, no browser
        │   │  (Postman, pytest)       │
        │   ├─────────────────────────┤
        │   │  Smoke / health (Docker) │   "is it even up?"
        ▼   └─────────────────────────┘
            more, faster, run on every commit
```

You test the **same running system** at three levels, then let **CI/CD** run all of it
automatically on every change.

| Layer | Tool | What it proves | Files |
|---|---|---|---|
| Environment | Docker Compose | The app builds & boots as it does in prod | `docker-compose.yml` |
| API | Postman / Newman | Endpoints behave, validate, secure | `tests/postman/…json` |
| API | pytest + requests | Same, as code (great in CI) | `tests/api/test_api.py` |
| UI / E2E | Selenium | A user can actually complete the flow | `tests/e2e/test_selenium.py` |
| Automation | GitHub Actions | All of the above run on every push | `.github/workflows/qe-tests.yml` |

---

## Step 1 — Run the app in Docker (your test environment)

A QE always tests against a **clean, reproducible environment**. Docker gives you that:
Postgres + backend + frontend, identical every time.

```bash
# from the repo root
docker compose up --build         # add -d to run in the background
```

Wait for the three services to become healthy, then verify (this is your **smoke test**):

```bash
# Backend health (should be {"status":"ok","database":"ok"})
curl http://localhost:8000/healthz

# Backend API docs (FastAPI auto-generates these — great for exploring endpoints)
#   open http://localhost:8000/docs

# Frontend
#   open http://localhost:3000
```

Useful Docker/QE commands:

```bash
docker compose ps                 # are all 3 services "healthy"?
docker compose logs -f backend    # tail backend logs while testing
docker compose down -v            # stop and wipe the DB volume (fresh slate)
```

> **Why this matters for QE:** if a test fails, you can rule out "works on my machine"
> — everyone (and CI) runs the exact same containers. `down -v` gives you a pristine DB
> so tests aren't polluted by earlier data.

---

## Step 2 — API testing with Postman

The backend is where the real logic lives, so test it directly — no browser needed.
Import the ready-made collection: **`tests/postman/civicshield.postman_collection.json`**.

### In the Postman app
1. **Import** → select the collection file.
2. It has a `baseUrl` variable (default `http://localhost:8000`) — leave it for local, or
   point it at production (`https://civicshield-hack.onrender.com`).
3. Open any request → **Send**. Look at the **Test Results** tab: each request has
   assertions (`pm.test(...)`) that pass/fail automatically.
4. **Collection Runner** (Run collection) executes them all in order and gives a report.

### What the collection covers (and the QE thinking behind each)
| Request | Test type | Asserts |
|---|---|---|
| Health check | Smoke | 200, `status: ok`, `database: ok` |
| Scan – rejects non-http | Negative / input validation | 400 on bad input |
| Scan – SSRF blocked | **Security** | internal/metadata target → 400 |
| Scan – create | Happy path | returns a numeric `scan_id` |
| Scan – poll status | Async workflow | loops until `completed`, checks result shape |
| Phishing – suspicious URL | ML / functional | `risk_level` + probability 0–100 |

### Run the same collection headless with Newman (this is what CI uses)
```bash
npx newman run tests/postman/civicshield.postman_collection.json \
    --env-var baseUrl=http://localhost:8000
```

> **QE tip:** always write **negative tests** (bad input, blocked targets), not just the
> happy path. The SSRF test is a real security check — it proves the scanner can't be
> pointed at internal infrastructure.

### The same tests as code — pytest (`tests/api/test_api.py`)
Postman is great for exploring; pytest is great for CI and data-driven checks. Both are
provided so you can see the equivalence.

```bash
pip install -r tests/requirements.txt
BASE_URL=http://localhost:8000 pytest tests/api -v
```

---

## Step 3 — UI / end-to-end testing with Selenium

This proves a **real user** can complete the journey in a **real browser**:
landing page → type a target → *Begin scan* → dashboard shows results.

File: **`tests/e2e/test_selenium.py`**. Selenium 4 auto-manages the Chrome driver, so you
only need Google Chrome installed.

```bash
pip install -r tests/requirements.txt

# Watch it drive the browser (headed):
HEADLESS=0 FRONTEND_URL=http://localhost:3000 pytest tests/e2e -v

# Headless (fast, no window — how CI runs it):
HEADLESS=1 FRONTEND_URL=http://localhost:3000 pytest tests/e2e -v
```

What the E2E test does:
1. Opens the landing page, waits for the hero to render.
2. Types a target into the URL box and clicks **Begin scan**.
3. Asserts the app routes to `/dashboard?scanId=…`.
4. Waits (polling, like the app does) until the status reaches **COMPLETED**.

> **QE concepts shown here:** *explicit waits* (`WebDriverWait` — never `sleep()` blindly),
> *robust locators* (by role/text, not brittle CSS), and testing **asynchronous UI**
> (the dashboard polls, so the test polls too).

---

## Step 4 — CI/CD: run everything automatically

Manual testing doesn't scale. The workflow **`.github/workflows/qe-tests.yml`** runs the
whole pyramid on every push/PR to `main` (and on demand from the Actions tab):

1. `docker compose up -d --build` — boots the exact stack.
2. Waits for `/healthz` and the frontend to be ready.
3. Runs **pytest** API tests.
4. Runs the **Postman** collection via **Newman**.
5. Runs the **Selenium** UI tests (headless Chrome).
6. On failure, dumps container logs; always tears the stack down.

Trigger it:
- Push a commit / open a PR to `main`, **or**
- GitHub → **Actions** tab → *QE Tests* → **Run workflow**.

A green check = every layer passed against a freshly-built environment. A red X with logs =
you caught a regression before it shipped. That gate is the core value a QE adds.

---

## Everyday QE workflow (cheat sheet)

```bash
# 1. Stand up a clean environment
docker compose up -d --build
curl http://localhost:8000/healthz          # smoke

# 2. API layer
npx newman run tests/postman/civicshield.postman_collection.json --env-var baseUrl=http://localhost:8000
BASE_URL=http://localhost:8000 pytest tests/api -v

# 3. UI layer
HEADLESS=1 FRONTEND_URL=http://localhost:3000 pytest tests/e2e -v

# 4. Tear down
docker compose down -v
```

Everything CI runs, you can run locally with these same commands — that's the point.

## Where to grow next
- **Data-driven tests:** parametrize `pytest` with many URLs (`@pytest.mark.parametrize`).
- **Coverage of more endpoints:** `/register`, `/login`, unreachable-target → `failed`.
- **Reporting:** `pytest --junitxml=report.xml` and upload as a CI artifact.
- **Cross-browser:** run Selenium against Firefox too, or move to Playwright.
- **Performance/load:** add k6 or Locust hitting `/scan` and `/phishing/check`.
