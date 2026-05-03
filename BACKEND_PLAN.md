# Backend Implementation Plan — Metraly `cmd/api` Rewrite

> Status: **Architecture approved, implementation pending**
> Replaces all mock data from `ui/src/api/mockApi.ts` with a real Go backend.
> `cmd/api/` is rewritten from scratch; `internal/pkg/` legacy packages remain untouched.

---

## Stack

| Concern | Library |
|---------|---------|
| Router | `go-chi/chi/v5` |
| DB | PostgreSQL 16 + TimescaleDB extension |
| DB driver | `github.com/jackc/pgx/v5` |
| Cache | Redis (`redis/go-redis/v9`) |
| Auth tokens | `github.com/golang-jwt/jwt/v5` (RS256) |
| OIDC | `github.com/coreos/go-oidc/v3` + `golang.org/x/oauth2` |
| JSON | `github.com/json-iterator/go` |
| Logger | `github.com/rs/zerolog` |
| Validator | `github.com/go-playground/validator/v10` |

**New dependencies to add to go.mod:**
```
github.com/jackc/pgx/v5
github.com/golang-jwt/jwt/v5
github.com/json-iterator/go
github.com/coreos/go-oidc/v3
golang.org/x/oauth2
```

---

## File Structure (`cmd/api/`)

```
cmd/api/
├── main.go                         # Wiring: deps → migrations → seed → server
├── config/
│   └── config.go                   # AppConfig struct + Load() from env
├── domain/                         # Go domain structs (match JSON shapes from mockApi.ts)
│   ├── user.go                     # User, AppRole consts (admin|editor|viewer|team-lead)
│   ├── dashboard.go                # Dashboard, WidgetInstance (config as json.RawMessage), WidgetLayout
│   ├── metric.go                   # MetricID consts, MetricTimeSeries, DORAResponse, BreakdownItem
│   ├── plugin.go                   # Plugin, PluginCategory
│   ├── ai.go                       # AIInsight, ChatMessage, ChatRequest, ChatResponse
│   └── activity.go                 # ActivityEvent
├── db/
│   ├── postgres.go                 # pgxpool.Pool wrapper implementing DB interface
│   └── migrate.go                  # Migration runner (no 3rd-party; schema_migrations table)
├── migrations/                     # Embedded via go:embed, applied in filename order
│   ├── 001_users.sql
│   ├── 002_dashboards.sql
│   ├── 003_plugins.sql
│   ├── 004_ai_insights.sql
│   ├── 005_activity_events.sql
│   ├── 006_refresh_tokens.sql
│   └── 007_metric_data_points.sql  # TimescaleDB hypertable
├── repo/                           # Interface + pgx implementation per entity
│   ├── errors.go                   # var ErrNotFound, ErrVersionConflict
│   ├── user_repo.go
│   ├── dashboard_repo.go           # optimistic lock: UPDATE WHERE id=$1 AND version=$2
│   ├── plugin_repo.go
│   ├── insight_repo.go
│   ├── activity_repo.go
│   ├── token_repo.go
│   └── metric_repo.go             # time_bucket() queries; bulk INSERT for seed
├── auth/
│   ├── interface.go                # AuthService, TokenStore, Claims, TokenPair, errors
│   ├── jwt.go                      # KeyManager: RS256, auto-generate if JWT_PRIVATE_KEY unset
│   ├── service.go                  # authService implementation + redisTokenStore
│   └── oidc.go                     # Lazy oidcProvider (only if OIDC_ISSUER_URL set)
├── biz/
│   ├── errors.go                   # ErrNotFound, ErrConflict, ErrForbidden, ErrValidation
│   ├── dashboard_svc.go            # CRUD, fork, share, FetchWidgetData (errgroup)
│   ├── metrics_svc.go              # GetMetricData, GetDORA (errgroup×4), GetBreakdown
│   ├── user_svc.go                 # GetMe (user + system status + pinned + dashboards)
│   ├── template_svc.go             # List (static, Redis TTL 1h)
│   ├── plugin_svc.go               # List, Install
│   ├── source_svc.go               # Connect
│   └── ai_svc.go                   # GetInsights, Chat
├── respond/
│   └── respond.go                  # sync.Pool[bytes.Buffer] + jsoniter; JSON(), Error(), ErrorFrom()
├── middleware/
│   ├── auth.go                     # RequireAuth(keyMgr), RequireRole(roles...), ClaimsFromContext
│   └── logger.go                   # zerolog request logger (method, path, status, duration)
├── handlers/
│   ├── auth.go                     # Login, Refresh, Logout, OIDCLogin, OIDCCallback
│   ├── dashboard.go                # List, Create, Get, Update, Fork, UpdateLayout, Share, FetchData
│   ├── widget.go                   # FetchData (single widget)
│   ├── metrics.go                  # GetTimeSeries, GetBreakdown
│   ├── dora.go                     # Get
│   ├── me.go                       # Get
│   ├── template.go                 # List
│   ├── plugin.go                   # List, Install
│   ├── source.go                   # Connect
│   └── ai.go                       # GetInsights, Chat
└── seed/
    ├── prng.go                     # Park-Miller LCG seed=42 (exact match of mockApi.ts)
    ├── runner.go                   # SeedRunner: idempotent, writer interfaces
    ├── users.go                    # 1 admin user (bcrypt cost 12)
    ├── dashboards.go               # 11 dashboards with full widget/layout JSON
    ├── plugins.go                  # 6 plugins
    ├── insights.go                 # 3 AI insights
    ├── activity.go                 # 4 activity events
    └── metrics.go                  # 980 data points (14 metrics × 5 teams × 14 days)
```

