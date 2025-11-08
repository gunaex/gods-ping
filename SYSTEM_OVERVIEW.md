# Gods Ping – System Overview

A high-level guide to the app’s capabilities, AI behavior, environments, performance considerations, and operations.

> For installation and step-by-step onboarding, see `START_HERE.md` and `INSTALLATION_COMPLETE.md`. For deployment tips, see `DEPLOYMENT.md`. For the logging model and UI, see `LOGGING_SYSTEM.md`.

## What the app does

- Visualize live market data (candles, order book, ticker) and render a forecast line overlay (blue dashed) on the price chart
- Paper-trading orchestration (“Gods Hand” bot) with configurable interval and safety rails
- AI recommendation engine with detailed reasoning logs (AI Thinking) and action logs (AI Actions)
- Logs viewer with filters and an AI Thinking vs Actions comparison view
- Simple user management (admin account + one additional user), JWT-secured API

## Architecture

```
Frontend (Vercel, React + Vite)
  │
  │  HTTPS (Authorization: Bearer <JWT>)
  ▼
Backend API (Render, FastAPI + SQLAlchemy)
  │  ├─ CORS: allow prod + preview *.vercel.app (regex) and local dev
  │  ├─ Auth: HS256 JWT, bcrypt password hashing
  │  ├─ AI Engine: signal aggregation + confidence + reasoning
  │  ├─ Gods Hand bot: periodic cycle, risk checks, incremental steps
  │  └─ Logging: structured logs with categories (ai_thinking, ai_action, etc.)
  ▼
Database (SQLite by default; PostgreSQL optional later)
  └─ Tables include users, logs, trades, paper_trading_snapshots, etc.
```

### Key components
- Frontend: React (Vite), deployed to Vercel
  - Centralized API base URL (`src/api.ts`) with production fallback to the Render backend
  - Components use the shared axios instance; some fetches were refactored to use the same `API_BASE_URL`
- Backend: FastAPI app with SQLAlchemy
  - CORS driven via environment (`CORS_ORIGINS`) plus `allow_origin_regex` for Vercel previews
  - Database tables are created on startup; paper-trading snapshot model ensured to load before `create_all`
- Deployment: Render (backend) and Vercel (frontend)
  - Backend exposes `/api/*` routes; frontend uses `VITE_API_URL` for production

## AI engine and bots

### AI recommendation flow
1. Collects signals (technical/heuristic)
2. Produces an action recommendation (BUY/SELL/HOLD) and a confidence score in [0,1]
3. Emits a detailed, multi-line reasoning summary to the logs as AI Thinking (including signal breakdown)
4. When an action is executed, an AI Action log is produced

The "AI Thinking vs Actions" tab pairs thinking logs with nearby action logs (±60s window) so you can see what the AI intended and what actually ran.

### Gods Hand bot
- Mode: one-time run or continuous (`interval_seconds`, default 60)
- Risk/position logic:
  - Uses a configured `max_position_size` (in USD) and derives capacity vs current exposure
  - Computes an incremental step amount (USD) for trades
  - Maintains a safe progression of position sizing in paper trading
- Logging:
  - AI Thinking: detailed “AI DECISION CALCULATION …” multiline log with metrics
  - AI Action: what was executed and why (or why it was skipped)

## Logs and observability

- Categories: `error`, `user`, `ai_thinking`, `ai_action`, `trading`, `config`, `bot`, `system`
- Endpoints:
  - `GET /api/logs?category=ai_thinking&limit=200` – list logs with filters/pagination
  - `GET /api/logs/ai-actions` – correlated AI Thinking vs AI Action comparisons
- UI: `LogsModal` shows filtered logs and an "AI Thinking vs Actions" comparison tab

See `LOGGING_SYSTEM.md` for details and screenshots of the logging UI/UX.

## Environment configuration

