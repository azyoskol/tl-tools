# Go API Migration Implementation Plan (SOLID)

> **For agentic workers:** Use superpowers:subagent-driven-development

**Goal:** Migrate Python FastAPI to Go with full parity

**Architecture:** Chi + interfaces для зависимостей (SOLID)

**Tech Stack:** Go 1.23, Chi, go-clickhouse/v2, go-redis

---

## SOLID Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Handlers ( Layer )                   │
│  └─ Зависят от Interfaces (DB, Cache, Config)          │
└─────────────────────────┬───────────────────────────────┘
                          │ depends on
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Interfaces                           │
│  ├─ Database interface                                  │
│  ├─ Cache interface                                    │
│  ├─ Config interface                                   │
│  └─ Logger interface                                   │
└─────────────────────────┬───────────────────────────────┘
                          │ implements
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 Implementations                         │
│  ├─ ClickHouse (implements Database)                   │
│  ├─ RedisCache (implements Cache)                      │
│  ├─ EnvConfig (implements Config)                      │
│  └─ Log (implements Logger)                            │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure

```
cmd/api/
  main.go                    # Entry point, wire dependencies
internal/
  config/
    config.go                # ENV config
    config_test.go           # Config tests
  database/
    interface.go             # Database interface (SOLID)
    clickhouse.go            # ClickHouse implementation
  cache/
    interface.go            # Cache interface (SOLID)
    redis.go                 # Redis + fallback implementation
  logger/
    interface.go            # Logger interface (SOLID)
    stdlog.go                # Standard logger implementation
  handlers/
    teams.go
    dashboard.go
    overview.go
    velocity.go
    comparison.go
    webhook.go
    health.go
  middleware/
    cache.go                 # Cache middleware (uses Cache interface)
    cors.go
  models/
    types.go
```

---

## Tasks

### Task 1: Interfaces (SOLID Core)

**Files:**
- Create: `internal/database/interface.go`
- Create: `internal/cache/interface.go`
- Create: `internal/logger/interface.go`
- Create: `internal/config/interface.go`

- [ ] **Step 1: Write database interface**

```go
package database

import "context"

type QueryResult []map[string]any

type Database interface {
    Query(ctx context.Context, query string, args ...any) (QueryResult, error)
    Exec(ctx context.Context, query string, args ...any) error
    Ping(ctx context.Context) error
}
```

- [ ] **Step 2: Write cache interface**

```go
package cache

import "context"

type Cache interface {
    Get(ctx context.Context, key string) (string, error)
    Set(ctx context.Context, key string, value string, ttl int) error
    Delete(ctx context.Context, key string) error
}
```

- [ ] **Step 3: Write logger interface**

```go
package logger

type Level int

const (
    DEBUG Level = iota
    INFO
    WARN
    ERROR
)

type Logger interface {
    Debug(msg string, args ...any)
    Info(msg string, args ...any)
    Warn(msg string, args ...any)
    Error(msg string, args ...any)
}
```

- [ ] **Step 4: Write config interface**

```go
package config

type Config interface {
    Get(key, defaultValue string) string
    GetInt(key string, defaultValue int) int
}
```

- [ ] **Step 5: Commit**

```bash
git add internal/database/interface.go internal/cache/interface.go internal/logger/interface.go internal/config/interface.go
git commit -m "feat: add SOLID interfaces (Database, Cache, Logger, Config)"
```

---

### Task 2: Implementations

**Files:**
- Modify: `internal/database/interface.go` → add clickhouse.go
- Modify: `internal/cache/interface.go` → add redis.go
- Modify: `internal/logger/interface.go` → add stdlog.go
- Modify: `internal/config/interface.go` → add env.go

- [ ] **Step 1: Write ClickHouse implementation**

```go
package database

import (
    "context"
    "fmt"

    "github.com/getmetraly/tl-tools/api/internal/config"
    "github.com/clickhouse/go-clickhouse/v2"
)

type clickhouseDB struct {
    client *clickhouse.Client
}

func NewClickHouse(cfg config.Config) (Database, error) {
    client, err := clickhouse.Open(&clickhouse.Options{
        Addr: []string{fmt.Sprintf("%s:%s", cfg.Get("CLICKHOUSE_HOST", "localhost"), cfg.Get("CLICKHOUSE_PORT", "9000"))},
        Settings: clickhouse.Settings{"database": cfg.Get("CLICKHOUSE_DB", "default")},
    })
    if err != nil {
        return nil, fmt.Errorf("clickhouse open: %w", err)
    }

    return &clickhouseDB{client: client}, nil
}

func (c *clickhouseDB) Query(ctx context.Context, query string, args ...any) (QueryResult, error) {
    rows, err := c.client.Query(ctx, query, args...)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var results QueryResult
    for rows.Next() {
        var m map[string]any
        if err := rows.ScanMap(&m); err != nil {
            return nil, err
        }
        results = append(results, m)
    }
    return results, rows.Err()
}

func (c *clickhouseDB) Exec(ctx context.Context, query string, args ...any) error {
    return c.client.Exec(ctx, query, args...)
}

func (c *clickhouseDB) Ping(ctx context.Context) error {
    return c.client.Ping(ctx)
}
```

