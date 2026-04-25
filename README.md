# Playto Payout Engine

A minimal monorepo for Indian merchants: collect USD, withdraw to INR (demo). The backend is **Django + DRF + Celery + PostgreSQL**; the frontend is **React + Vite + Tailwind**.

**Live URL (fill in for your deploy):** `https://playto-payout.example.com`

## Prerequisites

- **Docker** and Docker Compose, **or**
- **Python 3.11+**, **Node 20+**, **PostgreSQL 15+**, **Redis 7+**

## Setup with Docker

```bash
docker compose up --build
```

- API: `http://localhost:8000`
- Vite: `http://localhost:5173` (set `VITE_API_BASE` to `http://localhost:8000` in `docker-compose.yml` for the browser)
- Seed merchants and print auth tokens (from `backend`):

```bash
docker compose exec web python manage.py seed_data
```

Use **Authorization: Token &lt;key&gt;** in the client or paste the token in the web UI.

## Manual setup (no Docker)

1. **PostgreSQL** and **Redis** running locally.
2. **Backend**
   - `cd backend && python -m venv .venv` (activate the venv)
   - `pip install -r requirements.txt`
3. **Frontend**  
   - `cd frontend && npm install`

### Environment variables (backend)

| Variable | Description |
|----------|-------------|
| `DJANGO_SECRET_KEY` | Django secret |
| `DJANGO_DEBUG` | `1` or `0` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hosts |
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | DB connection |
| `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` | Redis URLs |
| `SQLITE_DEBUG` | Set to `1` to use SQLite for local *dev only* (not for production or concurrency) |

**Frontend (optional, Vite):**

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE` | e.g. `http://127.0.0.1:8000` — API root in the **browser** |

```bash
cd backend
# export variables or use a .env loader
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

In another shell:

```bash
cd backend
celery -A celeryconfig worker -l info
celery -A celeryconfig beat -l info
```

```bash
cd frontend
set VITE_API_BASE=http://127.0.0.1:8000
npm run dev
```

## Tests

```bash
cd backend
# Optional: use Postgres for the same DB the app uses; SQLite is used if SQLITE_DEBUG=1
set SQLITE_DEBUG=1
python manage.py test tests payouts.tests
# or: pytest
```

Graded cases live in `backend/tests/test_concurrency.py` and `backend/tests/test_idempotency.py`.

## Demo: two “simultaneous” payout attempts (curl)

Replace `TOKEN` and ensure one merchant has only **100 INR** of spendable headroom, then run two requests at once (e.g. Git Bash, WSL, or two terminals):

```bash
export API=http://127.0.0.1:8000
export T=TOKEN_FROM_seed_data
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API/api/v1/payouts/" \
  -H "Authorization: Token $T" -H "Content-Type: application/json" \
  -H "Idempotency-Key: 11111111-1111-1111-1111-111111111111" \
  -d '{"amount_paise":6000,"bank_account_id":"HDFC_1"}' &
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API/api/v1/payouts/" \
  -H "Authorization: Token $T" -H "Content-Type: application/json" \
  -H "Idempotency-Key: 22222222-2222-2222-2222-222222222222" \
  -d '{"amount_paise":6000,"bank_account_id":"HDFC_1"}' &
wait
```

You should see one `201` and one `400` (insufficient balance) when the initial balance is 10000 paise and each request is 6000.

## Project layout

- `backend/config` — Django settings, URLs, WSGI, ASGI
- `backend/merchants` — `Merchant` model, `seed_data`
- `backend/ledger` — `LedgerEntry`, balance helpers
- `backend/payouts` — `PayoutRequest`, API, tasks, state machine
- `backend/idempotency` — `IdempotencyKey`, middleware, decorator hook
- `backend/celeryconfig.py` — Celery app
- `frontend/src` — dashboard UI

See `EXPLAINER.md` for the evaluator-focused walkthrough of ledger queries, locks, idempotency, and the state machine.
