# Go API Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Python FastAPI to Go with full parity

**Architecture:** Chi router + go-clickhouse driver, Redis cache, identical SQL queries

**Tech Stack:** Go 1.23, Chi, go-clickhouse/v2, go-redis

---

## File Structure

```
cmd/api/
  main.go                    # Entry point
internal/
  config/
    config.go                # ENV config
  clickhouse/
    client.go                # ClickHouse queries
  handlers/
    teams.go                 # Teams endpoints
    dashboard.go             # Dashboard endpoint
    overview.go              # Team overview/activity/insights
    velocity.go              # Velocity endpoint
    comparison.go            # Team comparison endpoint
    webhook.go               # Webhook endpoints
    health.go                # Health endpoints
  middleware/
    cache.go                 # Redis/in-memory cache
    cors.go                  # CORS middleware
  models/
    types.go                 # Request/Response structs
```

---

## Tasks

### Task 1: Project Setup

**Files:**
- Create: `cmd/api/main.go`
- Create: `go.mod`

- [ ] **Step 1: Initialize Go module**

```bash
cd /home/zubarev/sources/tl-tools
mkdir -p cmd/api internal/config internal/clickhouse internal/handlers internal/middleware internal/models
cd cmd/api
go mod init github.com/azyoskol/tl-tools/api
```

- [ ] **Step 2: Add dependencies**

```bash
go get github.com/go-chi/chi/v5
go get github.com/clickhouse/go-clickhouse/v2
go get github.com/redis/go-redis/v9
go get github.com/joho/godotenv
```

- [ ] **Step 3: Write main.go**

```go
package main

import (
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"

    "github.com/azyoskol/tl-tools/api/internal/config"
    "github.com/azyoskol/tl-tools/api/internal/handlers"
    "github.com/azyoskol/tl-tools/api/internal/middleware"
    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    "github.com/joho/godotenv"
)

func main() {
    godotenv.Load()

    r := chi.NewRouter()
    r.Use(middleware.RequestID)
    r.Use(middleware.RealIP)
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    r.Use(middleware.CORS)

    r.Get("/", handlers.Root)
    rMount(r)

    port := config.Get("PORT", "8000")
    log.Printf("Starting server on :%s", port)

    srv := &http.Server{
        Addr:         ":" + port,
        Handler:      r,
    }

    go func() {
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("ListenAndServe: %v", err)
        }
    }()

    ch := make(chan os.Signal, 1)
    signal.Notify(ch, syscall.SIGINT, syscall.SIGTERM)
    <-ch

    log.Println("Shutting down server...")
    srv.Close()
}

func rMount(r *chi.Mux) {
    r.Route("/api/v1", func(r chi.Router) {
        r.Use(middleware.CacheMiddleware)
        r.Mount("/teams", handlers.TeamsRouter())
        r.Mount("/dashboard", handlers.DashboardRouter())
    })

    r.Route("/health", func(r chi.Router) {
        r.Get("/api", handlers.HealthAPI)
        r.Get("/clickhouse", handlers.HealthClickHouse)
    })

    r.Post("/api/v1/webhook/receive", handlers.WebhookReceive)
}
```

- [ ] **Step 4: Commit**

```bash
git add cmd/ internal/ go.mod go.sum
git commit -m "feat: initial Go API structure"
```

---

### Task 2: Config

**Files:**
- Create: `internal/config/config.go`

- [ ] **Step 1: Write config.go**

```go
package config

import (
    "os"
)

func Get(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}

func GetInt(key string, defaultValue int) int {
    if value := os.Getenv(key); value != "" {
        var intVal int
        for _, c := range value {
            if c >= '0' && c <= '9' {
                intVal = intVal*10 + int(c-'0')
            }
        }
        return intVal
    }
    return defaultValue
}

func ClickHouseHost() string {
    return Get("CLICKHOUSE_HOST", "localhost")
}

func ClickHousePort() string {
    return Get("CLICKHOUSE_PORT", "9000")
}

func ClickHouseDB() string {
    return Get("CLICKHOUSE_DB", "default")
}

func RedisHost() string {
    return Get("REDIS_HOST", "redis")
}

func RedisPort() string {
    return Get("REDIS_PORT", "6379")
}
```

