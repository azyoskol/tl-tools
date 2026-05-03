# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Metraly is a **team engineering metrics platform** — a self-hosted, open-source SaaS alternative.
- `cmd/api/` — Go API backend (active rewrite, see `BACKEND_PLAN.md`)
- `ui/` — New React/TypeScript frontend (Vite, currently uses `mockApi.ts` instead of real HTTP)

## Current Work

**Active task:** Replacing `ui_new/src/api/mockApi.ts` with a real Go backend in `cmd/api/`.
See `BACKEND_PLAN.md` for the full architecture, schema, and implementation phases.

> ⚠️ `cmd/api/` is being rewritten from scratch. Do not try to reuse existing handler files there.
> ⚠️ Do not modify `ui_new/src/api/mockApi.ts`.

## Build & Run

```bash
make build           # Build Go binary
make docker-up       # Start services (ClickHouse, Redis, API, UI)
make test            # Run tests (19 tests in internal/pkg/)
make lint            # Run linter

# New backend (after implementing BACKEND_PLAN.md):
cd cmd/api && go run . --seed   # Start with seed data
```

## New Backend Stack (`cmd/api/`)

| Concern | Library |
|---------|---------|
| Router | `go-chi/chi/v5` |
| DB | PostgreSQL 16 + TimescaleDB |
| DB driver | `github.com/jackc/pgx/v5` (no ORM) |
| Cache | Redis `redis/go-redis/v9` |
| Auth | `github.com/golang-jwt/jwt/v5` (RS256) + bcrypt |
| OIDC | `github.com/coreos/go-oidc/v3` (optional enterprise SSO) |
| JSON | `github.com/json-iterator/go` |
| Logger | `github.com/rs/zerolog` |
| Validator | `github.com/go-playground/validator/v10` |

## New Backend Architecture (`cmd/api/`)

```
cmd/api/
├── main.go          # Wiring: pgx pool → migrate → seed → chi router → server
├── config/          # AppConfig struct + Load() from env
├── domain/          # Domain structs (WidgetInstance.Config is json.RawMessage — no union types)
├── db/              # pgxpool wrapper + embedded SQL migration runner
├── migrations/      # 007 SQL files (go:embed); TimescaleDB hypertable for metrics
├── repo/            # Interfaces + pgx implementations (no ORM)
├── auth/            # JWT KeyManager, authService, redisTokenStore, lazy OIDC provider
├── biz/             # Business logic; errgroup for parallel widget/DORA fetch
├── respond/         # sync.Pool[bytes.Buffer] + jsoniter; all handlers use this
├── middleware/      # RequireAuth(keyMgr), RequireRole(roles...), zerolog request logger
├── handlers/        # 10 handler files — one per domain group
└── seed/            # Park-Miller PRNG (seed=42, matches mockApi.ts), idempotent runner
```

**Layer contract:**
- Handlers: decode → validate → call one biz method → `respond.JSON` or `respond.ErrorFrom`
- Biz: business logic + cache + errgroup fan-out; returns typed errors (ErrNotFound, ErrConflict…)
- Repo: raw pgx queries; dashboard UPDATE uses `WHERE id=$1 AND version=$2` for optimistic lock

**Performance patterns:**
- `sync.Pool[bytes.Buffer]` in `respond/respond.go` — every JSON response
- `errgroup.WithContext` in biz — widget batch fetch and 4 DORA metrics in parallel
- Redis cache: metrics TTL 5min, dashboards 30s, templates 1h

## `ui/` Frontend

React 18 + TypeScript + Vite app at `ui/`. Currently calls `mockApi` directly (not HTTP).

```
ui/src/
├── api/mockApi.ts          # Source of truth for API contract — DO NOT MODIFY
├── api/client.js           # axios: baseURL=VITE_API_BASE_URL || http://localhost:3001/api
├── types/                  # TypeScript types (api.ts, dashboard.ts, metrics.ts, widgets.ts…)
├── hooks/                  # useDashboard.ts, useDashboardOverview.ts use mockApi directly
└── components/             # React components
```

**MetricId values** (from `types/metrics.ts`):
`deploy-freq`, `lead-time`, `cfr`, `mttr`, `ci-pass`, `ci-duration`, `ci-queue`,
`pr-cycle`, `pr-review`, `pr-merge`, `velocity`, `throughput`, `health-score`, `sprint-burndown`

**Widget types** (11 variants, config is a discriminated union in TS, `json.RawMessage` in Go):
`metric-chart`, `compare-bar-chart`, `stat-card`, `dora-overview`, `health-gauge`,
`heatmap`, `data-table`, `leaderboard`, `sprint-burndown`, `ai-insight`, `anomaly-detector`

**Conventions to follow when extending:**
- `interface.go` + implementation file per package
- Constructor: `NewFoo(cfg config.Config) (Interface, error)`
- Config access: `cfg.Get(key, default)` / `cfg.GetInt(key, default)`

## Environment Variables

### New (cmd/api rewrite)
| Variable | Default | Purpose |
|----------|---------|---------|
| `POSTGRES_DSN` | `postgres://metraly:metraly@localhost:5432/metraly?sslmode=disable` | PostgreSQL |
| `JWT_PRIVATE_KEY` | `""` (auto-gen + WARN) | RS256 private key PEM |
| `ACCESS_TOKEN_TTL` | `900` | Access token seconds |
| `REFRESH_TOKEN_TTL` | `604800` | Refresh token seconds |
| `OIDC_ISSUER_URL` | `""` | Optional — activates OIDC routes |
| `OIDC_CLIENT_ID` | `""` | OIDC client ID |
| `OIDC_CLIENT_SECRET` | `""` | OIDC client secret |
| `OIDC_REDIRECT_URL` | `""` | OIDC callback URL |
| `SEED_ON_START` | `false` | Auto-seed on startup |
| `SEED_ADMIN_EMAIL` | `""` | Seed admin email |
| `SEED_ADMIN_PASSWORD` | `""` | Seed admin password |

## API Routes (new backend)

All under `/api/v1/`. Public: `auth/*`. Protected: everything else (Bearer JWT).

```
POST /auth/login   POST /auth/refresh   POST /auth/logout
GET  /auth/oidc/login   GET /auth/oidc/callback

GET  /me           GET  /activity        GET  /templates
GET  /plugins      POST /plugins/{id}/install
POST /sources/connect
GET  /ai/insights  POST /ai/chat

GET  /metrics/{metricId}?timeRange=30d&team=Platform
GET  /metrics/{metricId}/breakdown
GET  /dora?timeRange=30d

GET/POST           /dashboards
GET/PUT            /dashboards/{id}
POST               /dashboards/{id}/fork
PUT                /dashboards/{id}/layout
PUT                /dashboards/{id}/share
POST               /dashboards/{id}/data    ← parallel errgroup fetch
POST               /widgets/data
```

## Error Response Format

```json
{ "error": { "code": "DASHBOARD_NOT_FOUND", "message": "dashboard not found" } }
```
Biz errors map: `ErrNotFound`→404, `ErrConflict`→409, `ErrForbidden`→403, `ErrValidation`→422, else→500 (message scrubbed).

## Docker Services

- **api**: Go API (port 8000)
- **redis**: Cache (port 6379)
- **ui**: Legacy React frontend (port 3000)
- **postgres** *(planned)*: PostgreSQL 16 + TimescaleDB (`timescale/timescaledb:latest-pg16`)
