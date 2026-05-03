```markdown
Phase 4: Final Architecture — Backend Metraly

File structure (everything in `cmd/api/`)

```
cmd/api/
├── main.go                    # Wiring: deps, migrations, seed, server
├── config/
│   └── config.go              # AppConfig struct + Load() from env
├── domain/                    # Domain structs (Go ↔ JSON)
│   ├── user.go                # User, AppRole consts
│   ├── dashboard.go           # Dashboard, WidgetInstance (config as json.RawMessage), WidgetLayout
│   ├── metric.go              # MetricID consts, MetricTimeSeries, DORAResponse, BreakdownItem
│   ├── plugin.go              # Plugin, PluginCategory
│   ├── ai.go                  # AIInsight, ChatMessage
│   └── activity.go            # ActivityEvent
├── db/
│   ├── postgres.go            # pgxpool.Pool wrapper
│   └── migrate.go             # Migration runner (no 3rd‑party, schema_migrations table)
├── migrations/                # SQL files (numbered, embedded via go:embed)
│   ├── 001_users.sql
│   ├── 002_dashboards.sql
│   ├── 003_plugins.sql
│   ├── 004_ai_insights.sql
│   ├── 005_activity_events.sql
│   ├── 006_refresh_tokens.sql
│   └── 007_metric_data_points.sql  # TimescaleDB hypertable
├── repo/                      # Interfaces + pgx implementations
│   ├── errors.go              # var ErrNotFound, ErrVersionConflict
│   ├── user_repo.go
│   ├── dashboard_repo.go      # UPDATE WHERE id=$1 AND version=$2 → 0 rows = conflict
│   ├── plugin_repo.go
│   ├── insight_repo.go
│   ├── activity_repo.go
│   ├── token_repo.go          # Refresh tokens (PostgreSQL, Redis in auth/)
│   └── metric_repo.go         # time_bucket() queries, bulk INSERT
├── auth/
│   ├── interface.go           # AuthService, TokenStore, Claims, TokenPair, errors
│   ├── jwt.go                 # KeyManager: RS256, auto‑generate if JWT_PRIVATE_KEY empty
│   ├── service.go             # authService: Login, Refresh, Logout + redisTokenStore
│   └── oidc.go                # oidcProvider: lazy init, loginURL, exchange (coreos/go-oidc/v3)
├── biz/                       # Business logic
│   ├── errors.go              # ErrNotFound, ErrConflict, ErrForbidden, ErrValidation
│   ├── dashboard_svc.go       # CRUD + fork + share + FetchWidgetData (errgroup)
│   ├── metrics_svc.go         # GetMetricData, GetDORA (errgroup × 4), GetBreakdown
│   ├── user_svc.go            # GetMe
│   ├── template_svc.go        # List (static, cached 1h)
│   ├── plugin_svc.go          # List, Install
│   ├── source_svc.go          # Connect
│   └── ai_svc.go              # GetInsights, Chat
├── respond/
│   └── respond.go             # sync.Pool[bytes.Buffer] + jsoniter; JSON(), Error(), ErrorFrom()
├── middleware/
│   ├── auth.go                # RequireAuth(keyMgr), RequireRole(roles...), ClaimsFromContext
│   └── logger.go              # zerolog request logger with duration + status
├── handlers/
│   ├── auth.go                # Login, Refresh, Logout, OIDCLogin, OIDCCallback
│   ├── dashboard.go           # List, Create, Get, Update, Fork, UpdateLayout, Share, FetchData
│   ├── widget.go              # FetchData (single widget)
│   ├── metrics.go             # GetTimeSeries, GetBreakdown
│   ├── dora.go                # Get
│   ├── me.go                  # Get
│   ├── template.go            # List
│   ├── plugin.go              # List, Install
│   ├── source.go              # Connect
│   └── ai.go                  # GetInsights, Chat
└── seed/
    ├── prng.go                # Park‑Miller LCG (seed=42), exact copy of mockApi.ts algorithm
    ├── runner.go              # SeedRunner: idempotent, writer interfaces
    ├── users.go               # 1 admin user
    ├── dashboards.go          # 11 dashboards with full widget/layout data
    ├── plugins.go             # 6 plugins
    ├── insights.go            # 3 AI insights
    ├── activity.go            # 4 activity events
    └── metrics.go             # 980 points (14 metrics × 5 teams × 14 days)
```

---

## Database schema (key decisions)

| Table               | Storage                           | Features                                                                 |
|---------------------|-----------------------------------|--------------------------------------------------------------------------|
| users               | UUID PK, bcrypt, app_role         | UNIQUE on email and oidc_sub                                             |
| dashboards          | widgets JSONB, layout JSONB       | version INT → optimistic locking; GIN index on widgets                   |
| plugins             | TEXT PK                           | install_count as TEXT ("12.3k")                                          |
| ai_insights         | TEXT PK                           | index on generated_at DESC                                               |
| activity_events     | TEXT PK                           | index on created_at DESC                                                 |
| refresh_tokens      | SHA‑256 hash PK                   | ON DELETE CASCADE to users                                               |
| metric_data_points  | TimescaleDB hypertable            | partitioned by time; index (metric_id, team, time DESC)                  |

---

## Routes (full table)

```
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/oidc/login
GET  /api/v1/auth/oidc/callback

── Protected (RequireAuth) ──────────────────────
GET  /api/v1/me
GET  /api/v1/templates
GET  /api/v1/activity

GET  /api/v1/plugins
POST /api/v1/plugins/{id}/install

POST /api/v1/sources/connect

GET  /api/v1/ai/insights
POST /api/v1/ai/chat