- [ ] **Step 2: Commit**

```bash
git add internal/config/config.go
git commit -m "feat: add config module"
```

---

### Task 3: ClickHouse Client

**Files:**
- Create: `internal/clickhouse/client.go`

- [ ] **Step 1: Write client.go**

```go
package clickhouse

import (
    "context"
    "fmt"

    "github.com/azyoskol/tl-tools/api/internal/config"
    "github.com/clickhouse/go-clickhouse/v2"
    "github.com/clickhouse/go-clickhouse/v2/conn"
)

var client *clickhouse.Client

func Init() error {
    var err error
    client, err = clickhouse.Open(&clickhouse.Options{
        Addr: []string{
            fmt.Sprintf("%s:%s", config.ClickHouseHost(), config.ClickHousePort()),
        },
        Settings: clickhouse.Settings{
            "database": config.ClickHouseDB(),
        },
        DialTimeout: 5e9,
    })
    if err != nil {
        return fmt.Errorf("clickhouse open: %w", err)
    }

    if err := client.Ping(context.Background()); err != nil {
        return fmt.Errorf("clickhouse ping: %w", err)
    }

    return nil
}

func Get() *clickhouse.Client {
    return client
}

func Query(ctx context.Context, query string, args ...interface{}) ([]map[string]any, error) {
    rows, err := client.Query(ctx, query, args...)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var results []map[string]any
    for rows.Next() {
        var m map[string]any
        if err := rows.ScanMap(&m); err != nil {
            return nil, err
        }
        results = append(results, m)
    }

    return results, rows.Err()
}

func Exec(ctx context.Context, query string, args ...interface{}) error {
    return client.Exec(ctx, query, args...)
}
```

- [ ] **Step 2: Commit**

```bash
git add internal/clickhouse/client.go
git commit -m "feat: add ClickHouse client"
```

---

### Task 4: Models

**Files:**
- Create: `internal/models/types.go`

- [ ] **Step 1: Write types.go**

```go
package models

type Team struct {
    ID   string `json:"id"`
    Name string `json:"name"`
}

type DashboardResponse struct {
    Overview   Overview       `json:"overview"`
    Activity   []Activity     `json:"activity"`
    TopTeams   []TeamActivity `json:"top_teams"`
    Hourly     []Hourly       `json:"hourly"`
    TopAuthors []Author       `json:"top_authors"`
}

type Overview struct {
    PRsOpened     int `json:"prs_opened"`
    PRsMerged     int `json:"prs_merged"`
    TasksBlocked  int `json:"tasks_blocked"`
    CIFailures    int `json:"ci_failures"`
}

type Activity struct {
    Date       string `json:"date"`
    SourceType string `json:"source_type"`
    Count      int    `json:"count"`
}

type TeamActivity struct {
    TeamID     string `json:"team_id"`
    SourceType string `json:"source_type"`
    Count      int    `json:"count"`
}

type Hourly struct {
    Hour  string `json:"hour"`
    Count int    `json:"count"`
}

type Author struct {
    Author string `json:"author"`
    Count  int    `json:"count"`
}

type TeamOverview struct {
    TeamID              string `json:"team_id"`
    Name                string `json:"name"`
    PRsAwaitingReview  int    `json:"prs_awaiting_review"`
    PRsMerged           int    `json:"prs_merged"`
    BlockedTasks        int    `json:"blocked_tasks"`
    CI FailuresLastHour int    `json:"ci_failures_last_hour"`
}

type TeamActivityResponse struct {
    Data []Activity `json:"data"`
}

type TeamInsights struct {
    Insights []Insight `json:"insights"`
}

type Insight struct {
    Type    string `json:"type"`
    Message string `json:"message"`
}

type VelocityResponse struct {
    CycleTime []CycleMetric `json:"cycle_time"`
    LeadTime  []LeadMetric  `json:"lead_time"`
}

type CycleMetric struct {
    Date  string `json:"date"`
    Tasks int    `json:"tasks"`
}

type LeadMetric struct {
    Date  string `json:"date"`
    Tasks int    `json:"tasks"`
}

type ComparisonResponse struct {
    Teams []TeamCompare `json:"teams"`
}

type TeamCompare struct {
    TeamID  string `json:"team_id"`
    Name    string `json:"name"`
    PRs     int    `json:"prs"`
    Tasks   int    `json:"tasks"`
    CIRuns  int    `json:"ci_runs"`
}

type WebhookRequest struct {
    Source    string         `json:"source"`
    EventType string         `json:"event_type"`
    TeamID    string         `json:"team_id"`
    Payload   map[string]any `json:"payload"`
}

type WebhookResponse struct {
    Status   string `json:"status"`
    Received string `json:"received"`
}
```

