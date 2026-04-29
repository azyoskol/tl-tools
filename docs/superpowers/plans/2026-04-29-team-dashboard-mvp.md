# Team Dashboard MVP Implementation Plan

**Goal:** Working dashboard with basic metrics from GitHub/GitLab, Jira/Linear, CI/CD

**Architecture:** Event-driven with Go collectors pushing to ClickHouse, Python FastAPI serving React UI

**Tech Stack:** React, FastAPI (Python), Go, ClickHouse, Docker, Kubernetes/Helm

---

## File Structure

```
team-dashboard/
├── collectors/
│   ├── git/
│   │   ├── main.go
│   │   ├── adapters/
│   │   │   ├── github.go
│   │   │   └── gitlab.go
│   │   ├── config.yaml
│   │   └── Dockerfile
│   ├── pm/
│   │   ├── main.go
│   │   ├── adapters/
│   │   │   ├── jira.go
│   │   │   └── linear.go
│   │   ├── config.yaml
│   │   └── Dockerfile
│   ├── cicd/
│   │   ├── main.go
│   │   ├── adapters/
│   │   │   ├── github_actions.go
│   │   │   └── gitlab_ci.go
│   │   ├── config.yaml
│   │   └── Dockerfile
│   └── metrics/
│       ├── main.go
│       ├── adapters/
│       │   └── prometheus.go
│       ├── config.yaml
│       └── Dockerfile
├── api/
│   ├── main.py
│   ├── routes/
│   │   ├── teams.py
│   │   ├── overview.py
│   │   └── health.py
│   ├── clickhouse/
│   │   └── client.py
│   ├── requirements.txt
│   └── Dockerfile
├── ui/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── TeamSelector.tsx
│   │   │   ├── Overview.tsx
│   │   │   ├── ActivityChart.tsx
│   │   │   └── AttentionItems.tsx
│   │   └── api/
│   │       └── client.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── clickhouse/
│   └── schema.sql
├── docker-compose.yaml
└── helm/
    └── team-dashboard/
        ├── Chart.yaml
        ├── values.yaml
        └── templates/
            ├── api-deployment.yaml
            ├── ui-deployment.yaml
            ├── collectors/
            └── clickhouse-statefulset.yaml
```

---

## Task 1: ClickHouse Schema

**Files:**
- Create: `clickhouse/schema.sql`

- [ ] **Step 1: Create schema file**

```sql
-- Team Dashboard MVP - ClickHouse Schema

-- Raw events table
CREATE TABLE IF NOT EXISTS events (
    id UUID,
    source_type Enum8('git', 'pm', 'cicd', 'metrics'),
    event_type String,
    team_id UUID,
    project_id Nullable(UUID),
    payload JSON,
    occurred_at DateTime64(3),
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(occurred_at)
ORDER BY (team_id, source_type, occurred_at);

-- Daily aggregates materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_aggregates
ENGINE = SummingMergeTree()
ORDER BY (team_id, date, source_type, event_type)
AS SELECT
    team_id,
    toDate(occurred_at) AS date,
    source_type,
    event_type,
    count() AS count
FROM events
GROUP BY team_id, date, source_type, event_type;

-- PR metrics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS pr_metrics
ENGINE = MergeTree()
ORDER BY (team_id, pr_id)
AS SELECT
    team_id,
    payload['pr_id'] AS pr_id,
    payload['author'] AS author,
    occurred_at AS created_at,
    maxIf(occurred_at, event_type = 'pr_merged') AS merged_at,
    maxIf(occurred_at, event_type = 'pr_reviewed') AS first_review_at,
    countIf(event_type = 'pr_review_request') AS review_requests,
    payload['lines_added'] + payload['lines_removed'] AS pr_size
FROM events
WHERE source_type = 'git'
GROUP BY team_id, pr_id;

-- Cycle metrics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS cycle_metrics
ENGINE = MergeTree()
ORDER BY (team_id, task_id)
AS SELECT
    team_id,
    payload['task_id'] AS task_id,
    minIf(occurred_at, event_type = 'task_in_progress') AS started_at,
    minIf(occurred_at, event_type = 'task_done') AS completed_at,
    payload['story_points'] AS story_points
FROM events
WHERE source_type = 'pm'
GROUP BY team_id, task_id;

-- Team workload materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS team_workload
ENGINE = MergeTree()
ORDER BY (team_id, user_id, date)
AS SELECT
    team_id,
    payload['assignee'] AS user_id,
    toDate(occurred_at) AS date,
    countIf(event_type = 'task_created') AS tasks_created,
    countIf(event_type = 'task_done') AS tasks_completed,
    countIf(event_type = 'task_blocked') AS tasks_blocked,
    sumIf(payload['story_points'], event_type = 'task_done') AS points_completed
FROM events
WHERE source_type = 'pm'
GROUP BY team_id, user_id, date;

-- CI/CD health materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS cicd_health
ENGINE = SummingMergeTree()
ORDER BY (team_id, pipeline_id, date)
AS SELECT
    team_id,
    payload['pipeline_id'] AS pipeline_id,
    payload['project'] AS project,
    toDate(occurred_at) AS date,
    countIf(event_type = 'pipeline_success') AS success_count,
    countIf(event_type = 'pipeline_failed') AS failed_count,
    sumIf(payload['duration'], event_type = 'pipeline_completed') AS total_duration,
    avgIf(payload['duration'], event_type = 'pipeline_completed') AS avg_duration
FROM events
WHERE source_type = 'cicd'
GROUP BY team_id, pipeline_id, project, date;

-- Realtime alerts materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS realtime_alerts
ENGINE = MergeTree()
ORDER BY (team_id, alert_type, created_at)
AS SELECT
    team_id,
    event_type AS alert_type,
    payload AS details,
    occurred_at AS created_at
FROM events
WHERE event_type IN ('pr_stale', 'task_overdue', 'ci_failed', 'task_blocked');

-- Dead letter queue for failed events
CREATE TABLE IF NOT EXISTS events_dlq (
    id UUID,
    source_type Enum8('git', 'pm', 'cicd', 'metrics'),
    event_type String,
    team_id UUID,
    payload JSON,
    occurred_at DateTime64(3),
    error_message String,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (team_id, created_at);
```