- [ ] **Step 2: Write Redis cache implementation**

```go
package cache

import (
    "context"
    "sync"
    "time"

    "github.com/getmetraly/tl-tools/api/internal/config"
    "github.com/redis/go-redis/v9"
)

type redisCache struct {
    client     *redis.Client
    mu         sync.RWMutex
    inMemory   map[string]inMemEntry
    useRedis   bool
}

type inMemEntry struct {
    value   string
    expires time.Time
}

func NewRedisCache(cfg config.Config) (Cache, error) {
    client := redis.NewClient(&redis.Options{
        Addr: cfg.Get("REDIS_HOST", "redis") + ":" + cfg.Get("REDIS_PORT", "6379"),
    })

    ctx := context.Background()
    if err := client.Ping(ctx).Err(); err != nil {
        return &redisCache{client: nil, inMemory: make(map[string]inMemEntry), useRedis: false}, nil
    }

    return &redisCache{client: client, inMemory: make(map[string]inMemEntry), useRedis: true}, nil
}

func (r *redisCache) Get(ctx context.Context, key string) (string, error) {
    if r.useRedis && r.client != nil {
        return r.client.Get(ctx, key).Result()
    }

    r.mu.RLock()
    defer r.mu.RUnlock()
    if entry, ok := r.inMemory[key]; ok && entry.expires.After(time.Now()) {
        return entry.value, nil
    }
    return "", redis.Nil
}

func (r *redisCache) Set(ctx context.Context, key string, value string, ttl int) error {
    if r.useRedis && r.client != nil {
        return r.client.SetEx(ctx, key, value, time.Duration(ttl)*time.Second).Err()
    }

    r.mu.Lock()
    defer r.mu.Unlock()
    r.inMemory[key] = inMemEntry{value: value, expires: time.Now().Add(time.Duration(ttl) * time.Second)}
    return nil
}

func (r *redisCache) Delete(ctx context.Context, key string) error {
    if r.useRedis && r.client != nil {
        return r.client.Del(ctx, key).Err()
    }

    r.mu.Lock()
    defer r.mu.Unlock()
    delete(r.inMemory, key)
    return nil
}
```

- [ ] **Step 3: Write logger implementation**

```go
package logger

import "log"

type stdLogger struct {
    logger *log.Logger
}

func NewStdLogger() Logger {
    return &stdLogger{logger: log.Default()}
}

func (l *stdLogger) Debug(msg string, args ...any) {
    l.logger.Printf("[DEBUG] "+msg, args...)
}

func (l *stdLogger) Info(msg string, args ...any) {
    l.logger.Printf("[INFO] "+msg, args...)
}

func (l *stdLogger) Warn(msg string, args ...any) {
    l.logger.Printf("[WARN] "+msg, args...)
}

func (l *stdLogger) Error(msg string, args ...any) {
    l.logger.Printf("[ERROR] "+msg, args...)
}
```

- [ ] **Step 4: Write config implementation**

```go
package config

import "os"

type envConfig struct{}

func NewEnvConfig() Config {
    return &envConfig{}
}

func (e *envConfig) Get(key, defaultValue string) string {
    if v := os.Getenv(key); v != "" {
        return v
    }
    return defaultValue
}

func (e *envConfig) GetInt(key string, defaultValue int) int {
    var n int
    fmt.Sscanf(os.Getenv(key), "%d", &n)
    if n == 0 {
        return defaultValue
    }
    return n
}
```

- [ ] **Step 5: Commit**

```bash
git add internal/database/clickhouse.go internal/cache/redis.go internal/logger/stdlog.go internal/config/env.go
git commit -m "feat: add interface implementations (ClickHouse, Redis, Logger, EnvConfig)"
```

---

### Task 3: Models

**Files:**
- Create: `internal/models/types.go`

