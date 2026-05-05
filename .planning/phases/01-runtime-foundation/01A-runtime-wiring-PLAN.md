---
phase: 1
phase_name: Runtime Foundation
plan: 01A-runtime-wiring
type: execute
wave: 1
depends_on: []
requirements: [FOUND-01, FOUND-02, FOUND-03]
requirements_addressed: [FOUND-01, FOUND-02, FOUND-03]
files_modified:
  - cmd/api/main.go
  - cmd/api/runtime.go
  - cmd/api/runtime_test.go
  - cmd/api/cache/dashboard.go
  - cmd/api/cache/metrics.go
  - cmd/api/cache/template.go
  - cmd/api/config/config.go
  - cmd/api/config/config_test.go
autonomous: true
---

# Plan 01A: Runtime Wiring

<objective>
Make API startup use one explicit runtime path for config, Postgres, migrations, Redis/cache fallback, repositories, services, and router dependencies.
</objective>

<must_haves>
<truth id="D-07">Wire existing layers into the active runtime: config, Postgres pool, migrations, Redis clients, repositories, caches, services, and handlers.</truth>
<truth id="D-10">Postgres is mandatory; API startup must fail before serving routes when Postgres or migrations fail.</truth>
<truth id="D-11">Redis is optional for Phase 1 startup, but degraded cache/session state must be visible.</truth>
<truth id="D-12">Do not hide missing Postgres or report the preview healthy without the required database.</truth>
<truth id="D-13">Required Phase 1 verification is go test ./... plus focused startup/wiring tests.</truth>
<truth id="D-14">Add or update tests for config, migrations/startup wiring, dependency failure behavior, and service-backed handler behavior touched by the phase.</truth>
</must_haves>

<threat_model>
Assets: database schema, runtime configuration, health signal, refresh-token/cache dependencies.
Trust boundaries: environment variables to runtime config, API process to Postgres, API process to Redis, unauthenticated clients to public routes.
Threats:
- High: API serves routes after Postgres connection or migration failure. Mitigation: return errors from runtime construction and call `os.Exit(1)` before `ListenAndServe`.
- Medium: Redis outage silently breaks cache/session behavior. Mitigation: create no-op cache fallbacks and log `redis unavailable; using degraded cache mode`.
- Medium: wildcard CORS with credentials exposes authenticated routes to arbitrary origins. Mitigation: make CORS configuration explicit and testable; do not expand auth surface in this phase.
</threat_model>

<tasks>
<task id="01A-1" type="execute">
<title>Create runtime dependency composition</title>
<read_first>
- `cmd/api/main.go`
- `cmd/api/config/config.go`
- `cmd/api/db/db.go`
- `cmd/api/db/migrate.go`
- `cmd/api/migrations/embed.go`
- `cmd/api/repo/*.go`
- `cmd/api/biz/*.go`
- `cmd/api/cache/*.go`
- `.planning/phases/01-runtime-foundation/01-CONTEXT.md`
- `.planning/phases/01-runtime-foundation/01-RESEARCH.md`
</read_first>
<action>
Add a new `cmd/api/runtime.go` file with the required AGPL header and these concrete exported or package-private types/functions:

- `type runtimeDeps struct { cfg config.AppConfig; pool *pgxpool.Pool; redis *redis.Client; keyManager *auth.KeyManager; dashboardSvc *biz.DashboardSvc; metricsSvc *biz.MetricsSvc; templateSvc *biz.TemplateSvc; cleanup func() }`
- `func newRuntime(ctx context.Context, cfg config.AppConfig) (*runtimeDeps, error)`
- `func (d *runtimeDeps) Close()`

Inside `newRuntime`:

1. Create `auth.KeyManager` from `cfg.JWTPrivateKey`; wrap errors as `init jwt key manager: %w`.
2. Create Postgres with `db.New(ctx, cfg.PostgresDSN)`; wrap errors as `connect postgres: %w`.
3. Run `db.Migrate(ctx, pool, migrations.FS)`; wrap errors as `migrate postgres: %w`.
4. Create repositories with existing constructors: `repo.NewDashboardRepo`, `repo.NewMetricRepo`, `repo.NewUserRepo`, `repo.NewPluginRepo`, `repo.NewAIInsightRepo`, `repo.NewActivityRepo`.
5. Create a Redis client using `redis.NewClient(&redis.Options{Addr: cfg.RedisHost + ":" + cfg.RedisPort})`.
6. Ping Redis with a short context timeout. If ping fails, keep startup alive, log the degraded state, and use no-op cache implementations for dashboard, metrics, and template caches.
7. If Redis succeeds, use existing Redis cache constructors with TTLs from config in seconds.
8. Construct `biz.NewDashboardSvc`, `biz.NewMetricsSvc`, and `biz.NewTemplateSvc`.
9. If `cfg.SeedOnStart` is true, run `seed.NewRunner(...).Run(ctx, cfg.SeedAdminEmail, cfg.SeedAdminPassword)` after migrations and repository construction; wrap errors as `seed data: %w`.
10. `Close()` must close Postgres and Redis when present.
</action>
<acceptance_criteria>
- `cmd/api/runtime.go` contains `func newRuntime(ctx context.Context, cfg config.AppConfig) (*runtimeDeps, error)`.
- `cmd/api/runtime.go` contains `db.Migrate(ctx, pool, migrations.FS)`.
- `cmd/api/runtime.go` contains error strings `connect postgres`, `migrate postgres`, and `redis unavailable`.
- `cmd/api/runtime.go` contains `seed.NewRunner`.
- `cmd/api/runtime.go` contains `func (d *runtimeDeps) Close()`.
</acceptance_criteria>
</task>

