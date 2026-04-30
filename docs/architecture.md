# Architecture

## Overview

Metraly — это API для сбора и анализа метрик команд разработки. Система собирает события из Git, PM-инструментов и CI/CD, агрегирует их и предоставляет дашборд.

## Architecture Layers

```
┌─────────────────────────────────────────────┐
│              UI (React)                     │  port 3000
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│           API Server (Go/Chi)              │  port 8000
│  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Handlers    │  │ Middleware          │ │
│  │ - HTTP validation                  │ │
│  │ - Request/response marshaling      │ │
│  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  biz (Services) │    │  Cache (Redis)  │
│                  │    │                  │
│ - DashboardSvc   │    │  Response cache  │
│ - TeamsSvc       │    │  5 min TTL       │
└──────────────────┘    └──────────────────┘
          │
          ▼
┌──────────────────┐
│  repo (Data)     │
│                  │
│ - EventRepo      │
│ - TeamRepo       │
└──────────────────┘
          │
          ▼
┌──────────────────┐
│  Database        │
│                  │
│  ClickHouse      │
│  (HTTP client)   │
└──────────────────┘
```

## Directory Structure

```
internal/pkg/
├── biz/                    # Business logic layer
│   ├── dashboard.go       # Dashboard metrics logic
│   ├── dashboard_test.go # Unit tests with mocks
│   └── repo.go           # Repository interface
│
├── cache/                 # Caching layer
│   ├── interface.go      # Cache interface
│   ├── redis.go          # Redis implementation
│   └── cache_test.go     # Tests
│
├── config/                # Configuration
│   ├── interface.go      # Config interface
│   ├── env.go            # Env vars implementation
│   └── config_test.go    # Tests
│
├── database/              # Database layer
│   ├── interface.go      # Database interface
│   ├── clickhouse.go     # ClickHouse HTTP client
│   └── ... (tests)
│
├── handlers/             # HTTP layer
│   ├── dashboard.go      # Dashboard endpoint
│   ├── health.go         # Health checks
│   ├── teams.go          # Team endpoints
│   ├── velocity.go       # Velocity metrics
│   ├── comparison.go     # Team comparison
│   ├── webhook.go       # Event ingestion
│   └── *_test.go
│
├── middleware/            # HTTP middleware
│   ├── cors.go           # CORS headers
│   ├── cache.go          # Response caching
│   └── *_test.go
│
├── logger/                # Logging
│   ├── interface.go
│   └── stdlog.go
│
├── models/                # Shared types
│   └── types.go
│
└── repo/                  # Repository implementations
    ├── interface.go      # Repo interfaces
    └── event_ch.go       # ClickHouse implementation
```

## Key Components

### 1. Handlers (HTTP Layer)

Handlers занимаются только:
- Валидацией входящих запросов
- Маршалингом/анмаршалингом JSON
- Вызовом соответствующих сервисов

**Пример**: `DashboardHandler` принимает HTTP запрос и вызывает `biz.DashboardService.GetDashboard()`

### 2. Biz (Business Logic)

Сервисы содержат бизнес-логику:
- Формирование запросов к репозиторию
- Преобразование данных
- Обработка ошибок

**Пример**: `DashboardService` объединяет 5 метрик (overview, activity, top_teams, hourly, top_authors)

### 3. Repo (Data Access)

Репозитории инкапсулируют работу с БД:
- SQL-запросы
- Преобразование результатов в доменные типы

**Пример**: `ClickHouseEventRepo` реализует `EventRepo` интерфейс для ClickHouse

### 4. Database

Низкоуровневый доступ к БД через HTTP API ClickHouse (порт 8123).

## Data Flow

### GET /api/v1/dashboard

```
1. Router matches route to DashboardHandler
2. Handler extracts context from request
3. Handler calls svc.GetDashboard(ctx)
4. Service orchestrates:
   - GetOverview(ctx) → 4 count queries
   - GetActivity(ctx) → aggregation query
   - GetTopTeams(ctx) → top teams query
   - GetHourly(ctx) → hourly distribution
   - GetTopAuthors(ctx) → author rankings
5. Service maps raw DB results to typed structs
6. Handler marshals response to JSON
7. Middleware may cache response in Redis
```

## Graceful Shutdown

API сервер поддерживает graceful shutdown:

```go
srv := &http.Server{Addr: addr, Handler: r}

go func() {
    log.Info("listening on %s", addr)
    srv.ListenAndServe()
}()

quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit

log.Info("shutting down...")
ctx, cancel := context.WithTimeout(30*time.Second)
defer cancel()
srv.Shutdown(ctx)
```

## Testing

### Unit Tests

- **biz/** — мокаем `EventRepo` интерфейс
- **handlers** — мокаем `Database` интерфейс
- **cache** — используем in-memory реализацию

### Test Coverage

```
make test
# 19 tests pass
```

## Docker Services

| Service   | Image                        | Ports     |
|-----------|------------------------------|-----------|
| api       | metraly-api (built locally) | 8000      |
| clickhouse| clickhouse/clickhouse:23.8  | 8123, 9000|
| redis     | redis:7-alpine              | 6379      |
| ui        | metraly-ui (built locally)  | 3000      |

## Makefile Commands

```bash
# Build & Run
make build              # Build Go binary
make run                # Run locally
make test               # Run tests

# Docker
make docker-up          # Start all services
make docker-down        # Stop all services
make docker-restart     # Restart all services

# Debugging
make health             # Check API health
make dashboard          # Check dashboard data
make docker-logs        # Show logs
make docker-ps          # Show containers
```

## Configuration

Через environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| CLICKHOUSE_HOST | localhost | ClickHouse host |
| CLICKHOUSE_PORT | 8123 | HTTP port |
| REDIS_HOST | redis | Redis host |
| REDIS_PORT | 6379 | Redis port |
| PORT | 8000 | API port |

## Dependencies

- **Go**: chi/v5 (router), clickhouse-go (driver via HTTP)
- **UI**: React, Recharts, Axios
- **Infra**: ClickHouse 23.8, Redis 7, Nginx

## Known Issues

- Даты и UUID возвращаются как пустые строки (нужно улучшить JSON parsing для Date/UUID типов)
- Тестовые данные минимальные

## Future Improvements

1. Добавить больше тестов для repo слоя
2. Улучшить парсинг типов ClickHouse
3. Добавить OpenAPI спецификацию
4. Добавить аутентификацию
5. Улучшить error handling
6. Добавить tracing (OpenTelemetry)