- [ ] **Step 1: Write types (same as before)**

- [ ] **Step 2: Commit**

```bash
git add internal/models/types.go
git commit -m "feat: add models"
```

---

### Task 4: Middleware (uses interfaces)

**Files:**
- Create: `internal/middleware/cache.go` (injects Cache interface)

- [ ] **Step 1: Write cache middleware**

```go
package middleware

import (
    "bytes"
    "context"
    "crypto/md5"
    "encoding/hex"
    "net/http"
    "time"

    "github.com/getmetraly/tl-tools/api/internal/cache"
)

func CacheMiddleware(cache cache.Cache) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            if r.Method != http.MethodGet {
                next.ServeHTTP(w, r)
                return
            }

            if shouldSkipCache(r.URL.Path) {
                next.ServeHTTP(w, r)
                return
            }

            key := getCacheKey(r)
            if cached, err := cache.Get(r.Context(), key); err == nil && cached != "" {
                w.Header().Set("Content-Type", "application/json")
                w.Header().Set("Access-Control-Allow-Origin", "*")
                w.Write([]byte(cached))
                return
            }

            rec := &responseRecorder{ResponseWriter: w, body: &bytes.Buffer{}}
            next.ServeHTTP(rec, r)

            if rec.Code == http.StatusOK {
                body := rec.body.String()
                cache.Set(r.Context(), key, body, 300)
                w.Header().Set("Content-Type", "application/json")
                w.Header().Set("Access-Control-Allow-Origin", "*")
                w.Write([]byte(body))
            }
        })
    }
}

func shouldSkipCache(path string) bool {
    skipPaths := []string{"/health", "/docs", "/openapi", "/api/v1/collectors"}
    for _, p := range skipPaths {
        if len(path) >= len(p) && path[:len(p)] == p {
            return true
        }
    }
    return false
}

func getCacheKey(r *http.Request) string {
    hash := md5.Sum([]byte(r.URL.RawQuery))
    return "cache:" + r.URL.Path + ":" + hex.EncodeToString(hash[:])
}

type responseRecorder struct {
    http.ResponseWriter
    body *bytes.Buffer
    Code int
}

func (rec *responseRecorder) Write(b []byte) (int, error) {
    rec.body.Write(b)
    return rec.ResponseWriter.Write(b)
}

func (rec *responseRecorder) WriteHeader(code int) {
    rec.Code = code
    rec.ResponseWriter.WriteHeader(code)
}
```

- [ ] **Step 2: Write CORS middleware**

```go
package middleware

import "net/http"

func CORS(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "*")
        w.Header().Set("Access-Control-Allow-Headers", "*")

        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }

        next.ServeHTTP(w, r)
    })
}
```

- [ ] **Step 3: Commit**

```bash
git add internal/middleware/cache.go internal/middleware/cors.go
git commit -m "feat: add middleware (Cache with interface, CORS)"
```

---

### Task 5: Handlers (inject interfaces via DI)

**Files:**
- Create: `internal/handlers/teams.go` (dependency injection)
- Create: `internal/handlers/dashboard.go`
- Create: `internal/handlers/health.go`
- Create: `internal/handlers/overview.go`
- Create: `internal/handlers/velocity.go`
- Create: `internal/handlers/comparison.go`
- Create: `internal/handlers/webhook.go`

- [ ] **Step 1: Write teams handler with DI**

```go
package handlers

import (
    "encoding/json"
    "net/http"

    "github.com/getmetraly/tl-tools/api/internal/database"
    "github.com/go-chi/chi/v5"
)

type TeamsHandler struct {
    db database.Database
}

func NewTeamsHandler(db database.Database) *TeamsHandler {
    return &TeamsHandler{db: db}
}

func (h *TeamsHandler) Routes() http.Handler {
    r := chi.NewRouter()
    r.Get("/", h.List)
    r.Get("/{team_id}", h.Get)
    return r
}

func (h *TeamsHandler) List(w http.ResponseWriter, r *http.Request) {
    rows, err := h.db.Query(r.Context(), "SELECT id, name FROM teams")
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    var teams []map[string]any
    for _, row := range rows {
        teams = append(teams, map[string]any{"id": row["id"], "name": row["name"]})
    }
    json.NewEncoder(w).Encode(teams)
}

func (h *TeamsHandler) Get(w http.ResponseWriter, r *http.Request) {
    teamID := chi.URLParam(r, "team_id")
    if teamID == "comparison" {
        http.Error(w, `{"detail":"Team not found"}`, 404)
        return
    }

    rows, err := h.db.Query(r.Context(), "SELECT id, name FROM teams WHERE id = %(team_id)s", map[string]any{"team_id": teamID})
    if err != nil || len(rows) == 0 {
        http.Error(w, `{"detail":"Team not found"}`, 404)
        return
    }

    json.NewEncoder(w).Encode(map[string]any{"id": rows[0]["id"], "name": rows[0]["name"]})
}
```