- [ ] **Step 2: Commit**

```bash
git add internal/models/types.go
git commit -m "feat: add models"
```

---

### Task 5: Middleware - Cache

**Files:**
- Create: `internal/middleware/cache.go`

- [ ] **Step 1: Write cache.go**

```go
package middleware

import (
    "bytes"
    "crypto/md5"
    "encoding/hex"
    "io"
    "net/http"
    "time"

    "github.com/azyoskol/tl-tools/api/internal/config"
    "github.com/redis/go-redis/v9"
)

var redisClient *redis.Client
var inMemoryCache = make(map[string]cacheEntry)

type cacheEntry struct {
    data     string
    expires  time.Time
}

func InitCache() {
    redisClient = redis.NewClient(&redis.Options{
        Addr: config.RedisHost() + ":" + config.RedisPort(),
    })
}

func CacheMiddleware(next http.Handler) http.Handler {
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
        cached := getFromCache(key)
        if cached != "" {
            w.Header().Set("Content-Type", "application/json")
            w.Header().Set("Access-Control-Allow-Origin", "*")
            w.Write([]byte(cached))
            return
        }

        rec := &responseRecorder{ResponseWriter: w, body: &bytes.Buffer{}}
        next.ServeHTTP(rec, r)

        if rec.Code == http.StatusOK {
            body := rec.body.String()
            setCache(key, body)
            w.Header().Set("Content-Type", "application/json")
            w.Header().Set("Access-Control-Allow-Origin", "*")
            w.Write([]byte(body))
        }
    })
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

func getFromCache(key string) string {
    if redisClient != nil {
        if val, err := redisClient.Get(r.Context(), key).Result(); err == nil {
            return val
        }
    }

    if entry, ok := inMemoryCache[key]; ok && entry.expires.After(time.Now()) {
        return entry.data
    }
    return ""
}

func setCache(key, data string) {
    if redisClient != nil {
        redisClient.SetEx(r.Context(), key, data, 300*time.Second)
    } else {
        inMemoryCache[key] = cacheEntry{data: data, expires: time.Now().Add(300 * time.Second)}
    }
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

- [ ] **Step 2: Fix import**

Replace `r.Context()` with proper context import.

- [ ] **Step 3: Commit**

```bash
git add internal/middleware/cache.go
git commit -m "feat: add cache middleware"
```

---

### Task 6: Handlers - Health

**Files:**
- Create: `internal/handlers/health.go`

- [ ] **Step 1: Write health.go**

```go
package handlers

import (
    "encoding/json"
    "net/http"

    "github.com/azyoskol/tl-tools/api/internal/clickhouse"
)

func Root(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode(map[string]string{
        "message": "Team Dashboard API",
        "version": "1.0.0",
    })
}

