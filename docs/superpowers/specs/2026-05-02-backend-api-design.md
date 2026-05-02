# Backend API — Design Spec

> **Status:** Approved. Ready for implementation planning.
> **Source:** Interactive design session 2026-05-02 — all decisions confirmed by user.
> **Reference:** `BACKEND_PLAN.md` contains the full technical blueprint.

---

## Goal

Replace the mock data layer (`ui_new/src/api/mockApi.ts`) with a real Go backend in `cmd/api/`, preserving 100% API contract compatibility so the frontend requires zero changes. The backend is enterprise-ready: JWT + OIDC auth, RBAC roles, PostgreSQL + TimescaleDB storage, Redis cache, idempotent seed system.

---

## Scope

20 REST endpoints replacing all `mockApi` methods. Full CRUD for dashboards, time-series metrics, auth with local + OIDC login, plugins, AI insights, activity feed. Seed system recreates all mock data deterministically (Park-Miller PRNG, seed=42).

**Out of scope:** real AI inference (stub responses), real event ingestion (ClickHouse collectors), legacy `internal/pkg/` packages (untouched), legacy `ui/` frontend.

---

## Architecture

### Layer Contract

```
HTTP Request
    ↓
Middleware (RequireAuth → RequireRole)
    ↓
Handler       — decode, validate, call ONE biz method, respond
    ↓
Biz Service   — business rules, cache, errgroup fan-out, typed errors
    ↓
Repo          — pgx SQL queries; no ORM; interfaces for testability
    ↓
PostgreSQL + TimescaleDB   /   Redis (cache + token store)
```

**Key constraints:**

- Handlers have zero business logic — thin HTTP shell only.
- Biz layer owns cache (per-operation TTL, not blanket middleware).
- `WidgetInstance.Config` stored/served as `json.RawMessage` — avoids Go union type explosion for 11 widget variants.
- Dashboard updates use optimistic locking: `UPDATE WHERE id=$1 AND version=$2`; 0 rows affected → `ErrVersionConflict` → HTTP 409.

### Package Layout (`cmd/api/`)

| Package | Responsibility |
|---------|---------------|
| `config/` | `AppConfig` struct, `Load()` from env |
| `domain/` | Plain Go structs matching TypeScript types from `ui_new/src/types/` |
| `db/` | pgxpool wrapper + embedded SQL migration runner (no 3rd-party) |
| `migrations/` | 7 numbered `.sql` files, embedded via `go:embed` |
| `repo/` | One file per entity: interface + pgx implementation |
| `auth/` | JWT KeyManager (RS256), authService, redisTokenStore, lazy OIDC |
| `biz/` | 7 service files; typed errors; `errgroup` for parallel fetches |
| `respond/` | `sync.Pool[bytes.Buffer]` + jsoniter; single JSON response entrypoint |
| `middleware/` | `RequireAuth`, `RequireRole`, zerolog request logger |
| `handlers/` | 10 files — one per domain group |
| `seed/` | Park-Miller PRNG + idempotent runner + 6 data files |

---

## Data Model

### Databases

| Store | Purpose |
|-------|---------|
| PostgreSQL 16 | Users, dashboards, plugins, insights, activity, refresh tokens |
| TimescaleDB extension | `metric_data_points` hypertable (time-series) |
| Redis | Metric cache (TTL 5min), dashboard cache (TTL 30s), template cache (TTL 1h), refresh token store |

### Key Schema Decisions

**`dashboards`** — `widgets JSONB`, `layout JSONB` (opaque arrays, no normalization). `version INT` for optimistic locking. `forked_from_id TEXT REFERENCES dashboards(id) ON DELETE SET NULL`.

**`metric_data_points`** — TimescaleDB hypertable on `time TIMESTAMPTZ`. Index: `(metric_id, team, time DESC)`. Queries use `time_bucket()` returning exactly 14 points via `generate_series` gap-fill.

**`refresh_tokens`** — stores SHA-256 hex of raw token, never the raw token. `ON DELETE CASCADE` from users.

**`users`** — `password_hash TEXT` nullable (OIDC-only users have no password). `oidc_sub TEXT UNIQUE` nullable. `app_role` enum: `admin | editor | viewer | team-lead`.

---

## API Contract

All endpoints under `/api/v1/`. Port `:8000`. Old endpoints removed.

### Public (no auth)

```
POST /auth/login        → {access_token, refresh_token, expires_in, user}
POST /auth/refresh      → {access_token, expires_in}
POST /auth/logout       → 204
GET  /auth/oidc/login   → redirect
GET  /auth/oidc/callback → issue tokens
GET  /health            → {"status":"ok"}
```

### Protected (`Authorization: Bearer <access_token>`)

```
GET  /me
GET  /activity
GET  /templates
GET  /plugins
POST /plugins/{id}/install
POST /sources/connect
GET  /ai/insights
POST /ai/chat
GET  /metrics/{metricId}              ?timeRange=30d&team=Platform&repo=All repos
GET  /metrics/{metricId}/breakdown
GET  /dora                            ?timeRange=30d
GET  /dashboards
POST /dashboards
GET  /dashboards/{id}
PUT  /dashboards/{id}                 (409 on version conflict)
POST /dashboards/{id}/fork
PUT  /dashboards/{id}/layout
PUT  /dashboards/{id}/share
POST /dashboards/{id}/data            (parallel widget fetch)
POST /widgets/data
```

### Error Format

```json
{ "error": { "code": "DASHBOARD_NOT_FOUND", "message": "dashboard not found" } }
```