- [ ] **Step 2: Commit**

```bash
git add clickhouse/schema.sql
git commit -m "feat: add ClickHouse schema with materialized views"
```

---

## Task 2: Git Collector (Go)

**Files:**
- Create: `collectors/git/main.go`
- Create: `collectors/git/adapters/github.go`
- Create: `collectors/git/adapters/gitlab.go`
- Create: `collectors/git/config.yaml`
- Create: `collectors/git/Dockerfile`

- [ ] **Step 1: Create main.go**

```go
package main

import (
    "context"
    "encoding/json"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/ClickHouse/clickhouse-go/v2"
    "github.com/google/uuid"
)

type Config struct {
    ClickHouse struct {
        Host string `yaml:"host"`
        Port int    `yaml:"port"`
    } `yaml:"clickhouse"`
    Webhook struct {
        Port int `yaml:"port"`
    } `yaml:"webhook"`
    Teams []struct {
        ID       string `yaml:"id"`
        Name     string `yaml:"name"`
        Sources  []struct {
            Type   string `yaml:"type"`
            Config map[string]string `yaml:"config"`
        } `yaml:"sources"`
    } `yaml:"teams"`
}

type Event struct {
    ID          string          `json:"id"`
    SourceType  string          `json:"source_type"`
    EventType   string          `json:"event_type"`
    TeamID      string          `json:"team_id"`
    ProjectID   *string         `json:"project_id"`
    Payload     json.RawMessage `json:"payload"`
    OccurredAt  time.Time       `json:"occurred_at"`
}

var config Config

func main() {
    loadConfig(&config)

    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    go startWebhookServer(ctx)

    sigCh := make(chan os.Signal, 1)
    signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
    <-sigCh

    log.Println("Shutting down...")
}

func loadConfig(cfg *Config) {
    data, err := os.ReadFile("config.yaml")
    if err != nil {
        log.Fatalf("Failed to read config: %v", err)
    }
    if err := yaml.Unmarshal(data, cfg); err != nil {
        log.Fatalf("Failed to parse config: %v", err)
    }
}

func startWebhookServer(ctx context.Context) {
    http.HandleFunc("/webhook/github", handleGitHubWebhook)
    http.HandleFunc("/webhook/gitlab", handleGitLabWebhook)

    addr := fmt.Sprintf(":%d", config.Webhook.Port)
    log.Printf("Starting webhook server on %s", addr)
    if err := http.ListenAndServe(addr, nil); err != nil {
        log.Printf("Server error: %v", err)
    }
}

func handleGitHubWebhook(w http.ResponseWriter, r *http.Request) {
    var payload map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }

    eventType := r.Header.Get("X-GitHub-Event")
    teamID := findTeamBySource("github")

    event := Event{
        ID:         uuid.New().String(),
        SourceType: "git",
        EventType:  eventType,
        TeamID:     teamID,
        Payload:    mustMarshal(payload),
        OccurredAt: time.Now(),
    }

    saveEvent(event)
    w.WriteHeader(http.StatusOK)
}

func handleGitLabWebhook(w http.ResponseWriter, r *http.Request) {
    var payload map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }

    eventType := r.Header.Get("X-Gitlab-Event")
    teamID := findTeamBySource("gitlab")

    event := Event{
        ID:         uuid.New().String(),
        SourceType: "git",
        EventType:  eventType,
        TeamID:     teamID,
        Payload:    mustMarshal(payload),
        OccurredAt: time.Now(),
    }

    saveEvent(event)
    w.WriteHeader(http.StatusOK)
}

func findTeamBySource(sourceType string) string {
    for _, team := range config.Teams {
        for _, source := range team.Sources {
            if source.Type == sourceType {
                return team.ID
            }
        }
    }
    return ""
}

func saveEvent(event Event) {
    conn, err := clickhouse.Open(&clickhouse.Options{
        Addr: []string{fmt.Sprintf("%s:%d", config.ClickHouse.Host, config.ClickHouse.Port)},
    })
    if err != nil {
        log.Printf("Failed to connect to ClickHouse: %v", err)
        return
    }
    defer conn.Close()

    query := `INSERT INTO events (id, source_type, event_type, team_id, payload, occurred_at) VALUES (?, ?, ?, ?, ?, ?)`
    if err := conn.AsyncInsert(ctx, query, false, event.ID, event.SourceType, event.EventType, event.TeamID, event.Payload, event.OccurredAt); err != nil {
        log.Printf("Failed to insert event: %v", err)
    }
}

func mustMarshal(v interface{}) json.RawMessage {
    data, _ := json.Marshal(v)
    return data
}
```

- [ ] **Step 2: Create config.yaml**