func HealthAPI(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode(map[string]string{
        "status": "ok",
    })
}

func HealthClickHouse(w http.ResponseWriter, r *http.Request) {
    if err := clickhouse.Get().Ping(r.Context()); err != nil {
        http.Error(w, `{"status":"error","message":"`+err.Error()+`"}`, 503)
        return
    }
    json.NewEncoder(w).Encode(map[string]string{
        "status": "ok",
    })
}
```

- [ ] **Step 2: Commit**

```bash
git add internal/handlers/health.go
git commit -m "feat: add health handlers"
```

---

### Task 7: Handlers - Teams

**Files:**
- Create: `internal/handlers/teams.go`

- [ ] **Step 1: Write teams.go**

```go
package handlers

import (
    "encoding/json"
    "net/http"

    "github.com/azyoskol/tl-tools/api/internal/clickhouse"
    "github.com/go-chi/chi/v5"
)

func TeamsRouter() http.Handler {
    r := chi.NewRouter()
    r.Get("/", listTeams)
    r.Get("/{team_id}", getTeam)
    return r
}

func listTeams(w http.ResponseWriter, r *http.Request) {
    rows, err := clickhouse.Query(r.Context(), "SELECT id, name FROM teams")
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    var teams []map[string]any
    for _, row := range rows {
        teams = append(teams, map[string]any{
            "id":   row["id"],
            "name": row["name"],
        })
    }
    json.NewEncoder(w).Encode(teams)
}

func getTeam(w http.ResponseWriter, r *http.Request) {
    teamID := chi.URLParam(r, "team_id")
    if teamID == "comparison" {
        http.Error(w, `{"detail":"Team not found"}`, 404)
        return
    }

    rows, err := clickhouse.Query(r.Context(), "SELECT id, name FROM teams WHERE id = %(team_id)s", map[string]any{"team_id": teamID})
    if err != nil || len(rows) == 0 {
        http.Error(w, `{"detail":"Team not found"}`, 404)
        return
    }

    json.NewEncoder(w).Encode(map[string]any{
        "id":   rows[0]["id"],
        "name": rows[0]["name"],
    })
}
```

- [ ] **Step 2: Commit**

```bash
git add internal/handlers/teams.go
git commit -m "feat: add teams handlers"
```

---

### Task 8: Handlers - Dashboard

**Files:**
- Create: `internal/handlers/dashboard.go`

- [ ] **Step 1: Write dashboard.go**

```go
package handlers

import (
    "encoding/json"
    "net/http"
    "strings"

    "github.com/azyoskol/tl-tools/api/internal/clickhouse"
)

func DashboardRouter() http.Handler {
    return http.HandlerFunc(getDashboard)
}

func getDashboard(w http.ResponseWriter, r *http.Request) {
    overview := getOverview(r.Context())
    activity := getActivity(r.Context())
    topTeams := getTopTeams(r.Context())
    hourly := getHourly(r.Context())
    topAuthors := getTopAuthors(r.Context())

    json.NewEncoder(w).Encode(map[string]any{
        "overview":   overview,
        "activity":   activity,
        "top_teams":  topTeams,
        "hourly":     hourly,
        "top_authors": topAuthors,
    })
}

func getOverview(ctx interface{ Context() interface{} }) map[string]int {
    metrics := map[string]struct {
        source string
        event  string
        period string
    }{
        "prs_opened":    {"git", "pr_opened", "INTERVAL 2 DAY"},
        "tasks_blocked": {"pm", "task_blocked", "INTERVAL 1 DAY"},
        "ci_failures":   {"cicd", "pipeline_failed", "INTERVAL 1 HOUR"},
        "prs_merged":    {"git", "pr_merged", "INTERVAL 7 DAY"},
    }

    result := make(map[string]int)
    for key, m := range metrics {
        query := "SELECT count() FROM events WHERE source_type = ? AND event_type = ? AND occurred_at > now() - ?"
        rows, err := clickhouse.Query(ctx, query, m.source, m.event, m.period)
        if err == nil && len(rows) > 0 {
            result[key] = int(rows[0]["count"].(int64))
        } else {
            result[key] = 0
        }
    }
    return result
}