<task id="01A-2" type="execute">
<title>Add no-op cache fallbacks</title>
<read_first>
- `cmd/api/cache/dashboard.go`
- `cmd/api/cache/metrics.go`
- `cmd/api/cache/template.go`
- `cmd/api/biz/dashboard_svc.go`
- `cmd/api/biz/metrics_svc.go`
- `cmd/api/biz/template_svc.go`
</read_first>
<action>
Add no-op cache constructors that satisfy existing interfaces:

- `func NewNoopDashboardCache() DashboardCache`
- `func NewNoopMetricsCache() MetricsCache`
- `func NewNoopTemplateCache() TemplateCache`

`Get` methods must return cache miss errors (`ErrCacheMiss` for metrics/template and `ErrCacheMiss` for dashboard after moving/reusing the exported var). `Set` methods must return nil. Do not add nil checks in service methods; services should continue using the interface.
</action>
<acceptance_criteria>
- `cmd/api/cache/dashboard.go` contains `NewNoopDashboardCache`.
- `cmd/api/cache/metrics.go` contains `NewNoopMetricsCache`.
- `cmd/api/cache/template.go` contains `NewNoopTemplateCache`.
- `go test ./cmd/api/cache ./cmd/api/biz` exits 0.
</acceptance_criteria>
</task>

<task id="01A-3" type="execute">
<title>Route main through runtime dependencies</title>
<read_first>
- `cmd/api/main.go`
- `cmd/api/main_test.go`
- `cmd/api/runtime.go`
- `cmd/api/handlers/dashboards.go`
</read_first>
<action>
Change `main()` to:

1. Load config with `cfg := config.Load()`.
2. Create a root context.
3. Call `deps, err := newRuntime(ctx, cfg)`.
4. On error, write the error to stderr or logger and `os.Exit(1)` before constructing the server.
5. Defer `deps.Close()`.
6. Build the router with `NewRouter(RouterDeps{KeyManager: deps.keyManager, DashboardSvc: deps.dashboardSvc})` or an equivalent dependency struct.
7. Create `http.Server{Addr: ":" + cfg.Port, Handler: r}`.

Change `NewRouter` to accept a dependency struct rather than only `*auth.KeyManager`. Keep public health and existing static legacy endpoints working. Do not expose login/refresh/logout endpoints in this plan unless Phase 2 auth work is also planned.
</action>
<acceptance_criteria>
- `cmd/api/main.go` contains `cfg := config.Load()`.
- `cmd/api/main.go` contains `newRuntime(ctx, cfg)`.
- `cmd/api/main.go` contains `Addr: ":" + cfg.Port`.
- `cmd/api/main.go` no longer contains `NewRouter(km)`.
- `go test ./cmd/api` exits 0.
</acceptance_criteria>
</task>

<task id="01A-4" type="execute">
<title>Test startup failure and degraded Redis behavior</title>
<read_first>
- `cmd/api/runtime.go`
- `cmd/api/runtime_test.go`
- `cmd/api/main_test.go`
- `cmd/api/db/migrate_test.go`
</read_first>
<action>
Add tests that prove:

1. Runtime construction returns an error containing `connect postgres` when Postgres cannot be reached.
2. Migration errors are wrapped with `migrate postgres`. If this cannot be induced without a database seam, add a small injectable migration function variable in `runtime.go` and reset it in the test with `t.Cleanup`.
3. Redis ping failure does not return an error when Postgres/migrations succeed; cache deps are no-op implementations. If this requires dependency seams, add package-private function variables for Redis creation/ping and reset them with `t.Cleanup`.

Keep tests deterministic. Do not require Docker for these startup behavior tests unless the existing Testcontainers migration tests already cover the exact behavior.
</action>
<acceptance_criteria>
- `cmd/api/runtime_test.go` contains test names including `PostgresFailure`, `MigrationFailure`, and `RedisDegraded`.
- `go test ./cmd/api` exits 0.
- `go test ./...` exits 0.
</acceptance_criteria>
</task>
</tasks>

<verification>
Run:

```bash
go test ./cmd/api
go test ./...
go vet ./...
```
</verification>

<success_criteria>
- API startup applies migrations before route serving.
- Missing Postgres or failed migrations prevent startup with clear wrapped errors.
- Redis failures do not block cache-backed paths and are visible as degraded state.
- Runtime dependencies flow through one composition path.
</success_criteria>