```yaml
clickhouse:
  host: "localhost"
  port: 9000

webhook:
  port: 8080

teams:
  - id: "550e8400-e29b-41d4-a716-446655440000"
    name: "Platform Team"
    sources:
      - type: "github"
        config:
          token: "${GITHUB_TOKEN}"
          webhook_secret: "${WEBHOOK_SECRET}"
      - type: "gitlab"
        config:
          token: "${GITLAB_TOKEN}"
          webhook_secret: "${WEBHOOK_SECRET}"
```

- [ ] **Step 3: Create Dockerfile**

```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY . .
RUN go build -o collector .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/collector .
COPY config.yaml .

CMD ["./collector"]
```

- [ ] **Step 4: Commit**

```bash
git add collectors/git/
git commit -m "feat: add git collector (Go) with GitHub/GitLab adapters"
```

---

## Task 3: PM Collector (Go)

**Files:**
- Create: `collectors/pm/main.go` (similar structure to git collector)
- Create: `collectors/pm/adapters/jira.go`
- Create: `collectors/pm/adapters/linear.go`
- Create: `collectors/pm/config.yaml`
- Create: `collectors/pm/Dockerfile`

- [ ] **Step 1: Create main.go**

```go
package main

import (
    "context"
    "encoding/json"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/ClickHouse/clickhouse-go/v2"
    "github.com/google/uuid"
)

type Config struct {
    ClickHouse struct {
        Host string `yaml:"host"`
        Port int    `yaml:"port"`
    } `yaml:"clickhouse"`
    Webhook struct {
        Port int `yaml:"port"`
    } `yaml:"webhook"`
    Teams []struct {
        ID      string `yaml:"id"`
        Name    string `yaml:"name"`
        Sources []struct {
            Type   string `yaml:"type"`
            Config map[string]string `yaml:"config"`
        } `yaml:"sources"`
    } `yaml:"teams"`
}

type Event struct {
    ID          string          `json:"id"`
    SourceType  string          `json:"source_type"`
    EventType   string          `json:"event_type"`
    TeamID      string          `json:"team_id"`
    ProjectID   *string         `json:"project_id"`
    Payload     json.RawMessage `json:"payload"`
    OccurredAt  time.Time       `json:"occurred_at"`
}

var config Config

func main() {
    loadConfig(&config)
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    go startWebhookServer(ctx)
    go startPolling(ctx)

    sigCh := make(chan os.Signal, 1)
    signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
    <-sigCh
    log.Println("Shutting down...")
}

func startWebhookServer(ctx context.Context) {
    http.HandleFunc("/webhook/jira", handleJiraWebhook)
    http.HandleFunc("/webhook/linear", handleLinearWebhook)
    addr := fmt.Sprintf(":%d", config.Webhook.Port+1)
    log.Printf("Starting PM webhook server on %s", addr)
    http.ListenAndServe(addr, nil)
}

func handleJiraWebhook(w http.ResponseWriter, r *http.Request) {
    var payload map[string]interface{}
    json.NewDecoder(r.Body).Decode(&payload)
    teamID := findTeamBySource("jira")

    event := Event{
        ID:         uuid.New().String(),
        SourceType: "pm",
        EventType:  "jira_" + r.URL.Query().Get("webhookEvent"),
        TeamID:     teamID,
        Payload:    mustMarshal(payload),
        OccurredAt: time.Now(),
    }
    saveEvent(event)
    w.WriteHeader(http.StatusOK)
}

func handleLinearWebhook(w http.ResponseWriter, r *http.Request) {
    var payload map[string]interface{}
    json.NewDecoder(r.Body).Decode(&payload)
    teamID := findTeamBySource("linear")

    event := Event{
        ID:         uuid.New().String(),
        SourceType: "pm",
        EventType:  "linear_" + payload["type"].(string),
        TeamID:     teamID,
        Payload:    mustMarshal(payload),
        OccurredAt: time.Now(),
    }
    saveEvent(event)
    w.WriteHeader(http.StatusOK)
}

func startPolling(ctx context.Context) {
    ticker := time.NewTicker(5 * time.Minute)
    defer ticker.Stop()
    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            pollPMsources(ctx)
        }
    }
}

func pollPMsources(ctx context.Context) {
    for _, team := range config.Teams {
        for _, source := range team.Sources {
            switch source.Type {
            case "jira":
                fetchJiraIssues(ctx, team.ID, source.Config)
            case "linear":
                fetchLinearIssues(ctx, team.ID, source.Config)
            }
        }
    }
}

func fetchJiraIssues(ctx context.Context, teamID string, config map[string]string) {
    // Implementation: fetch JQL, transform to events, saveEvent() for each
    log.Printf("Polling Jira for team %s", teamID)
}

func fetchLinearIssues(ctx context.Context, teamID string, config map[string]string) {
    // Implementation: fetch Linear API, transform to events
    log.Printf("Polling Linear for team %s", teamID)
}

func saveEvent(event Event) {
    conn, _ := clickhouse.Open(&clickhouse.Options{
        Addr: []string{fmt.Sprintf("%s:%d", config.ClickHouse.Host, config.ClickHouse.Port)},
    })
    defer conn.Close()
    query := `INSERT INTO events (id, source_type, event_type, team_id, payload, occurred_at) VALUES (?, ?, ?, ?, ?, ?)`
    conn.AsyncInsert(ctx, query, false, event.ID, event.SourceType, event.EventType, event.TeamID, event.Payload, event.OccurredAt)
}
```

- [ ] **Step 2: Create config.yaml**