GET  /api/v1/metrics/{metricId}          ?timeRange=30d&team=Platform&repo=all
GET  /api/v1/metrics/{metricId}/breakdown
GET  /api/v1/dora                        ?timeRange=30d&team=All teams

GET  /api/v1/dashboards
POST /api/v1/dashboards
GET  /api/v1/dashboards/{id}
PUT  /api/v1/dashboards/{id}             (version conflict → 409)
POST /api/v1/dashboards/{id}/fork
PUT  /api/v1/dashboards/{id}/layout
PUT  /api/v1/dashboards/{id}/share
POST /api/v1/dashboards/{id}/data        (parallel errgroup)

POST /api/v1/widgets/data
```

---

## Performance

| Pattern                         | Where used                                                                 |
|---------------------------------|----------------------------------------------------------------------------|
| `sync.Pool[bytes.Buffer]`       | `respond/respond.go` — every JSON response                                 |
| `sync.Pool[[]MetricDataPoint]`  | `repo/metric_repo.go` — 14‑point slices                                    |
| `sync.Pool[hash.Hash]`          | `auth/service.go` — SHA‑256 refresh token hashing                          |
| `errgroup.WithContext`          | `biz/dashboard_svc.go` → `FetchWidgetData`                                 |
| `errgroup.WithContext`          | `biz/metrics_svc.go` → `GetDORA` (4 metrics parallel)                      |
| `sync.WaitGroup`                | `biz/metrics_svc.go` → current + previous period                           |
| Redis cache                     | metrics TTL 5min, dashboards TTL 30s, templates TTL 1h                     |

---

## Authentication

### Local JWT (RS256)
- Access tokens: 15‑minute TTL, payload `{sub, email, role}`
- Refresh tokens: 32 random bytes → base64url wire format, SHA‑256 hex stored in Redis, 7‑day TTL
- Single‑use refresh token rotation (old token revoked atomically)
- Auto‑generated RSA‑2048 key if `JWT_PRIVATE_KEY` is empty (warned, tokens invalidated on restart)

### OIDC / Enterprise SSO
- Activated when `OIDC_ISSUER_URL` is set
- Lazy initialization: `oidcProvider` constructed only when needed
- Supported providers: Keycloak, Okta, Azure AD, Google Workspace, Authentik (any OIDC‑compliant)
- CSRF protection via Redis‑stored state param (5‑minute TTL)
- On callback: find or create user by email, issue token pair

### RBAC
- Roles: `admin`, `editor`, `viewer`, `team‑lead` stored in `users.app_role`
- Enforced via `RequireRole(roles...)` middleware after `RequireAuth`

---

## Redis Caching Layer

| Cached Data       | TTL       | Location                  |
|-------------------|-----------|---------------------------|
| Metrics responses | 5 minutes | `biz/metrics_svc.go`      |
| Dashboard reads   | 30 seconds| `biz/dashboard_svc.go`    |
| Template list     | 1 hour    | `biz/template_svc.go`     |
| Refresh tokens    | 7 days    | `auth/service.go`         |
| OIDC state params | 5 minutes | `auth/oidc.go`            |

---

## Testing

### Unit Tests
- `auth/jwt.go`: Token sign/validate round‑trip
- `biz/*_svc.go`: Mock repos, test version conflict, error propagation
- `seed/prng.go`: Assert first 5 PRNG values against JS reference
- `handlers/*`: `httptest.ResponseRecorder` with mock biz services

### Integration Tests
- Migration runner: Testcontainers Postgres, assert `schema_migrations` rows
- End‑to‑end: Full stack tests with Docker services (postgres, redis)

---

## New dependencies in `go.mod`

```
github.com/jackc/pgx/v5
github.com/golang-jwt/jwt/v5
github.com/json-iterator/go
github.com/coreos/go-oidc/v3
golang.org/x/oauth2
```

---

## New environment variables

| Variable            | Default                                                              | Purpose                       |
|---------------------|----------------------------------------------------------------------|-------------------------------|
| `POSTGRES_DSN`      | `postgres://metraly:metraly@localhost:5432/metraly?sslmode=disable` | PostgreSQL                    |
| `JWT_PRIVATE_KEY`   | `""` (auto‑generate, warn)                                           | RS256 private key PEM         |
| `ACCESS_TOKEN_TTL`  | `900`                                                                | Access token lifetime (sec)   |
| `REFRESH_TOKEN_TTL` | `604800`                                                             | Refresh token lifetime (sec)  |
| `OIDC_ISSUER_URL`   | `""`                                                                 | Optional                      |
| `OIDC_CLIENT_ID`    | `""`                                                                 | Optional                      |
| `OIDC_CLIENT_SECRET`| `""`                                                                 | Optional                      |
| `OIDC_REDIRECT_URL` | `""`                                                                 | Optional                      |
| `SEED_ON_START`     | `false`                                                              | Auto‑seed on startup          |
| `SEED_ADMIN_EMAIL`  | `""`                                                                 | Seed user email               |
| `SEED_ADMIN_PASSWORD`| `""`                                                                | Seed user password            |

---

## Implementation order (8 phases)

1. `go.mod` — add 5 dependencies
2. Infrastructure — config, db, migrate, migrations SQL
3. Domain + Repo — structs, interfaces, pgx implementations
4. Auth — JWT, KeyManager, authService, OIDC, TokenStore
5. Biz — all 7 services + typed errors + respond helper
6. Middleware + Handlers — 10 handler files
7. `main.go` — full wiring, routes, graceful shutdown
8. Seed — PRNG + 6 seed files + runner (idempotent)
```