func getActivity(ctx interface{ Context() interface{} }) []map[string]any {
    query := "SELECT toDate(occurred_at) as date, source_type, count() as count FROM events WHERE occurred_at > now() - INTERVAL 7 DAY GROUP BY date, source_type ORDER BY date"
    rows, _ := clickhouse.Query(ctx, query)
    var activity []map[string]any
    for _, r := range rows {
        activity = append(activity, map[string]any{
            "date":        r["date"],
            "source_type": r["source_type"],
            "count":       r["count"],
        })
    }
    return activity
}

func getTopTeams(ctx interface{ Context() interface{} }) []map[string]any {
    query := "SELECT team_id, source_type, count() as cnt FROM events WHERE occurred_at > now() - INTERVAL 7 DAY GROUP BY team_id, source_type ORDER BY cnt DESC LIMIT 10"
    rows, _ := clickhouse.Query(ctx, query)
    var teams []map[string]any
    for _, r := range rows {
        teams = append(teams, map[string]any{
            "team_id":     r["team_id"],
            "source_type": r["source_type"],
            "count":       r["cnt"],
        })
    }
    return teams
}

func getHourly(ctx interface{ Context() interface{} }) []map[string]any {
    query := "SELECT formatDateTime(occurred_at, '%H:00') as hour, count() as count FROM events WHERE occurred_at > now() - INTERVAL 24 HOUR GROUP BY hour ORDER BY hour"
    rows, _ := clickhouse.Query(ctx, query)
    var hourly []map[string]any
    for _, r := range rows {
        hourly = append(hourly, map[string]any{
            "hour":  r["hour"],
            "count": r["count"],
        })
    }
    return hourly
}

func getTopAuthors(ctx interface{ Context() interface{} }) []map[string]any {
    query := "SELECT JSONExtract(payload, 'author', 'String') as author, count() as count FROM events WHERE source_type = 'git' AND occurred_at > now() - INTERVAL 7 DAY GROUP BY author ORDER BY count DESC LIMIT 10"
    rows, _ := clickhouse.Query(ctx, query)
    var authors []map[string]any
    for _, r := range rows {
        author, _ := r["author"].(string)
        if author == "" {
            author = "unknown"
        }
        authors = append(authors, map[string]any{
            "author": author,
            "count":  r["count"],
        })
    }
    return authors
}
```

- [ ] **Step 2: Fix context type**

Replace `interface{ Context() interface{} }` with `context.Context`

- [ ] **Step 3: Commit**

```bash
git add internal/handlers/dashboard.go
git commit -m "feat: add dashboard handler"
```

---

### Task 9: Handlers - Overview, Velocity, Comparison, Webhook

**Files:**
- Create: `internal/handlers/overview.go`
- Create: `internal/handlers/velocity.go`
- Create: `internal/handlers/comparison.go`
- Create: `internal/handlers/webhook.go`

Implement remaining handlers following patterns from Task 7-8.

- [ ] **Commit each handler**

```bash
git add internal/handlers/overview.go internal/handlers/velocity.go internal/handlers/comparison.go internal/handlers/webhook.go
git commit -m "feat: add remaining handlers"
```

---

### Task 10: Docker

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

Replace Python API service with Go service.

- [ ] **Step 3: Commit**

```bash
git add cmd/api/Dockerfile docker-compose.yaml
git commit -m "feat: add Go API Docker"
```

---

## Execution

**Plan complete and saved to `docs/superpowers/plans/2026-04-30-go-api-migration-plan.md`**

Two execution options:

1. **Subagent-Driven (recommended)** - dispatch fresh subagent per task, review between tasks
2. **Inline Execution** - execute tasks in this session with checkpoints

Which approach?