```yaml
clickhouse:
  host: "localhost"
  port: 9000

webhook:
  port: 8081

teams:
  - id: "550e8400-e29b-41d4-a716-446655440000"
    name: "Platform Team"
    sources:
      - type: "jira"
        config:
          url: "${JIRA_URL}"
          email: "${JIRA_EMAIL}"
          api_token: "${JIRA_TOKEN}"
      - type: "linear"
        config:
          api_key: "${LINEAR_API_KEY}"
```

- [ ] **Step 3: Create Dockerfile**

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o collector .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/collector .
COPY config.yaml .
CMD ["./collector"]
```

- [ ] **Step 4: Commit**

```bash
git add collectors/pm/
git commit -m "feat: add PM collector (Go) with Jira/Linear adapters"
```

---

## Task 4: CI/CD Collector (Go)

**Files:**
- Create: `collectors/cicd/main.go`
- Create: `collectors/cicd/adapters/github_actions.go`
- Create: `collectors/cicd/adapters/gitlab_ci.go`
- Create: `collectors/cicd/config.yaml`
- Create: `collectors/cicd/Dockerfile`

- [ ] **Step 1: Create main.go** (similar structure with polling)

- [ ] **Step 2: Create config.yaml**

```yaml
clickhouse:
  host: "localhost"
  port: 9000

poll_interval: 300

teams:
  - id: "550e8400-e29b-41d4-a716-446655440000"
    name: "Platform Team"
    sources:
      - type: "github_actions"
        config:
          token: "${GITHUB_TOKEN}"
          repos: "org/repo1,org/repo2"
      - type: "gitlab_ci"
        config:
          token: "${GITLAB_TOKEN}"
          projects: "group/project1,group/project2"
```

- [ ] **Step 3: Create Dockerfile**

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o collector .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/collector .
COPY config.yaml .
CMD ["./collector"]
```

- [ ] **Step 4: Commit**

```bash
git add collectors/cicd/
git commit -m "feat: add CI/CD collector (Go) with GitHub Actions/GitLab CI adapters"
```

---

## Task 5: Metrics Collector (Go)

**Files:**
- Create: `collectors/metrics/main.go`
- Create: `collectors/metrics/adapters/prometheus.go`
- Create: `collectors/metrics/config.yaml`
- Create: `collectors/metrics/Dockerfile`

- [ ] **Step 1: Create main.go** (similar, supporting pushgateway and API)

- [ ] **Step 2: Create config.yaml**

```yaml
clickhouse:
  host: "localhost"
  port: 9000

pushgateway:
  address: ":9091"

teams:
  - id: "550e8400-e29b-41d4-a716-446655440000"
    name: "Platform Team"
    sources:
      - type: "prometheus"
        config:
          url: "http://prometheus:9090"
          query: "up"
```

- [ ] **Step 3: Create Dockerfile**

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o collector .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/collector .
COPY config.yaml .
CMD ["./collector"]
```

- [ ] **Step 4: Commit**

```bash
git add collectors/metrics/
git commit -m "feat: add metrics collector (Go) with Prometheus adapter"
```

---

## Task 6: FastAPI Backend (Python)

**Files:**
- Create: `api/main.py`
- Create: `api/routes/teams.py`
- Create: `api/routes/overview.py`
- Create: `api/routes/health.py`
- Create: `api/clickhouse/client.py`
- Create: `api/requirements.txt`
- Create: `api/Dockerfile`

- [ ] **Step 1: Create requirements.txt**

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
clickhouse-driver==0.2.6
pydantic==2.5.3
python-dotenv==1.0.0
```

- [ ] **Step 2: Create clickhouse/client.py**

```python
from clickhouse_driver import Client
import os
from functools import lru_cache

@lru_cache()
def get_client() -> Client:
    return Client(
        host=os.getenv("CLICKHOUSE_HOST", "localhost"),
        port=int(os.getenv("CLICKHOUSE_PORT", "9000")),
        database=os.getenv("CLICKHOUSE_DB", "default")
    )

def execute(query: str, params: dict = None):
    client = get_client()
    return client.execute(query, params or {})

def execute_iter(query: str, params: dict = None):
    client = get_client()
    return client.execute_iter(query, params or {})
```

- [ ] **Step 3: Create routes/teams.py**

```python
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/teams", tags=["teams"])

@router.get("/")
def list_teams():
    from clickhouse.client import execute
    result = execute("SELECT id, name FROM teams")
    return [{"id": r[0], "name": r[1]} for r in result]

@router.get("/{team_id}")
def get_team(team_id: str):
    from clickhouse.client import execute
    result = execute(
        "SELECT id, name FROM teams WHERE id = %(team_id)s",
        {"team_id": team_id}
    )
    if not result:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"id": result[0][0], "name": result[0][1]}
```

- [ ] **Step 4: Create routes/overview.py**

