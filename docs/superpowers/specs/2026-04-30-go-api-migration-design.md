# Go API Migration Design

**Date:** 2026-04-30
**Status:** Approved

## 1. Overview

Migrate Python FastAPI to Go for performance improvement. Full parity with existing Python API.

## 2. Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   UI (3000) │────▶│  Go API     │────▶│ ClickHouse │
│             │     │   (8000)    │     │   (9000)   │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                    ┌─────┴─────┐
                    │   Redis   │
                    │  (cache)  │
                    └───────────┘
```

- **HTTP Server:** Chi router + net/http
- **DB:** ClickHouse (existing tables)
- **Cache:** Redis with in-memory fallback
- **Config:** ENV variables

## 3. Project Structure

```
cmd/
  api/
    main.go
internal/
  config/
    config.go
  clickhouse/
    client.go
  handlers/
    teams.go
    dashboard.go
    velocity.go
    comparison.go
    webhook.go
    health.go
  middleware/
    cache.go
    cors.go
  models/
    types.go
```

## 4. Routes (Full Parity)

| Method | Endpoint | Handler |
|--------|----------|---------|
| GET | / | root |
| GET | /health/api | health.API |
| GET | /health/clickhouse | health.ClickHouse |
| GET | /api/v1/teams | teams.List |
| GET | /api/v1/teams/:id | teams.Get |
| GET | /api/v1/dashboard | dashboard.Get |
| GET | /api/v1/teams/:id/overview | overview.Get |
| GET | /api/v1/teams/:id/activity | overview.Activity |
| GET | /api/v1/teams/:id/insights | overview.Insights |
| GET | /api/v1/teams/:id/velocity | velocity.Get |
| GET | /api/v1/teams/compare | comparison.Get |
| POST | /api/v1/webhook/receive | webhook.Receive |
| POST | /api/v1/webhook/github | webhook.GitHub |
| POST | /api/v1/webhook/linear | webhook.Linear |

## 5. Implementation Details

### ClickHouse Client
- Driver: `github.com/clickhouse/go-clickhouse/v2`
- Connection pooling (singleton)
- Same SQL queries as Python (compatibility)

### Cache Middleware
- Redis-first with in-memory fallback
- TTL: 300 seconds
- Skip paths: `/health`, `/docs`, `/api/v1/collectors`

### CORS
- Allow all origins (identical to Python)
- Methods: `*`, Headers: `*`

### Error Handling
- HTTP status codes
- Structured logging via log/slog
- Graceful shutdown on SIGTERM

## 6. Docker

```dockerfile
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o api ./cmd/api

FROM alpine
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/api /usr/local/bin/
CMD ["api"]
```

## 7. Testing

- Unit tests for handlers
- Integration tests with ClickHouse
- Same test coverage as Python API

## 8. Migration Path

1. Create Go project structure
2. Implement ClickHouse client
3. Add handlers (route by route)
4. Add middleware (CORS, cache)
5. Update docker-compose
6. Run parallel (Python + Go) for verification
7. Switch to Go, remove Python