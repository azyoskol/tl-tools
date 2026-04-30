# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This is a **Go project** for team engineering metrics API. The project is buildable and running.

**Build:**
```bash
make build           # Build Go binary
make docker-up       # Start services
make test            # Run tests (19 tests)
```

## Architecture

This is a **team engineering metrics API** that ingests events from Git, PM tools, and CI/CD pipelines and serves aggregated dashboards.

### Layered Architecture

```
HTTP Request
    ↓
Handler (validate request, marshal)      # internal/pkg/handlers/
    ↓
Business Logic                           # internal/pkg/biz/
    ↓
Repository (data access, queries)         # internal/pkg/repo/
    ↓
Database (ClickHouse HTTP client)         # internal/pkg/database/
```

### Package Layout

```
internal/pkg/
├── biz/          # Business logic (DashboardService, etc.)
├── cache/        # Cache interface + Redis implementation
├── config/       # Config interface + env-var implementation
├── database/     # Database interface + ClickHouse HTTP implementation
├── handlers/      # HTTP handlers (chi router)
├── logger/       # Logger interface + stdlib implementation
├── middleware/   # CORS + response-caching middleware
├── models/        # Shared request/response structs
└── repo/         # Repository interfaces + ClickHouse implementations
cmd/api/
└── main.go       # Entry point with graceful shutdown

clickhouse/       # SQL: schema.sql + test data
collectors/       # Event collectors (git, pm, cicd, metrics)
ui/               # React frontend
```

### Key Interfaces

- `database.Database` - Query, Exec, Ping
- `repo.EventRepo` - CountEvents, GetActivity, GetTopTeams, GetHourly, GetTopAuthors
- `biz.DashboardService` - GetDashboard, GetOverview, GetActivity, etc.
- `cache.Cache` - Get, Set, Delete

### Infrastructure

Each infrastructure concern has an `interface.go` + implementation:
- `database.NewClickHouse(cfg)` — ClickHouse via HTTP (port 8123)
- `cache.NewRedisCache(cfg)` — Redis with in-memory fallback
- `config.NewEnvConfig()` — env vars with Get/GetInt

### HTTP Routes

Chi router (`go-chi/chi/v5`). Handler structs receive services via constructor.

| Endpoint | Handler |
|----------|---------|
| `GET /` | HealthHandler |
| `GET /health` | HealthHandler |
| `GET /health/clickhouse` | HealthHandler |
| `GET /api/v1/dashboard` | DashboardHandler |
| `GET /api/v1/teams` | TeamsHandler |
| `GET /api/v1/teams/{id}` | TeamsHandler |
| `GET /api/v1/teams/{id}/overview` | TeamsHandler |
| `GET /api/v1/teams/{id}/activity` | TeamsHandler |
| `GET /api/v1/teams/{id}/insights` | TeamsHandler |
| `GET /api/v1/teams/{id}/velocity` | VelocityHandler |
| `GET /api/v1/teams/comparison` | ComparisonHandler |
| `POST /api/v1/collectors` | WebhookHandler |

### Event Source Types

`source_type` enum: `git` | `pm` | `cicd` | `metrics`

Key event types:
- `git`: `pr_opened`, `pr_merged`, `pr_reviewed`, `pr_review_request`, `pr_stale`
- `pm`: `task_created`, `task_in_progress`, `task_done`, `task_blocked`, `task_overdue`
- `cicd`: `pipeline_run`, `pipeline_success`, `pipeline_failed`, `pipeline_completed`

### Makefile Commands

```bash
make build              # Build Go API
make run                # Run locally
make test               # Run tests
make lint               # Run linter
make docker-up          # Start Docker services
make docker-down        # Stop Docker services
make docker-restart     # Restart services
make docker-build-api   # Rebuild API only
make health             # Check API health
make dashboard          # Check dashboard data
make docker-test-data   # Insert test data
```

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `CLICKHOUSE_HOST` | `localhost` | ClickHouse host |
| `CLICKHOUSE_PORT` | `8123` | ClickHouse HTTP port |
| `CLICKHOUSE_DB` | `default` | Database name |
| `REDIS_HOST` | `redis` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `PORT` | `8000` | API server port |

## Testing

- 19 unit tests across biz, cache, config, handlers, middleware packages
- Tests use mock implementations for dependencies
- Run: `make test` or `go test ./...`

## Docker Services

- **api**: Go API server (port 8000)
- **clickhouse**: ClickHouse DB (ports 8123 HTTP, 9000 native)
- **redis**: Cache (port 6379)
- **ui**: React frontend (port 3000)