```python
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/teams", tags=["overview"])

@router.get("/{team_id}/overview")
def get_overview(team_id: str):
    from clickhouse.client import execute
    
    # PRs awaiting review
    prs_awaiting = execute("""
        SELECT count() FROM events
        WHERE team_id = %(team_id)s
        AND source_type = 'git'
        AND event_type = 'pr_review_request'
        AND occurred_at > now() - INTERVAL 2 DAY
    """, {"team_id": team_id})[0][0]
    
    # Blocked tasks
    blocked_tasks = execute("""
        SELECT count() FROM events
        WHERE team_id = %(team_id)s
        AND source_type = 'pm'
        AND event_type = 'task_blocked'
        AND occurred_at > now() - INTERVAL 1 DAY
    """, {"team_id": team_id})[0][0]
    
    # CI failures
    ci_failures = execute("""
        SELECT count() FROM events
        WHERE team_id = %(team_id)s
        AND source_type = 'cicd'
        AND event_type = 'pipeline_failed'
        AND occurred_at > now() - INTERVAL 1 HOUR
    """, {"team_id": team_id})[0][0]
    
    return {
        "team_id": team_id,
        "prs_awaiting_review": prs_awaiting,
        "blocked_tasks": blocked_tasks,
        "ci_failures_last_hour": ci_failures
    }

@router.get("/{team_id}/activity")
def get_activity(team_id: str):
    from clickhouse.client import execute
    
    result = execute("""
        SELECT toDate(occurred_at) as date, source_type, event_type, count()
        FROM events
        WHERE team_id = %(team_id)s
        AND occurred_at > now() - INTERVAL 7 DAY
        GROUP BY date, source_type, event_type
        ORDER BY date
    """, {"team_id": team_id})
    
    return {
        "team_id": team_id,
        "data": [{"date": str(r[0]), "source": r[1], "event": r[2], "count": r[3]} for r in result]
    }

@router.get("/{team_id}/velocity")
def get_velocity(team_id: str):
    from clickhouse.client import execute
    
    result = execute("""
        SELECT 
            toDate(started_at) as sprint_start,
            sum(story_points) as points,
            count() as tasks
        FROM cycle_metrics
        WHERE team_id = %(team_id)s
        AND completed_at > now() - INTERVAL 30 DAY
        GROUP BY sprint_start
        ORDER BY sprint_start
    """, {"team_id": team_id})
    
    return {
        "team_id": team_id,
        "data": [{"sprint": str(r[0]), "points": r[1], "tasks": r[2]} for r in result]
    }

@router.get("/{team_id}/insights")
def get_insights(team_id: str):
    from clickhouse.client import execute
    
    # Generate attention items
    alerts = []
    
    # Check stale PRs
    stale_prs = execute("""
        SELECT count() FROM pr_metrics
        WHERE team_id = %(team_id)s
        AND merged_at IS NULL
        AND created_at < now() - INTERVAL 2 DAY
    """, {"team_id": team_id})[0][0]
    if stale_prs > 0:
        alerts.append(f"{stale_prs} PRs waiting for review > 2 days")
    
    # Check overdue tasks
    overdue = execute("""
        SELECT count() FROM events
        WHERE team_id = %(team_id)s
        AND source_type = 'pm'
        AND event_type = 'task_overdue'
        AND occurred_at > now() - INTERVAL 3 DAY
    """, {"team_id": team_id})[0][0]
    if overdue > 0:
        alerts.append(f"{overdue} tasks overdue by 3+ days")
    
    return {"team_id": team_id, "insights": alerts}
```

- [ ] **Step 5: Create routes/health.py**

```python
from fastapi import APIRouter
from clickhouse.driver import Client
import os

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/clickhouse")
def health_clickhouse():
    try:
        client = Client(
            host=os.getenv("CLICKHOUSE_HOST", "localhost"),
            port=int(os.getenv("CLICKHOUSE_PORT", "9000"))
        )
        client.execute("SELECT 1")
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/api")
def health_api():
    return {"status": "ok"}
```

- [ ] **Step 6: Create main.py**

```python
from fastapi import FastAPI
from routes import teams, overview, health
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Team Dashboard API", version="1.0.0")

app.include_router(teams.router)
app.include_router(overview.router)
app.include_router(health.router)

@app.get("/")
def root():
    return {"message": "Team Dashboard API", "version": "1.0.0"}
```

- [ ] **Step 7: Create Dockerfile**

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 8: Commit**

```bash
git add api/
git commit -m "feat: add FastAPI backend with teams, overview, health routes"
```

---

## Task 7: React Dashboard (Frontend)

**Files:**
- Create: `ui/package.json`
- Create: `ui/vite.config.ts`
- Create: `ui/src/App.tsx`
- Create: `ui/src/components/TeamSelector.tsx`
- Create: `ui/src/components/Overview.tsx`
- Create: `ui/src/components/ActivityChart.tsx`
- Create: `ui/src/components/AttentionItems.tsx`
- Create: `ui/src/api/client.ts`
- Create: `ui/Dockerfile`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "team-dashboard-ui",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.4",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.12"
  }
}
```

- [ ] **Step 2: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://api:8000'
    }
  }
})
```

- [ ] **Step 3: Create api/client.ts**

```typescript
import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
})

export const api = {
  getTeams: () => client.get('/teams'),
  getTeam: (id: string) => client.get(`/teams/${id}`),
  getOverview: (teamId: string) => client.get(`/teams/${teamId}/overview`),
  getActivity: (teamId: string) => client.get(`/teams/${teamId}/activity`),
  getVelocity: (teamId: string) => client.get(`/teams/${teamId}/velocity`),
  getInsights: (teamId: string) => client.get(`/teams/${teamId}/insights`),
}
```

- [ ] **Step 4: Create components/TeamSelector.tsx**

```tsx
import { useState, useEffect } from 'react'
import { api } from '../api/client'

interface Team {
  id: string
  name: string
}

export function TeamSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const [teams, setTeams] = useState<Team[]>([])
  const [selected, setSelected] = useState('')

  useEffect(() => {
    api.getTeams().then(res => {
      setTeams(res.data)
      if (res.data.length > 0) {
        setSelected(res.data[0].id)
        onSelect(res.data[0].id)
      }
    })
  }, [])

  return (
    <select 
      value={selected} 
      onChange={e => { setSelected(e.target.value); onSelect(e.target.value) }}
      style={{ padding: '8px 16px', fontSize: '16px', borderRadius: '8px' }}
    >
      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  )
}
```