| Biz Error | HTTP | Code |
|-----------|------|------|
| `ErrNotFound` | 404 | `NOT_FOUND` |
| `ErrConflict` | 409 | `VERSION_CONFLICT` |
| `ErrForbidden` | 403 | `FORBIDDEN` |
| `ErrValidation` | 422 | `VALIDATION_ERROR` |
| anything else | 500 | `INTERNAL_ERROR` (message scrubbed, error logged) |

---

## Authentication & Authorization

### Local Auth (JWT RS256)

- Access token: 15 min TTL, payload `{sub, email, role}`.
- Refresh token: 32 random bytes → base64url (wire) + SHA-256 hex (Redis store). 7-day TTL.
- On refresh: old token revoked atomically (single-use rotation).
- `JWT_PRIVATE_KEY` env (PEM). If empty → auto-generate RSA-2048 + log WARN ("tokens invalidated on restart").

### OIDC / Enterprise SSO

- Supported providers: Keycloak, Okta, Azure AD, Google Workspace, Authentik (any OIDC-compliant).
- Lazy init: `oidcProvider` only constructed when `OIDC_ISSUER_URL != ""`.
- State param: Redis TTL 5min for CSRF protection.
- On OIDC callback: find or create user by email, issue token pair.

### RBAC

- Roles: `admin | editor | viewer | team-lead` stored in `users.app_role`.
- Enforced per-route via `RequireRole(roles...)` middleware after `RequireAuth`.

---

## Performance Design

| Pattern | Location | Effect |
|---------|----------|--------|
| `sync.Pool[bytes.Buffer]` | `respond/respond.go` | Zero buffer alloc per request |
| `sync.Pool[[]MetricDataPoint]` | `repo/metric_repo.go` | Reuse 14-point result slices |
| `sync.Pool[hash.Hash]` | `auth/service.go` | SHA-256 on auth hot path |
| `errgroup.WithContext` | `biz/dashboard_svc.go` | Parallel widget data fetch |
| `errgroup.WithContext` | `biz/metrics_svc.go` | 4 DORA metrics concurrent |
| `sync.WaitGroup` | `biz/metrics_svc.go` | current + previous period |
| Redis cache 5min | metrics responses | Avoid repeated DB queries |
| Redis cache 30s | dashboard reads | Fast repeated loads |
| Redis cache 1h | template list | Static data |

---

## Seed System

### PRNG

Park-Miller LCG — exact translation of `mockApi.ts` lines 75–78:

```
state = (state * 16807) % 2147483647
return float64(state-1) / 2147483646.0
```

Initial seed: **42**. Single `*PRNG` instance shared across all seed steps — call sequence matches `initDashboards()` exactly.

**Verification:** first `Next()` from seed=42 must equal ≈ `0.000328775` (705893/2147483646).

### Data

| Entity | Count | Source |
|--------|-------|--------|
| Users | 1 admin | `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` env |
| Dashboards | 11 | `initDashboards()` full widget/layout JSON |
| Plugins | 6 | mockApi lines 1159–1219 |
| AI Insights | 3 | mockApi lines 1241–1262 |
| Activity Events | 4 | mockApi lines 396–424 |
| Metric data points | 980 | 14 metrics × 5 teams × 14 days |

**Idempotency:** `INSERT ... ON CONFLICT (id) DO NOTHING` for all entities.

**Activation:** `./api --seed` or `SEED_ON_START=true`.

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `8000` | Server port |
| `POSTGRES_DSN` | `postgres://metraly:metraly@localhost:5432/metraly?sslmode=disable` | PostgreSQL |
| `REDIS_HOST` | `redis` | Redis |
| `REDIS_PORT` | `6379` | Redis |
| `JWT_PRIVATE_KEY` | `""` (auto-gen + WARN) | RS256 PEM |
| `ACCESS_TOKEN_TTL` | `900` | Seconds |
| `REFRESH_TOKEN_TTL` | `604800` | Seconds |
| `OIDC_ISSUER_URL` | `""` | Activates OIDC if set |
| `OIDC_CLIENT_ID` | `""` | |
| `OIDC_CLIENT_SECRET` | `""` | |
| `OIDC_REDIRECT_URL` | `""` | |
| `SEED_ON_START` | `false` | |
| `SEED_ADMIN_EMAIL` | `""` | |
| `SEED_ADMIN_PASSWORD` | `""` | |

---

## Infrastructure Changes

- **Add to `docker-compose.yaml`:** `postgres` service using `timescale/timescaledb:latest-pg16` image, port 5432.
- **Makefile:** add `make seed` target (`go run ./cmd/api --seed`).
- **ClickHouse:** keep service in compose (future event ingestion), not used by new backend.

---

## Testing Strategy

| Layer | Approach |
|-------|---------|
| `auth/jwt.go` | Unit: round-trip sign → validate |
| `biz/dashboard_svc.go` | Unit: mock repo, test version conflict path |
| `biz/metrics_svc.go` | Unit: mock repo, test errgroup error propagation |
| `seed/prng.go` | Unit: assert first 5 `Next()` values against JS reference |
| `handlers/*` | `httptest.ResponseRecorder` + mock biz service |
| Migration runner | Integration: testcontainers postgres, assert `schema_migrations` rows |

---

## Implementation Order

1. go.mod + docker-compose (add postgres/timescaledb)
2. Tests
3. `config/` + `db/` (pool + migration runner) + 7 SQL migrations
4. `domain/` structs + `repo/` interfaces + pgx implementations
5. `auth/` (JWT → authService → OIDC)
6. `biz/errors.go` + `respond/` + 7 biz services
7. `middleware/` + 10 handlers
8. `main.go` wiring + graceful shutdown
9. `seed/` (PRNG → runner → 6 data files)