---

## Database Schema

### `001_users.sql`
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TYPE app_role AS ENUM ('admin', 'editor', 'viewer', 'team-lead');

CREATE TABLE users (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                TEXT NOT NULL UNIQUE,
    display_name         TEXT NOT NULL,
    initials             TEXT NOT NULL,
    role_label           TEXT NOT NULL DEFAULT '',
    avatar_url           TEXT,
    password_hash        TEXT,                        -- NULL for OIDC-only users
    oidc_sub             TEXT UNIQUE,                 -- NULL for password users
    app_role             app_role NOT NULL DEFAULT 'viewer',
    pinned_dashboard_ids TEXT[] NOT NULL DEFAULT '{}',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_email    ON users (email);
CREATE INDEX idx_users_oidc_sub ON users (oidc_sub) WHERE oidc_sub IS NOT NULL;
```

### `002_dashboards.sql`
```sql
CREATE TYPE dashboard_source_type AS ENUM ('system-template', 'user-created', 'forked');
CREATE TYPE dashboard_visibility  AS ENUM ('private', 'team', 'org');

CREATE TABLE dashboards (
    id                 TEXT PRIMARY KEY,
    name               TEXT NOT NULL,
    description        TEXT,
    source_type        dashboard_source_type NOT NULL,
    source_template_id TEXT,
    forked_from_id     TEXT REFERENCES dashboards(id) ON DELETE SET NULL,
    visibility         dashboard_visibility NOT NULL DEFAULT 'private',
    team_id            TEXT,
    share_token        TEXT UNIQUE,
    default_filters    JSONB NOT NULL DEFAULT '{}',
    widgets            JSONB NOT NULL DEFAULT '[]',
    layout             JSONB NOT NULL DEFAULT '[]',
    created_by         UUID NOT NULL REFERENCES users(id),
    version            INT NOT NULL DEFAULT 1,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dashboards_created_by  ON dashboards (created_by);
CREATE INDEX idx_dashboards_visibility  ON dashboards (visibility);
CREATE INDEX idx_dashboards_widgets_gin ON dashboards USING GIN (widgets);
```

### `006_refresh_tokens.sql`
```sql
CREATE TABLE refresh_tokens (
    token_hash TEXT PRIMARY KEY,        -- SHA-256 hex; never store raw token
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
```

### `007_metric_data_points.sql`
```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE metric_data_points (
    time      TIMESTAMPTZ NOT NULL,
    metric_id TEXT NOT NULL,
    team      TEXT NOT NULL DEFAULT 'All teams',
    repo      TEXT NOT NULL DEFAULT 'All repos',
    value     DOUBLE PRECISION NOT NULL
);

SELECT create_hypertable('metric_data_points', 'time');
CREATE INDEX idx_mdp_metric_team_time ON metric_data_points (metric_id, team, time DESC);
```

---

## API Routes (20 endpoints)

### Public
```
POST /api/v1/auth/login              → {access_token, refresh_token, expires_in, user}
POST /api/v1/auth/refresh            → {access_token, expires_in}
POST /api/v1/auth/logout             → 204
GET  /api/v1/auth/oidc/login         → redirect to OIDC provider
GET  /api/v1/auth/oidc/callback      → issue tokens, redirect
GET  /health                         → {"status":"ok"}
```

### Protected (RequireAuth)
```
GET  /api/v1/me
GET  /api/v1/activity

GET  /api/v1/templates

GET  /api/v1/plugins
POST /api/v1/plugins/{id}/install

POST /api/v1/sources/connect

GET  /api/v1/ai/insights
POST /api/v1/ai/chat

GET  /api/v1/metrics/{metricId}      ?timeRange=30d&team=Platform&repo=All repos
GET  /api/v1/metrics/{metricId}/breakdown
GET  /api/v1/dora                    ?timeRange=30d&team=All teams

GET  /api/v1/dashboards
POST /api/v1/dashboards
GET  /api/v1/dashboards/{id}
PUT  /api/v1/dashboards/{id}         (version conflict → 409)
POST /api/v1/dashboards/{id}/fork
PUT  /api/v1/dashboards/{id}/layout
PUT  /api/v1/dashboards/{id}/share
POST /api/v1/dashboards/{id}/data    (parallel widget fetch via errgroup)

POST /api/v1/widgets/data
```

---

## Performance Patterns

| Pattern | Location | Purpose |
|---------|----------|---------|
| `sync.Pool[bytes.Buffer]` | `respond/respond.go` | JSON serialization, every response |
| `sync.Pool[[]MetricDataPoint]` | `repo/metric_repo.go` | 14-point result slices |
| `sync.Pool[hash.Hash]` | `auth/service.go` | SHA-256 refresh token hashing |
| `errgroup.WithContext` | `biz/dashboard_svc.go` | Parallel widget data fetch |
| `errgroup.WithContext` | `biz/metrics_svc.go` | 4 DORA metrics in parallel |
| `sync.WaitGroup` | `biz/metrics_svc.go` | current + previous period fetch |
| Redis cache TTL 5min | `biz/metrics_svc.go` | Metric time series |
| Redis cache TTL 30s | `biz/dashboard_svc.go` | Dashboard reads |
| Redis cache TTL 1h | `biz/template_svc.go` | Static template list |

---

## Auth Design

### JWT
- Algorithm: RS256
- Key: `JWT_PRIVATE_KEY` env (PEM). If empty → auto-generate RSA-2048 + log WARN.
- Access token TTL: 900s (15 min). Payload: `sub=userID`, `email`, `role`.
- Refresh token: 32 random bytes → base64url (wire) + SHA-256 hex (stored).
- Storage: `refresh_tokens` PostgreSQL table (TTL enforced by `expires_at`).

### OIDC (Enterprise SSO)
- Provider: any OIDC-compliant (Keycloak, Okta, Azure AD, Google Workspace, Authentik).
- Config: `OIDC_ISSUER_URL`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_REDIRECT_URL`.
- Lazy-init: `oidcProvider` only created if `OIDC_ISSUER_URL != ""`.
- State param stored in Redis TTL 5min for CSRF protection.

### RBAC
- Roles: `admin` | `editor` | `viewer` | `team-lead`
- Stored in `users.app_role`.
- Enforced via `middleware.RequireRole(roles...)` per route.

---

## Seed System

### PRNG
Park-Miller LCG matching `mockApi.ts` line 75-78 exactly:
```
state = (state * 16807) % 2147483647
return float64(state-1) / 2147483646.0
```
Initial seed: **42**. Single `*PRNG` instance shared across all seed steps to maintain call-sequence parity with `initDashboards()`.

### Data Volume
| Entity | Count |
|--------|-------|
| Users | 1 (admin) |
| Dashboards | 11 (dash-1, dash-overview, dash-cto, dash-vp, dash-tl, dash-devops, dash-ic, dash-2…5) |
| Plugins | 6 |
| AI Insights | 3 |
| Activity Events | 4 |
| Metric Data Points | 980 (14 metrics × 5 teams × 14 days) |

### Activation
```bash
./api --seed                  # one-time seed run
SEED_ON_START=true ./api      # auto-seed on every start (idempotent)
```

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `8000` | API server port |
| `POSTGRES_DSN` | `postgres://metraly:metraly@localhost:5432/metraly?sslmode=disable` | PostgreSQL |
| `REDIS_HOST` | `redis` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `JWT_PRIVATE_KEY` | `""` (auto-gen, WARN logged) | RS256 private key PEM |
| `ACCESS_TOKEN_TTL` | `900` | Access token lifetime (seconds) |
| `REFRESH_TOKEN_TTL` | `604800` | Refresh token lifetime (seconds) |
| `OIDC_ISSUER_URL` | `""` | OIDC provider URL (optional) |
| `OIDC_CLIENT_ID` | `""` | OIDC client ID (optional) |
| `OIDC_CLIENT_SECRET` | `""` | OIDC client secret (optional) |
| `OIDC_REDIRECT_URL` | `""` | OIDC callback URL (optional) |
| `SEED_ON_START` | `false` | Auto-seed on startup |
| `SEED_ADMIN_EMAIL` | `""` | Seed admin email |
| `SEED_ADMIN_PASSWORD` | `""` | Seed admin password |

---

## Implementation Phases

### Phase 1 — Dependencies & Infrastructure
- [ ] Add 5 new packages to `go.mod` (`pgx/v5`, `jwt/v5`, `json-iterator`, `go-oidc/v3`, `oauth2`)
- [ ] Add PostgreSQL + TimescaleDB to `docker-compose.yaml`
- [ ] Create `cmd/api/config/config.go`
- [ ] Create `cmd/api/db/postgres.go` (pgxpool wrapper)
- [ ] Create `cmd/api/db/migrate.go` (embedded SQL runner)
- [ ] Write 7 migration SQL files

### Phase 2 — Domain + Repo
- [ ] Write all 6 domain files in `cmd/api/domain/`
- [ ] Write `cmd/api/repo/errors.go`
- [ ] Implement all 7 repo files (pgx, no ORM)
  - Dashboard repo: `UPDATE WHERE id=$1 AND version=$2`, 0 rows → `ErrVersionConflict`
  - Metric repo: `time_bucket()` query returning exactly 14 points via `generate_series`

### Phase 3 — Auth
- [ ] `cmd/api/auth/interface.go` — interfaces + error sentinels
- [ ] `cmd/api/auth/jwt.go` — KeyManager (RS256, auto-generate fallback)
- [ ] `cmd/api/auth/service.go` — authService + redisTokenStore
- [ ] `cmd/api/auth/oidc.go` — lazy oidcProvider

### Phase 4 — Biz Services
- [ ] `cmd/api/biz/errors.go`
- [ ] `cmd/api/respond/respond.go` (sync.Pool + jsoniter)
- [ ] All 7 biz service files

### Phase 5 — Middleware + Handlers
- [ ] `cmd/api/middleware/auth.go` — RequireAuth, RequireRole
- [ ] `cmd/api/middleware/logger.go`
- [ ] All 10 handler files
- [ ] `cmd/api/main.go` — full wiring + graceful shutdown

### Phase 6 — Seed
- [ ] `cmd/api/seed/prng.go` — verify against JS: seed=42, first Next() ≈ 0.000328775
- [ ] All 6 seed files
- [ ] Wire `--seed` flag in `main.go`

### Phase 7 — docker-compose + Makefile
- [ ] Add `postgres` service (postgres:16 + TimescaleDB image: `timescale/timescaledb:latest-pg16`)
- [ ] Update `ui` compose service to point at `:8000` backend
- [ ] Add `make seed` target

### Phase 8 — Tests
- [ ] Unit: `auth/jwt.go` round-trip sign/verify
- [ ] Unit: `biz/dashboard_svc.go` optimistic lock conflict path
- [ ] Unit: `biz/metrics_svc.go` errgroup error propagation
- [ ] Unit: `seed/prng.go` first 5 values vs JS reference
- [ ] Integration: migration runner + seed against testcontainer Postgres

---

## Error Response Format

All errors use consistent JSON shape:
```json
{
  "error": {
    "code": "DASHBOARD_NOT_FOUND",
    "message": "dashboard not found"
  }
}
```

| Biz Error | HTTP Status | Code |
|-----------|-------------|------|
| `ErrNotFound` | 404 | `NOT_FOUND` |
| `ErrConflict` | 409 | `VERSION_CONFLICT` |
| `ErrForbidden` | 403 | `FORBIDDEN` |
| `ErrValidation` | 422 | `VALIDATION_ERROR` |
| everything else | 500 | `INTERNAL_ERROR` (message scrubbed) |

---

## Key Design Decisions

1. **`WidgetInstance.Config` is `json.RawMessage`** — avoids Go union type explosion for 11 widget config variants; passed through untouched to/from DB and client.
2. **No ORM** — pgx/v5 directly; JSONB columns scanned via pgx json codec registration at pool creation.
3. **No migration library** — simple sequential SQL runner with `schema_migrations` tracking table.
4. **`respond` package** — single JSON response entrypoint; all handlers import it, never call `json.NewEncoder` directly.
5. **Biz layer owns cache** — not middleware; gives per-operation TTL control.
6. **OIDC is opt-in** — zero overhead if `OIDC_ISSUER_URL` is empty; no extra containers for basic deployment.
7. **Seed is idempotent** — `INSERT ... ON CONFLICT DO NOTHING`; safe to run multiple times.
8. **PRNG parity** — Go `seed/prng.go` must produce identical float sequence as `mockApi.ts` for seed data to match frontend expectations exactly.
