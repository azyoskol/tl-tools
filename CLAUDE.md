# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This is an **early-stage Go project** — there is no `go.mod`, no `main.go`, and no build tooling yet. The project is not yet buildable. Key bootstrapping tasks needed:
- Create `go.mod` with module path `github.com/getmetraly/metraly`
- Fix import paths: all `.go` files import `github.com/getmetraly/metraly/api/pkg/...` but code lives under `internal/pkg/...`
- Create `cmd/api/main.go` entry point that wires the dependency graph

## Architecture

This is a **team engineering metrics API** that ingests events from Git, PM tools, and CI/CD pipelines and serves aggregated dashboards.

### Data Flow

All data enters through a single `events` table in ClickHouse (with fields `source_type`, `event_type`, `team_id`, `payload` JSON string, `occurred_at`). ClickHouse materialized views fan-out into derived read models automatically at insert time:

- `daily_aggregates` — event counts by team/date/type (SummingMergeTree)
- `pr_metrics` — per-PR timing: created → first review → merged
- `cycle_metrics` — per-task timing: in_progress → done
- `team_workload` — per-user daily task stats
- `cicd_health` — pipeline success/failure rates
- `realtime_alerts` — stale PRs, blocked tasks, CI failures

Events that cannot be processed go to `events_dlq` (dead-letter queue).

### Package Layout

```
internal/pkg/
  cache/       Cache interface + Redis implementation (auto-falls back to in-memory)
  config/      Config interface + env-var implementation
  database/    Database interface + ClickHouse implementation
  handlers/    HTTP handlers (one struct per endpoint group)
  logger/      Logger interface + stdlib implementation
  middleware/  CORS + response-caching middleware
  models/      Shared request/response structs
clickhouse/    SQL: schema.sql + test/mock data fixtures
```

### Infrastructure Interfaces

Each infrastructure concern has an `interface.go` + a single implementation file. The pattern is constructor injection via `Config`:
- `database.NewClickHouse(cfg)` — connects to ClickHouse at `CLICKHOUSE_HOST:CLICKHOUSE_PORT`, database `CLICKHOUSE_DB`
- `cache.NewRedisCache(cfg)` — connects to `REDIS_HOST:REDIS_PORT`; silently degrades to in-process map if Redis is unreachable
- `config.NewEnvConfig()` — reads env vars with `Get(key, default)` / `GetInt(key, default)`

### HTTP Layer

Chi router (`go-chi/chi/v5`). Handler structs receive a `database.Database` via constructor. Route structure:
- `GET /` and `GET /health` — HealthHandler
- `GET /api/v1/dashboard` — DashboardHandler (all teams overview)
- `GET /api/v1/teams/{team_id}/overview|activity|insights` — OverviewHandler
- `GET /api/v1/teams/{team_id}/velocity` — VelocityHandler
- `GET /api/v1/teams/comparison` — ComparisonHandler
- `POST /api/v1/collectors` — WebhookHandler.Receive (event ingestion)

Cache middleware (5-minute TTL) wraps all GET routes except `/health`, `/docs`, `/openapi`, `/api/v1/collectors`, and `/api/v1/teams/` (team-level routes bypass cache).

### Event Source Types

`source_type` is an enum: `git` | `pm` | `cicd` | `metrics`

Key event types by source:
- `git`: `pr_opened`, `pr_merged`, `pr_reviewed`, `pr_review_request`, `pr_stale`
- `pm`: `task_created`, `task_in_progress`, `task_done`, `task_blocked`, `task_overdue`
- `cicd`: `pipeline_run`, `pipeline_success`, `pipeline_failed`, `pipeline_completed`

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `CLICKHOUSE_HOST` | `localhost` | ClickHouse host |
| `CLICKHOUSE_PORT` | `9000` | ClickHouse native port |
| `CLICKHOUSE_DB` | `default` | Database name |
| `REDIS_HOST` | `redis` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |

## ClickHouse Setup

Apply schema before running:
```sh
clickhouse-client < clickhouse/schema.sql
```

Load test data (14-day window):
```sh
clickhouse-client < clickhouse/test_data_14days.sql
```