- [ ] **Step 2: Write dashboard handler**

```go
package handlers

import (
    "context"
    "encoding/json"
    "net/http"

    "github.com/getmetraly/tl-tools/api/internal/database"
)

type DashboardHandler struct {
    db database.Database
}

func NewDashboardHandler(db database.Database) *DashboardHandler {
    return &DashboardHandler{db: db}
}

func (h *DashboardHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    json.NewEncoder(w).Encode(map[string]any{
        "overview":   h.getOverview(ctx),
        "activity":   h.getActivity(ctx),
        "top_teams":  h.getTopTeams(ctx),
        "hourly":     h.getHourly(ctx),
        "top_authors": h.getTopAuthors(ctx),
    })
}

func (h *DashboardHandler) getOverview(ctx context.Context) map[string]int {
    metrics := []struct{ key, source, event, period string }{
        {"prs_opened", "git", "pr_opened", "INTERVAL 2 DAY"},
        {"tasks_blocked", "pm", "task_blocked", "INTERVAL 1 DAY"},
        {"ci_failures", "cicd", "pipeline_failed", "INTERVAL 1 HOUR"},
        {"prs_merged", "git", "pr_merged", "INTERVAL 7 DAY"},
    }

    result := make(map[string]int)
    for _, m := range metrics {
        query := "SELECT count() FROM events WHERE source_type = ? AND event_type = ? AND occurred_at > now() - ?"
        rows, _ := h.db.Query(ctx, query, m.source, m.event, m.period)
        if len(rows) > 0 {
            result[m.key] = int(rows[0]["count"].(int64))
        }
    }
    return result
}

func (h *DashboardHandler) getActivity(ctx context.Context) []map[string]any {
    rows, _ := h.db.Query(ctx, "SELECT toDate(occurred_at) as date, source_type, count() as count FROM events WHERE occurred_at > now() - INTERVAL 7 DAY GROUP BY date, source_type ORDER BY date")
    var result []map[string]any
    for _, r := range rows {
        result = append(result, map[string]any{"date": r["date"], "source_type": r["source_type"], "count": r["count"]})
    }
    return result
}

func (h *DashboardHandler) getTopTeams(ctx context.Context) []map[string]any {
    rows, _ := h.db.Query(ctx, "SELECT team_id, source_type, count() as cnt FROM events WHERE occurred_at > now() - INTERVAL 7 DAY GROUP BY team_id, source_type ORDER BY cnt DESC LIMIT 10")
    var result []map[string]any
    for _, r := range rows {
        result = append(result, map[string]any{"team_id": r["team_id"], "source_type": r["source_type"], "count": r["cnt"]})
    }
    return result
}

func (h *DashboardHandler) getHourly(ctx context.Context) []map[string]any {
    rows, _ := h.db.Query(ctx, "SELECT formatDateTime(occurred_at, '%H:00') as hour, count() as count FROM events WHERE occurred_at > now() - INTERVAL 24 HOUR GROUP BY hour ORDER BY hour")
    var result []map[string]any
    for _, r := range rows {
        result = append(result, map[string]any{"hour": r["hour"], "count": r["count"]})
    }
    return result
}

func (h *DashboardHandler) getTopAuthors(ctx context.Context) []map[string]any {
    rows, _ := h.db.Query(ctx, "SELECT JSONExtract(payload, 'author', 'String') as author, count() as count FROM events WHERE source_type = 'git' AND occurred_at > now() - INTERVAL 7 DAY GROUP BY author ORDER BY count DESC LIMIT 10")
    var result []map[string]any
    for _, r := range rows {
        author, _ := r["author"].(string)
        if author == "" {
            author = "unknown"
        }
        result = append(result, map[string]any{"author": author, "count": r["count"]})
    }
    return result
}
```

- [ ] **Step 3: Write remaining handlers (overview, velocity, comparison, webhook, health)**

- [ ] **Step 4: Commit**

```bash
git add internal/handlers/*.go
git commit -m "feat: add all handlers with dependency injection"
```

---

### Task 6: Main (Wire Dependencies)