- [ ] **Step 5: Create components/Overview.tsx**

```tsx
import { useEffect, useState } from 'react'
import { api } from '../api/client'

export function Overview({ teamId }: { teamId: string }) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    api.getOverview(teamId).then(res => setData(res.data))
  }, [teamId])

  if (!data) return <div>Loading...</div>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '24px' }}>
      <div style={{ padding: '24px', background: '#f5f5f5', borderRadius: '12px' }}>
        <div style={{ fontSize: '14px', color: '#666' }}>PRs Awaiting Review</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{data.prs_awaiting_review}</div>
      </div>
      <div style={{ padding: '24px', background: '#f5f5f5', borderRadius: '12px' }}>
        <div style={{ fontSize: '14px', color: '#666' }}>Blocked Tasks</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: data.blocked_tasks > 0 ? '#d32f2f' : '#333' }}>
          {data.blocked_tasks}
        </div>
      </div>
      <div style={{ padding: '24px', background: '#f5f5f5', borderRadius: '12px' }}>
        <div style={{ fontSize: '14px', color: '#666' }}>CI Failures (1h)</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: data.ci_failures_last_hour > 0 ? '#d32f2f' : '#333' }}>
          {data.ci_failures_last_hour}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create components/ActivityChart.tsx**

```tsx
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '../api/client'

export function ActivityChart({ teamId }: { teamId: string }) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    api.getActivity(teamId).then(res => {
      const raw = res.data.data
      const grouped: Record<string, any> = {}
      raw.forEach((r: any) => {
        if (!grouped[r.date]) grouped[r.date] = { date: r.date }
        grouped[r.date][r.source] = (grouped[r.date][r.source] || 0) + r.count
      })
      setData(Object.values(grouped))
    })
  }, [teamId])

  return (
    <div style={{ marginTop: '32px', height: '300px' }}>
      <h3>Activity (Last 7 Days)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="git" stroke="#8884d8" name="Git" />
          <Line type="monotone" dataKey="pm" stroke="#82ca9d" name="PM" />
          <Line type="monotone" dataKey="cicd" stroke="#ffc658" name="CI/CD" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 7: Create components/AttentionItems.tsx**

```tsx
import { useEffect, useState } from 'react'
import { api } from '../api/client'

export function AttentionItems({ teamId }: { teamId: string }) {
  const [insights, setInsights] = useState<string[]>([])

  useEffect(() => {
    api.getInsights(teamId).then(res => setInsights(res.data.insights))
  }, [teamId])

  if (insights.length === 0) return null

  return (
    <div style={{ marginTop: '32px' }}>
      <h3>Attention Items</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {insights.map((item, i) => (
          <li key={i} style={{ 
            padding: '12px 16px', 
            background: '#fff3e0', 
            borderLeft: '4px solid #ff9800',
            marginBottom: '8px',
            borderRadius: '4px'
          }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 8: Create App.tsx**

```tsx
import { useState } from 'react'
import { TeamSelector } from './components/TeamSelector'
import { Overview } from './components/Overview'
import { ActivityChart } from './components/ActivityChart'
import { AttentionItems } from './components/AttentionItems'

export default function App() {
  const [teamId, setTeamId] = useState('')

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Team Dashboard</h1>
        <TeamSelector onSelect={setTeamId} />
      </header>
      {teamId && (
        <main>
          <Overview teamId={teamId} />
          <ActivityChart teamId={teamId} />
          <AttentionItems teamId={teamId} />
        </main>
      )}
    </div>
  )
}
```

- [ ] **Step 9: Create Dockerfile**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 10: Create nginx.conf**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://api:8000;
    }
}
```

- [ ] **Step 11: Commit**

```bash
git add ui/
git commit -m "feat: add React dashboard with team selector, overview, activity chart"
```

---

## Task 8: Docker Compose for Local Dev

**Files:**
- Create: `docker-compose.yaml`

- [ ] **Step 1: Create docker-compose.yaml**

```yaml
version: '3.8'

services:
  clickhouse:
    image: clickhouse/clickhouse-server:23.8
    ports:
      - "8123:8123"
      - "9000:9000"
    environment:
      CLICKHOUSE_DB: default
    volumes:
      - ./clickhouse/schema.sql:/docker-entrypoint-initdb.d/schema.sql
      - clickhouse_data:/var/lib/clickhouse
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8123/ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: ./api
    ports:
      - "8000:8000"
    environment:
      CLICKHOUSE_HOST: clickhouse
      CLICKHOUSE_PORT: 9000
    depends_on:
      clickhouse:
        condition: service_healthy

  ui:
    build: ./ui
    ports:
      - "3000:80"
    depends_on:
      - api

  collector-git:
    build: ./collectors/git
    environment:
      CLICKHOUSE_HOST: clickhouse
      CLICKHOUSE_PORT: 9000
    depends_on:
      clickhouse:
        condition: service_healthy

  collector-pm:
    build: ./collectors/pm
    environment:
      CLICKHOUSE_HOST: clickhouse
      CLICKHOUSE_PORT: 9000
    depends_on:
      clickhouse:
        condition: service_healthy

  collector-cicd:
    build: ./collectors/cicd
    environment:
      CLICKHOUSE_HOST: clickhouse
      CLICKHOUSE_PORT: 9000
    depends_on:
      clickhouse:
        condition: service_healthy

  collector-metrics:
    build: ./collectors/metrics
    environment:
      CLICKHOUSE_HOST: clickhouse
      CLICKHOUSE_PORT: 9000
    depends_on:
      clickhouse:
        condition: service_healthy

volumes:
  clickhouse_data:
```