### Backend (Render)
- `SECRET_KEY`: JWT signing key (required)
- `ENCRYPTION_KEY`: Fernet key for secure data at rest (required)
- `ALGORITHM`: JWT algorithm (default `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT TTL in minutes (e.g., `43200` for 30 days)
- `CORS_ORIGINS`: Comma-separated list of allowed origins (include the Vercel domain and localhost for dev)
- `DATABASE_URL` (optional): set to PostgreSQL URL for production; defaults to SQLite if unset

Helpful:
- `GET /api/debug/cors` – debug what origins/regex are allowed at runtime

### Frontend (Vercel)
- `VITE_API_URL`: Backend base URL, e.g., `https://gods-ping-backend.onrender.com`
  - Frontend constructs `${VITE_API_URL}/api` automatically
  - Production fallback exists to the Render URL if this isn’t set, but configuring it is recommended

## API highlights
- Auth:
  - `POST /api/auth/login`
  - `GET  /api/auth/me`
  - `POST /api/auth/create-user` (admin only)
  - `DELETE /api/auth/users/{id}` (admin only)
- Market:
  - `GET /api/market/ticker/{symbol}`
  - `GET /api/market/candles/{symbol}`
  - `GET /api/market/orderbook/{symbol}`
  - `GET /api/market/forecast/{symbol}`
- Bots:
  - `POST /api/bot/gods-hand/start?continuous=true&interval_seconds=60`
  - `POST /api/bot/{grid|dca}/start`
  - `POST /api/bot/{grid|dca|gods-hand}/stop`
  - `GET  /api/bot/status`
- Paper trading:
  - `POST /api/bot/paper-trading/reset`
  - `GET  /api/paper-trading/performance`
  - `GET  /api/paper-trading/history`
- Logs:
  - `GET /api/logs` (filters, pagination)
  - `GET /api/logs/ai-actions`

## Performance and scaling

Current characteristics
- Backend: CPU-bound AI calculation is lightweight; IO-bound network calls (market data)
- Database: SQLite by default; works well for single-instance; migrate to PostgreSQL for scale/concurrency
- Background cycles: run via async tasks; interval-based load pacing

Optimization ideas
- Introduce simple response caching on hot endpoints (ticker, forecast)
- Batch market data calls where possible
- Add metrics endpoint (cycles_run, last_cycle_duration_ms, avg_confidence, etc.)
- Add circuit breaker: stop bot after N consecutive failures and log a critical error
- Migrate to PostgreSQL and add indexes on `logs.category`, `logs.timestamp`, and key trade columns

## Security
- JWT auth (HS256), bcrypt password hashing
- CORS restrictions: explicit origins via env plus regex for Vercel previews
- Secrets: don’t commit; injected via Render/Vercel dashboards
- Transport: use HTTPS; do not send credentials over HTTP
- Client storage: token is stored in `localStorage`; consider rotating/shorter TTL for higher security

## Troubleshooting
- CORS: If preflight fails, verify `CORS_ORIGINS` and preview regex; check `/api/debug/cors` output
- 404 from frontend to `/api/*`: ensure `VITE_API_URL` is set, or that all fetches use `API_BASE_URL`
- Database table missing (e.g., paper_trading_snapshots): ensure app restarts; creation runs on startup
- 500 on Gods Hand start: ensure current backend version contains the safe metrics block in `bots.py`

## Roadmap
- Metrics API and dashboard (bot cycles, PnL, confidence trends)
- Execution safeguards (circuit breaker, max trades per hour)
- Real exchange integration
- Postgres migration + migrations tooling
- Export logs (CSV) and richer analytics

## How to run (dev)
- Backend: run FastAPI (Uvicorn) locally; set env vars including `CORS_ORIGINS` to include `http://localhost:5173`
- Frontend: run Vite dev server; if needed, set `VITE_API_URL=http://localhost:8000` to point to a local backend

See `START_HERE.md` for full dev instructions and `DEPLOYMENT.md` for production guidance.
