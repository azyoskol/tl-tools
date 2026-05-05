---
phase: 1
plan: 01A-runtime-wiring
subsystem: api-runtime
tags: [runtime, postgres, redis, migrations, tests]
requires: [FOUND-01, FOUND-02, FOUND-03]
provides:
  - Runtime dependency composition
  - Postgres fail-fast startup path
  - Redis degraded cache fallback
affects:
  - cmd/api/main.go
  - cmd/api/runtime.go
  - cmd/api/cache
tech-stack:
  added: []
  patterns: [dependency-composition, no-op-cache, startup-fail-fast]
key-files:
  created:
    - cmd/api/runtime.go
    - cmd/api/runtime_test.go
  modified:
    - cmd/api/main.go
    - cmd/api/main_test.go
    - cmd/api/router_inspection_test.go
    - cmd/api/cache/dashboard.go
    - cmd/api/cache/metrics.go
    - cmd/api/cache/template.go
key-decisions:
  - Runtime composition lives in package-main `runtimeDeps` for now to keep Phase 1 scoped.
  - Redis outage degrades cache behavior through no-op cache implementations.
  - Postgres connection and migration errors abort startup before route serving.
requirements-completed: [FOUND-01, FOUND-02, FOUND-03]
duration: "in progress"
completed: 2026-05-05
---

# Phase 1 Plan 01A: Runtime Wiring Summary

Runtime startup now loads config, connects Postgres, applies embedded migrations, constructs Redis/cache/repo/service dependencies, and passes router dependencies through one explicit path.

## Tasks Completed

| Task | Status | Commit |
|------|--------|--------|
| 01A-1 Create runtime dependency composition | Complete | `77158a3` |
| 01A-2 Add no-op cache fallbacks | Complete | `f3868d9` |
| 01A-3 Route main through runtime dependencies | Complete | `55eb453` |
| 01A-4 Test startup failure and degraded Redis behavior | Complete | `8067c18` |

## Verification

| Command | Result |
|---------|--------|
| `go test ./cmd/api/cache ./cmd/api/biz ./cmd/api` | PASS |
| `go test ./...` | PASS |
| `go vet ./...` | PASS |

## Acceptance Evidence

- `cmd/api/runtime.go` contains `func newRuntime(ctx context.Context, cfg config.AppConfig) (*runtimeDeps, error)`.
- `cmd/api/runtime.go` applies embedded migrations through the default `db.Migrate(ctx, pool, migrations.FS)` startup path.
- `cmd/api/runtime.go` wraps `connect postgres`, `migrate postgres`, and logs `redis unavailable`.
- `cmd/api/runtime.go` constructs `seed.NewRunner`.
- `cmd/api/runtime.go` contains `func (d *runtimeDeps) Close()`.
- `cmd/api/cache/dashboard.go`, `metrics.go`, and `template.go` contain no-op cache constructors.
- `cmd/api/main.go` contains `cfg := config.Load()`, `newRuntime(ctx, cfg)`, and `Addr: ":" + cfg.Port`.
- `cmd/api/runtime_test.go` contains `PostgresFailure`, `MigrationFailure`, and `RedisDegraded` test coverage.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

The runtime path now makes Postgres and migrations mandatory, keeps Redis optional with visible degraded behavior, and leaves auth route expansion for Phase 2.