- [ ] **Step 2: Commit**

```bash
git add docker-compose.yaml
git commit -m "feat: add Docker Compose for local development"
```

---

## Task 9: Helm Chart for Kubernetes

**Files:**
- Create: `helm/team-dashboard/Chart.yaml`
- Create: `helm/team-dashboard/values.yaml`
- Create: `helm/team-dashboard/templates/_helpers.tpl`
- Create: `helm/team-dashboard/templates/clickhouse-statefulset.yaml`
- Create: `helm/team-dashboard/templates/api-deployment.yaml`
- Create: `helm/team-dashboard/templates/ui-deployment.yaml`
- Create: `helm/team-dashboard/templates/collector-git-deployment.yaml`
- Create: `helm/team-dashboard/templates/ingress.yaml`
- Create: `helm/team-dashboard/templates/configmap.yaml`

- [ ] **Step 1: Create Chart.yaml**

```yaml
apiVersion: v2
name: team-dashboard
description: Team Dashboard MVP
type: application
version: 0.1.0
appVersion: "1.0.0"
```

- [ ] **Step 2: Create values.yaml**

```yaml
replicaCount: 1

image:
  pullPolicy: IfNotPresent

api:
  image: team-dashboard/api
  service:
    type: ClusterIP
    port: 8000
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 100m
      memory: 256Mi

ui:
  image: team-dashboard/ui
  service:
    type: ClusterIP
    port: 80
  resources:
    limits:
      cpu: 200m
      memory: 128Mi
    requests:
      cpu: 50m
      memory: 64Mi

collectors:
  git:
    image: team-dashboard/collector-git
    resources:
      limits:
        cpu: 200m
        memory: 256Mi
  pm:
    image: team-dashboard/collector-pm
  cicd:
    image: team-dashboard/collector-cicd
  metrics:
    image: team-dashboard/collector-metrics

clickhouse:
  image: clickhouse/clickhouse-server:23.8
  resources:
    limits:
      cpu: 1000m
      memory: 2Gi
    requests:
      cpu: 500m
      memory: 1Gi
  storage: 10Gi

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: dashboard.example.com
      paths:
        - path: /
          pathType: Prefix
          service: ui
        - path: /api
          pathType: Prefix
          service: api
  tls:
    - secretName: team-dashboard-tls
      hosts:
        - dashboard.example.com
```

- [ ] **Step 3: Create templates/_helpers.tpl**

```yaml
{{/*
Expand the name of the chart.
*/}}
{{- define "team-dashboard.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "team-dashboard.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "team-dashboard.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "team-dashboard.labels" -}}
helm.sh/chart: {{ include "team-dashboard.chart" . }}
{{ include "team-dashboard.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "team-dashboard.selectorLabels" -}}
app.kubernetes.io/name: {{ include "team-dashboard.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```

- [ ] **Step 4: Create templates/clickhouse-statefulset.yaml**

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: {{ include "team-dashboard.fullname" . }}-clickhouse
  labels:
    {{- include "team-dashboard.labels" . | nindent 4 }}
    component: clickhouse
spec:
  serviceName: {{ include "team-dashboard.fullname" . }}-clickhouse
  replicas: 1
  selector:
    matchLabels:
      {{- include "team-dashboard.selectorLabels" . | nindent 6 }}
      component: clickhouse
  template:
    metadata:
      labels:
        {{- include "team-dashboard.selectorLabels" . | nindent 8 }}
        component: clickhouse
    spec:
      containers:
        - name: clickhouse
          image: {{ .Values.clickhouse.image }}
          ports:
            - containerPort: 8123
              name: http
            - containerPort: 9000
              name: tcp
          volumeMounts:
            - name: data
              mountPath: /var/lib/clickhouse
          resources:
            {{- toYaml .Values.clickhouse.resources | nindent 12 }}
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: {{ .Values.clickhouse.storage }}
```

- [ ] **Step 5: Create templates/api-deployment.yaml**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "team-dashboard.fullname" . }}-api
  labels:
    {{- include "team-dashboard.labels" . | nindent 4 }}
    component: api
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "team-dashboard.selectorLabels" . | nindent 6 }}
      component: api
  template:
    metadata:
      labels:
        {{- include "team-dashboard.selectorLabels" . | nindent 8 }}
        component: api
    spec:
      containers:
        - name: api
          image: {{ .Values.api.image }}:{{ .Chart.AppVersion }}
          ports:
            - containerPort: 8000
          env:
            - name: CLICKHOUSE_HOST
              value: {{ include "team-dashboard.fullname" . }}-clickhouse
            - name: CLICKHOUSE_PORT
              value: "9000"
          resources:
            {{- toYaml .Values.api.resources | nindent 12 }}
---
apiVersion: v1
kind: Service
metadata:
  name: {{ include "team-dashboard.fullname" . }}-api
spec:
  selector:
    component: api
  ports:
    - port: 8000
      targetPort: 8000
```

- [ ] **Step 6: Create templates/ui-deployment.yaml**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "team-dashboard.fullname" . }}-ui
  labels:
    {{- include "team-dashboard.labels" . | nindent 4 }}
    component: ui
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "team-dashboard.selectorLabels" . | nindent 6 }}
      component: ui
  template:
    metadata:
      labels:
        {{- include "team-dashboard.selectorLabels" . | nindent 8 }}
        component: ui
    spec:
      containers:
        - name: ui
          image: {{ .Values.ui.image }}:{{ .Chart.AppVersion }}
          ports:
            - containerPort: 80
          resources:
            {{- toYaml .Values.ui.resources | nindent 12 }}