**Files:**
- Create: `cmd/api/main.go`

- [ ] **Step 1: Write main.go with DI**

```go
package main

import (
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"

    "github.com/getmetraly/tl-tools/api/internal/cache"
    "github.com/getmetraly/tl-tools/api/internal/config"
    "github.com/getmetraly/tl-tools/api/internal/database"
    "github.com/getmetraly/tl-tools/api/internal/handlers"
    "github.com/getmetraly/tl-tools/api/internal/logger"
    "github.com/getmetraly/tl-tools/api/internal/middleware"
    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    "github.com/joho/godotenv"
)

func main() {
    godotenv.Load()

    // 1. Create config (interface)
    cfg := config.NewEnvConfig()

    // 2. Create logger (interface)
    log := logger.NewStdLogger()

    // 3. Create database (implement interface)
    db, err := database.NewClickHouse(cfg)
    if err != nil {
        log.Error("Failed to connect to ClickHouse: %v", err)
        os.Exit(1)
    }

    // 4. Create cache (implement interface)
    cache, err := cache.NewRedisCache(cfg)
    if err != nil {
        log.Warn("Failed to connect to Redis, using in-memory cache")
    }

    // 5. Create handlers with injected dependencies
    teamsHandler := handlers.NewTeamsHandler(db)
    dashboardHandler := handlers.NewDashboardHandler(db)
    healthHandler := handlers.NewHealthHandler(db)
    webhookHandler := handlers.NewWebhookHandler(db)

    // 6. Build router
    r := chi.NewRouter()
    r.Use(middleware.RequestID)
    r.Use(middleware.RealIP)
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    r.Use(middleware.CORS)

    // Root
    r.Get("/", healthHandler.Root)

    // Health (no cache)
    r.Route("/health", func(r chi.Router) {
        r.Get("/api", healthHandler.API)
        r.Get("/clickhouse", healthHandler.ClickHouse)
    })

    // API v1 with cache middleware
    r.Route("/api/v1", func(r chi.Router) {
        r.Use(middleware.CacheMiddleware(cache))
        r.Mount("/teams", teamsHandler.Routes())
        r.Get("/dashboard", dashboardHandler.ServeHTTP)
    })

    // Webhooks (no cache)
    r.Post("/api/v1/webhook/receive", webhookHandler.Receive)

    // Start server
    port := cfg.Get("PORT", "8000")
    log.Info("Starting server on :%s", port)

    srv := &http.Server{Addr: ":" + port, Handler: r}

    go func() {
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Error("ListenAndServe: %v", err)
        }
    }()

    <-make(chan os.Signal, 1)
    log.Info("Shutting down server...")
    srv.Close()
}
```

- [ ] **Step 2: Commit**

```bash
git add cmd/api/main.go
git commit -m "feat: wire all dependencies in main (SOLID DI)"
```

---

### Task 7: go.mod

**Files:**
- Create: `go.mod`
- Create: `go.sum`

- [ ] **Step 1: Initialize and add dependencies**

```bash
cd /home/zubarev/sources/tl-tools
go mod init github.com/getmetraly/tl-tools/api
go get github.com/go-chi/chi/v5
go get github.com/clickhouse/go-clickhouse/v2
go get github.com/redis/go-redis/v9
go get github.com/joho/godotenv
```

- [ ] **Step 2: Commit**

```bash
git add go.mod go.sum
git commit -m "chore: add go.mod with dependencies"
```

---

### Task 8: Docker

**Files:**
- Create: `cmd/api/Dockerfile`

- [ ] **Step 1: Write Dockerfile**

```dockerfile
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o api ./cmd/api

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/api /usr/local/bin/
CMD ["api"]
```

- [ ] **Step 2: Modify docker-compose.yaml**

- [ ] **Step 3: Commit**

```bash
git add cmd/api/Dockerfile docker-compose.yaml
git commit -m "feat: add Docker for Go API"
```

---

## SOLID Summary

| Principle | How Applied |
|-----------|--------------|
| **Single Responsibility** | Each file has one job (handler, cache, db) |
| **Open/Closed** | Add new handlers without modifying existing |
| **Liskov Substitution** | Swap ClickHouse ↔ Mock for testing |
| **Interface Segregation** | Small interfaces (Database, Cache, Logger) |
| **Dependency Inversion** | Handlers depend on interfaces, not implementations |

---

**Plan saved to:** `docs/superpowers/plans/2026-04-30-go-api-migration-plan.md`

**Execution?** (Subagent-Driven или Inline)