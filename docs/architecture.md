  Phase 4: Финальная архитектура — Backend Metraly

  Структура файлов (всё в cmd/api/)

  cmd/api/
  ├── main.go                    # Wiring: deps, migrations, seed, server
  ├── config/
  │   └── config.go              # AppConfig struct + Load() из env
  ├── domain/                    # Domain structs (Go ↔ JSON)
  │   ├── user.go                # User, AppRole consts
  │   ├── dashboard.go           # Dashboard, WidgetInstance (config как json.RawMessage), WidgetLayout
  │   ├── metric.go              # MetricID consts, MetricTimeSeries, DORAResponse, BreakdownItem
  │   ├── plugin.go              # Plugin, PluginCategory
  │   ├── ai.go                  # AIInsight, ChatMessage
  │   └── activity.go            # ActivityEvent
  ├── db/
  │   ├── postgres.go            # pgxpool.Pool wrapper
  │   └── migrate.go             # Migration runner (no 3rd-party, schema_migrations table)
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
  │   ├── token_repo.go          # Refresh tokens (PostgreSQL, Redis в auth/)
  │   └── metric_repo.go         # time_bucket() queries, bulk INSERT
  ├── auth/
  │   ├── interface.go           # AuthService, TokenStore, Claims, TokenPair, errors
  │   ├── jwt.go                 # KeyManager: RS256, auto-generate если JWT_PRIVATE_KEY пуст
  │   ├── service.go             # authService: Login, Refresh, Logout + redisTokenStore
  │   └── oidc.go                # oidcProvider: lazy init, loginURL, exchange (coreos/go-oidc/v3)
  ├── biz/                       # Бизнес-логика
  │   ├── errors.go              # ErrNotFound, ErrConflict, ErrForbidden, ErrValidation
  │   ├── dashboard_svc.go       # CRUD + fork + share + FetchWidgetData (errgroup)
  │   ├── metrics_svc.go         # GetMetricData, GetDORA (errgroup × 4), GetBreakdown
  │   ├── user_svc.go            # GetMe
  │   ├── template_svc.go        # List (static, кешируется 1ч)
  │   ├── plugin_svc.go          # List, Install
  │   ├── source_svc.go          # Connect
  │   └── ai_svc.go              # GetInsights, Chat
  ├── respond/
  │   └── respond.go             # sync.Pool[bytes.Buffer] + jsoniter; JSON(), Error(), ErrorFrom()
  ├── middleware/
  │   ├── auth.go                # RequireAuth(keyMgr), RequireRole(roles...), ClaimsFromContext
  │   └── logger.go              # zerolog request logger с duration + status
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
      ├── prng.go                # Park-Miller LCG (seed=42), точная копия mockApi.ts алгоритма
      ├── runner.go              # SeedRunner: idempotent, writer interfaces
      ├── users.go               # 1 admin-пользователь
      ├── dashboards.go          # 11 дашбордов с полными widget/layout данными
      ├── plugins.go             # 6 плагинов
      ├── insights.go            # 3 AI insights
      ├── activity.go            # 4 activity events
      └── metrics.go             # 980 точек (14 метрик × 5 команд × 14 дней)

  ---
  Схема БД (ключевые решения)

  ┌────────────────────┬─────────────────────────────┬─────────────────────────────────────────────────────────┐
  │      Таблица       │          Хранение           │                       Особенности                       │
  ├────────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────┤
  │ users              │ UUID PK, bcrypt, app_role   │ UNIQUE на email и oidc_sub                              │
  ├────────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────┤
  │ dashboards         │ widgets JSONB, layout JSONB │ version INT → optimistic locking; GIN индекс на widgets │
  ├────────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────┤
  │ plugins            │ TEXT PK                     │ install_count как TEXT ("12.3k")                        │
  ├────────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────┤
  │ ai_insights        │ TEXT PK                     │ индекс по generated_at DESC                             │
  ├────────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────┤
  │ activity_events    │ TEXT PK                     │ индекс по created_at DESC                               │
  ├────────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────┤
  │ refresh_tokens     │ SHA-256 хеш PK              │ ON DELETE CASCADE к users                               │
  ├────────────────────┼─────────────────────────────┼─────────────────────────────────────────────────────────┤
  │ metric_data_points │ TimescaleDB hypertable      │ по time; индекс (metric_id, team, time DESC)            │
  └────────────────────┴─────────────────────────────┴─────────────────────────────────────────────────────────┘

  ---
  Маршруты (полная таблица)

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

  ---
  Производительность

  ┌──────────────────────────────┬──────────────────────────────────────────────────────┐
  │           Паттерн            │                   Где используется                   │
  ├──────────────────────────────┼──────────────────────────────────────────────────────┤
  │ sync.Pool[bytes.Buffer]      │ respond/respond.go — каждый JSON-ответ               │
  ├──────────────────────────────┼──────────────────────────────────────────────────────┤
  │ sync.Pool[[]MetricDataPoint] │ repo/metric_repo.go — 14-point slices                │
  ├──────────────────────────────┼──────────────────────────────────────────────────────┤
  │ sync.Pool[hash.Hash]         │ auth/service.go — SHA-256 refresh token              │
  ├──────────────────────────────┼──────────────────────────────────────────────────────┤
  │ errgroup.WithContext         │ biz/dashboard_svc.go → FetchWidgetData               │
  ├──────────────────────────────┼──────────────────────────────────────────────────────┤
  │ errgroup.WithContext         │ biz/metrics_svc.go → GetDORA (4 метрики параллельно) │
  ├──────────────────────────────┼──────────────────────────────────────────────────────┤
  │ sync.WaitGroup               │ biz/metrics_svc.go → current + previous period       │
  ├──────────────────────────────┼──────────────────────────────────────────────────────┤
  │ Redis кеш                    │ метрики TTL 5min, дашборды TTL 30s, шаблоны TTL 1h   │
  └──────────────────────────────┴──────────────────────────────────────────────────────┘

  ---
  Новые зависимости в go.mod

  github.com/jackc/pgx/v5
  github.com/golang-jwt/jwt/v5
  github.com/json-iterator/go
  github.com/coreos/go-oidc/v3
  golang.org/x/oauth2

  ---
  Новые переменные окружения

  ┌─────────────────────┬───────────────────────────────────────────────────────────────────┬──────────────────────────┐
  │     Переменная      │                              Дефолт                               │        Назначение        │
  ├─────────────────────┼───────────────────────────────────────────────────────────────────┼──────────────────────────┤
  │ POSTGRES_DSN        │ postgres://metraly:metraly@localhost:5432/metraly?sslmode=disable │ PostgreSQL               │
  ├─────────────────────┼───────────────────────────────────────────────────────────────────┼──────────────────────────┤
  │ JWT_PRIVATE_KEY     │ "" (auto-generate, warn)                                          │ RS256 private key PEM    │
  ├─────────────────────┼───────────────────────────────────────────────────────────────────┼──────────────────────────┤
  │ ACCESS_TOKEN_TTL    │ 900                                                               │ Сек. жизни access token  │
  ├─────────────────────┼───────────────────────────────────────────────────────────────────┼──────────────────────────┤
  │ REFRESH_TOKEN_TTL   │ 604800                                                            │ Сек. жизни refresh token │
  ├─────────────────────┼───────────────────────────────────────────────────────────────────┼──────────────────────────┤
  │ OIDC_ISSUER_URL     │ ""                                                                │ Опционально              │
  ├─────────────────────┼───────────────────────────────────────────────────────────────────┼──────────────────────────┤
  │ OIDC_CLIENT_ID      │ ""                                                                │ Опционально              │
  ├─────────────────────┼───────────────────────────────────────────────────────────────────┼──────────────────────────┤
  │ OIDC_CLIENT_SECRET  │ ""                                                                │ Опционально              │
  ├─────────────────────┼───────────────────────────────────────────────────────────────────┼──────────────────────────┤
  │ OIDC_REDIRECT_URL   │ ""                                                                │ Опционально              │
  ├─────────────────────┼───────────────────────────────────────────────────────────────────┼──────────────────────────┤
  │ SEED_ON_START       │ false                                                             │ Auto-seed при старте     │
  ├─────────────────────┼───────────────────────────────────────────────────────────────────┼──────────────────────────┤
  │ SEED_ADMIN_EMAIL    │ ""                                                                │ Email seed-пользователя  │
  ├─────────────────────┼───────────────────────────────────────────────────────────────────┼──────────────────────────┤
  │ SEED_ADMIN_PASSWORD │ ""                                                                │ Пароль seed-пользователя │
  └─────────────────────┴───────────────────────────────────────────────────────────────────┴──────────────────────────┘

  ---
  Порядок реализации (8 фаз)

  1. go.mod — добавить 5 зависимостей
  2. Infrastructure — config, db, migrate, migrations SQL
  3. Domain + Repo — structs, interfaces, pgx implementations
  4. Auth — JWT, KeyManager, authService, OIDC, TokenStore
  5. Biz — все 7 сервисов + typed errors + respond helper
  6. Middleware + Handlers — 10 handler файлов
  7. main.go — полный wiring, маршруты, graceful shutdown
  8. Seed — PRNG + 6 seed файлов + runner (idempotent)