---
apiVersion: v1
kind: Service
metadata:
  name: {{ include "team-dashboard.fullname" . }}-ui
spec:
  selector:
    component: ui
  ports:
    - port: 80
      targetPort: 80
```

- [ ] **Step 7: Create templates/collector-git-deployment.yaml**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "team-dashboard.fullname" . }}-collector-git
  labels:
    {{- include "team-dashboard.labels" . | nindent 4 }}
    component: collector-git
spec:
  replicas: 1
  selector:
    matchLabels:
      {{- include "team-dashboard.selectorLabels" . | nindent 6 }}
      component: collector-git
  template:
    metadata:
      labels:
        {{- include "team-dashboard.selectorLabels" . | nindent 8 }}
        component: collector-git
    spec:
      containers:
        - name: collector
          image: {{ .Values.collectors.git.image }}:{{ .Chart.AppVersion }}
          env:
            - name: CLICKHOUSE_HOST
              value: {{ include "team-dashboard.fullname" . }}-clickhouse
            - name: CLICKHOUSE_PORT
              value: "9000"
          resources:
            {{- toYaml .Values.collectors.git.resources | nindent 12 }}
```

- [ ] **Step 8: Create templates/ingress.yaml**

```yaml
{{- if .Values.ingress.enabled -}}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "team-dashboard.fullname" . }}-ingress
  labels:
    {{- include "team-dashboard.labels" . | nindent 4 }}
  {{- with .Values.ingress.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  ingressClassName: {{ .Values.ingress.className }}
  tls:
    {{- range .Values.ingress.tls }}
    - hosts:
        {{- range .hosts }}
        - {{ . | quote }}
        {{- end }}
      secretName: {{ .secretName }}
    {{- end }}
  rules:
    {{- range .Values.ingress.hosts }}
    - host: {{ .host | quote }}
      http:
        paths:
          {{- range .paths }}
          - path: {{ .path }}
            pathType: {{ .pathType }}
            backend:
              service:
                name: {{ $.Release.Name }}-{{ .service }}
                port:
                  number: {{ if eq .service "ui" }}80{{ else }}8000{{ end }}
          {{- end }}
    {{- end }}
{{- end }}
```

- [ ] **Step 9: Commit**

```bash
git add helm/team-dashboard/
git commit -m "feat: add Helm chart for Kubernetes deployment"
```

---

## Task 10: Unit Tests

**Files:**
- Create: `api/tests/test_routes.py`
- Create: `collectors/git/adapters_test.go`

- [ ] **Step 1: Create api/tests/test_routes.py**

```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_list_teams():
    response = client.get("/api/v1/teams")
    assert response.status_code == 200

def test_health():
    response = client.get("/health/api")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
```

- [ ] **Step 2: Create collectors/git/adapters_test.go**

```go
package adapters

import (
    "testing"
)

func TestGitHubTransform(t *testing.T) {
    payload := map[string]interface{}{
        "action": "opened",
        "pull_request": map[string]interface{}{
            "id": 123,
            "user": map[string]interface{}{"login": "testuser"},
        },
    }
    // Test transformation logic
    // assert transformed data matches expected format
}

func TestGitLabTransform(t *testing.T) {
    // Similar test for GitLab
}
```

- [ ] **Step 3: Commit**

```bash
git add api/tests/ collectors/git/adapters_test.go
git commit -m "test: add unit tests for API and collectors"
```

---

## Summary

**Plan created for Cycle 1: MVP**

All tasks:
- Task 1: ClickHouse Schema
- Task 2: Git Collector (Go)
- Task 3: PM Collector (Go)
- Task 4: CI/CD Collector (Go)
- Task 5: Metrics Collector (Go)
- Task 6: FastAPI Backend
- Task 7: React Dashboard
- Task 8: Docker Compose
- Task 9: Helm Chart
- Task 10: Unit Tests
- Task 11: Documentation (README)

---

## Task 11: Documentation (README)

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md**

```markdown
# Team Dashboard

Developer productivity dashboard for multiple teams.

## Features

- Real-time metrics from GitHub, GitLab, Jira, Linear, CI/CD, Prometheus
- Activity graphs, velocity trends, attention items
- Multi-team support with team selector
- Kubernetes-ready with Helm

## Quick Start (Docker Compose)

```bash
# Clone and run
docker-compose up -d

# Access
# UI: http://localhost:3000
# API: http://localhost:8000
# ClickHouse: http://localhost:8123
```

## Development

### Prerequisites

- Go 1.21+
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose

### Local Development

```bash
# Start all services
docker-compose up -d

# Run API locally
cd api && pip install -r requirements.txt && uvicorn main:app --reload

# Run UI locally
cd ui && npm install && npm run dev
```

### Running Tests

```bash
# API tests
cd api && pytest

# Collector tests (Go)
cd collectors/git && go test ./...
```

## Architecture

```
Sources → Go Collectors → ClickHouse → FastAPI → React UI
```

## Deployment (Kubernetes)

```bash
# Install Helm chart
helm install team-dashboard ./helm/team-dashboard -f values-prod.yaml
```

## Configuration

See `config.yaml` in each collector for source-specific settings.

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with quick start and development guide"
```

---

## Summary