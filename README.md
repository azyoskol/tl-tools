# Metraly — Team Engineering Metrics API

Developer productivity dashboard for multiple teams. Track your team's performance in real-time.

## Features

### Metrics & Charts

| Chart | Source | Purpose |
|-------|--------|---------|
| **PRs opened/merged** | Git | Code review speed, bottlenecks |
| **Cycle time** | PM tools | Time from start to task completion |
| **Velocity** | PM tools | Team speed per sprint |
| **CI/CD success rate** | CI/CD | Build stability |
| **Blocked tasks** | PM tools | Blocked work items |

### Dashboard Pages

1. **Overview** — main page with key metrics
   - Cards: PRs opened, Blocked tasks, CI failures, PRs merged
   - 7-day activity chart by source type
   - Top teams and authors

2. **Activity** — detailed activity with filters
   - Stacked bar chart by source (Git, PM, CI/CD)
   - Hourly distribution

3. **Team Comparison** — team comparison view
   - PRs, Tasks, CI Runs per team

## Quick Start

### Docker Compose (recommended)

```bash
# Clone and run
docker compose up -d

# Access
# UI:         http://localhost:3000
# API:        http://localhost:8000
# ClickHouse: http://localhost:8123
```

### Makefile Commands

```bash
make help              # Show all commands
make build             # Build Go API
make test              # Run tests (19 tests)
make docker-up         # Start services
make docker-down       # Stop services
make health            # Check API health
make dashboard         # Check dashboard data
make docker-test-data  # Insert test data
```

## Architecture

```
HTTP Request
    ↓
Handler (validation, marshaling)
    ↓
Biz (business logic)
    ↓
Repo (data access)
    ↓
Database (ClickHouse HTTP)
```

### Technology Stack

- **Backend**: Go 1.26+, Chi router
- **Database**: ClickHouse 23.8 (HTTP port 8123)
- **Cache**: Redis 7 (port 6379)
- **UI**: React 20 + Vite + Recharts

### Directory Structure

```
internal/pkg/
├── biz/          # Business logic (DashboardService)
├── cache/        # Redis cache with in-memory fallback
├── config/       # Environment config
├── database/     # ClickHouse HTTP client
├── handlers/     # HTTP endpoints
├── middleware/   # CORS, caching
├── logger/       # Structured logging
├── models/        # Shared types
└── repo/          # Data access layer

cmd/api/main.go   # Entry point with graceful shutdown
ui/              # React frontend
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Welcome message |
| `GET /health` | API health check |
| `GET /health/clickhouse` | ClickHouse connectivity |
| `GET /api/v1/dashboard` | All teams overview metrics |
| `GET /api/v1/teams` | List all teams |
| `GET /api/v1/teams/{id}` | Team details |
| `GET /api/v1/teams/{id}/overview` | Team overview metrics |
| `GET /api/v1/teams/{id}/activity` | Team activity |
| `GET /api/v1/teams/{id}/velocity` | Velocity metrics |
| `GET /api/v1/teams/{id}/insights` | Team insights |
| `GET /api/v1/teams/comparison` | Compare all teams |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CLICKHOUSE_HOST` | localhost | ClickHouse host |
| `CLICKHOUSE_PORT` | 8123 | ClickHouse HTTP port |
| `REDIS_HOST` | redis | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `PORT` | 8000 | API server port |

## Testing

```bash
# Run all tests
make test

# Output: 19 tests pass
```

### Test Coverage

- **biz/** — DashboardService with mock EventRepo
- **cache/** — Redis fallback to in-memory
- **config/** — Env variable handling
- **handlers/** — HTTP handlers with mock DB
- **middleware/** — CORS and caching

## Development

### Prerequisites

- Go 1.26+
- Node.js 20+
- Docker & Docker Compose

### Run Locally

```bash
# Build
make build

# Run
make run

# With Docker
make docker-up
```

### Graceful Shutdown

API server supports graceful shutdown with 30s timeout:

```go
srv := &http.Server{Addr: addr, Handler: r}
go srv.ListenAndServe()

// On SIGINT/SIGTERM:
srv.Shutdown(ctx)
```

## Roadmap

- [x] MVP - Basic metrics and dashboard
- [x] Go API migration
- [ ] Advanced filtering
- [ ] Query optimization
- [ ] Enterprise features (SSO, RBAC)

## License

This project is licensed under GNU AGPLv3. See [LICENSE](LICENSE) for details.