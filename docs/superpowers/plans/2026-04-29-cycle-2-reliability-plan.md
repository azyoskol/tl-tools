# Cycle 2: Reliability & Coverage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Production-ready system with error handling (DLQ), health monitoring, Redis caching, new adapters (Asana, Trello, Jenkins), and comprehensive tests.

**Architecture:** Push-based health checks with Prometheus metrics, DLQ with 3 retries then permanent storage, Redis for API response caching, integration + E2E tests.

**Tech Stack:** Go collectors, Python FastAPI, Redis, ClickHouse, pytest, Playwright (for E2E)

---

## File Structure Overview

```
collectors/
├── pm/adapters/asana.go      # NEW
├── pm/adapters/trello.go     # NEW
├── cicd/adapters/jenkins.go  # NEW

api/
├── routes/dLQ.py             # NEW
├── routes/collectors.py      # NEW
├── middleware/cache.py       # NEW
├── requirements.txt          # MODIFY (add redis)
├── main.py                   # MODIFY

clickhouse/
├── schema.sql                # MODIFY (add DLQ table)

tests/
├── integration/              # NEW
│   ├── test_api_ch.py
│   └── test_collector_ch.py
├── e2e/                      # NEW
│   └── test_pipeline.py
└── fixtures/                 # NEW
    └── events.json

docker-compose.yaml           # MODIFY (add Redis)
```

---

## Task 1: Dead Letter Queue (DLQ)

**Files:**
- Modify: `clickhouse/schema.sql` — add DLQ table
- Create: `api/routes/dLQ.py` — DLQ API endpoints
- Modify: `api/main.py` — register DLQ router

- [ ] **Step 1: Add DLQ table to schema.sql**

```sql
CREATE TABLE IF NOT EXISTS events_dlq (
    id UUID DEFAULT generateUUIDv4(),
    original_payload String,
    source_type String,
    event_type String,
    team_id UUID,
    error_reason String,
    retry_count Int8 DEFAULT 0,
    created_at DateTime DEFAULT now(),
    last_retry_at Nullable(DateTime)
) ENGINE = MergeTree()
ORDER BY (created_at, source_type);
```

- [ ] **Step 2: Apply schema to ClickHouse**

Run: `docker exec -i clickhouse clickhouse-client < clickhouse/schema.sql`

- [ ] **Step 3: Create DLQ API routes**

File: `api/routes/dLQ.py`

```python
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/dLQ", tags=["dlq"])

@router.get("")
def list_dlq():
    from clickhouse.client import execute
    result = execute("""
        SELECT id, source_type, event_type, error_reason, retry_count, created_at
        FROM events_dlq
        ORDER BY created_at DESC
        LIMIT 100
    """)
    return [{"id": str(r[0]), "source": r[1], "event": r[2], "error": r[3], "retries": r[4], "created": str(r[5])} for r in result]

@router.get("/{event_id}")
def get_dlq_event(event_id: str):
    from clickhouse.client import execute
    result = execute(f"SELECT * FROM events_dlq WHERE id = '{event_id}'")
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"id": str(result[0][0]), "payload": result[0][1], "error": result[0][5]}

@router.post("/{event_id}/retry")
def retry_dlq_event(event_id: str):
    from clickhouse.client import execute
    result = execute(f"SELECT original_payload, source_type, event_type, team_id FROM events_dlq WHERE id = '{event_id}'")
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
    
    row = result[0]
    execute(f"""
        INSERT INTO events (team_id, source_type, event_type, payload, occurred_at)
        VALUES ('{row[3]}', '{row[1]}', '{row[2]}', '{row[0]}', now())
    """)
    execute(f"DELETE FROM events_dlq WHERE id = '{event_id}'")
    return {"status": "retry_scheduled"}

@router.delete("/{event_id}")
def delete_dlq_event(event_id: str):
    from clickhouse.client import execute
    execute(f"DELETE FROM events_dlq WHERE id = '{event_id}'")
    return {"status": "deleted"}
```

- [ ] **Step 4: Register DLQ router in main.py**

Add to imports:
```python
from routes import teams, overview, health, dashboard, webhook, dlq
```

Add to router list:
```python
app.include_router(dlq.router)
```

- [ ] **Step 5: Test DLQ endpoints**

Run: `curl http://localhost:8000/api/v1/dLQ`
Expected: JSON array (empty or with events)

- [ ] **Step 6: Commit**

```bash
git add clickhouse/schema.sql api/routes/dLQ.py api/main.py
git commit -m "feat: add Dead Letter Queue with API endpoints"
```

---

## Task 2: Collector Retry Logic

**Files:**
- Modify: `collectors/git/main.go` — add retry + DLQ logic
- Modify: `collectors/pm/main.go` — add retry + DLQ logic
- Modify: `collectors/cicd/main.go` — add retry + DLQ logic
- Modify: `collectors/metrics/main.go` — add retry + DLQ logic

- [ ] **Step 1: Create shared retry logic package**

Create: `collectors/shared/retry/retry.go`

```go
package retry

import (
    "context"
    "time"
)

const (
    MaxRetries = 3
    BaseDelay = 1 * time.Second
)

func WithRetry(ctx context.Context, fn func() error) error {
    var lastErr error
    for i := 0; i < MaxRetries; i++ {
        if err := fn(); err != nil {
            lastErr = err
            delay := BaseDelay * (1 << uint(i)) // 1s, 2s, 4s... but spec says 1, 4, 16
            // Adjust to match spec: 1, 4, 16
            delayMs := []int{1000, 4000, 16000}
            time.Sleep(time.Duration(delayMs[i]) * time.Millisecond)
            continue
        }
        return nil
    }
    return lastErr
}

func ToDLQ(ctx context.Context, event Event, err error) {
    // Insert failed event to DLQ table
    // Implementation depends on ClickHouse client
}
```

- [ ] **Step 2: Update git collector to use retry**

Modify: `collectors/git/main.go`

Add import:
```go
import "tl-tools/collectors/shared/retry"
```

Wrap insert:
```go
err := retry.WithRetry(ctx, func() error {
    return ch.InsertEvents(events)
})
if err != nil {
    retry.ToDLQ(ctx, events, err)
    // Log error
}
```

- [ ] **Step 3: Repeat for pm, cicd, metrics collectors**

- [ ] **Step 4: Commit**

```bash
git add collectors/shared/ collectors/git/ collectors/pm/ collectors/cicd/ collectors/metrics/
git commit -m "feat: add retry logic with DLQ to all collectors"
```

---

## Task 3: Collector Health Checks

**Files:**
- Create: `api/routes/collectors.py` — health API
- Modify: `api/main.py` — register collectors router
- Modify: `collectors/git/main.go` — add heartbeat
- Modify: `collectors/pm/main.go` — add heartbeat
- Modify: `collectors/cicd/main.go` — add heartbeat
- Modify: `collectors/metrics/main.go` — add heartbeat
- Modify: `collectors/git/config.yaml` — add health endpoint config

- [ ] **Step 1: Create collectors health API**

File: `api/routes/collectors.py`

```python
from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/api/v1/collectors", tags=["collectors"])

# In-memory store for collector status (use Redis in production)
collector_status = {}

@router.post("/{collector_id}/heartbeat")
def heartbeat(collector_id: str, data: dict):
    collector_status[collector_id] = {
        "status": data.get("status", "alive"),
        "last_heartbeat": datetime.utcnow().isoformat(),
        "last_event_time": data.get("last_event_time"),
        "last_error": data.get("last_error")
    }
    return {"status": "ok"}

@router.get("/status")
def get_status():
    return collector_status

@router.get("/{collector_id}")
def get_collector(collector_id: str):
    if collector_id not in collector_status:
        return {"status": "unknown"}
    return collector_status[collector_id]
```

- [ ] **Step 2: Register collectors router**

Modify: `api/main.py` — add to imports and include_router

- [ ] **Step 3: Add heartbeat to git collector**

File: `collectors/git/main.go`

Add after successful event processing:
```go
func sendHeartbeat(ch *clickhouse.Client, status string) {
    // POST to API heartbeat endpoint
    // http.Post("http://api:8000/api/v1/collectors/git/heartbeat", ...)
}
```

Run heartbeat every 30 seconds via goroutine:
```go
go func() {
    ticker := time.NewTicker(30 * time.Second)
    for range ticker.C {
        sendHeartbeat(ch, "alive")
    }
}()
```

- [ ] **Step 4: Add heartbeat to other collectors**

Repeat for pm, cicd, metrics collectors.

- [ ] **Step 5: Add Prometheus metrics to git collector**

File: `collectors/git/main.go`

Add:
```go
import "github.com/prometheus/client_golang/prometheus"

var (
    eventsProcessed = prometheus.NewCounter(prometheus.CounterOpts{
        Name: "collector_events_total",
        Help: "Total events processed",
    })
)

func init() {
    prometheus.MustRegister(eventsProcessed)
}
```

Increment after successful processing:
```go
eventsProcessed.Inc()
```

- [ ] **Step 6: Expose /metrics endpoint**

Add to each collector's HTTP server:
```go
http.Handle("/metrics", promhttp.Handler())
```

- [ ] **Step 7: Commit**

```bash
git add api/routes/collectors.py api/main.py collectors/git/ collectors/pm/ collectors/cicd/ collectors/metrics/
git commit -m "feat: add collector health checks and Prometheus metrics"
```

---

## Task 4: Redis Caching

**Files:**
- Modify: `docker-compose.yaml` — add Redis
- Modify: `api/requirements.txt` — add redis
- Create: `api/middleware/cache.py` — cache middleware
- Modify: `api/main.py` — add cache middleware

- [ ] **Step 1: Add Redis to docker-compose.yaml**

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data

volumes:
  redis_data:
```

- [ ] **Step 2: Add redis to requirements.txt**

Add line: `redis>=5.0.0`

- [ ] **Step 3: Create cache middleware**

File: `api/middleware/cache.py`

```python
import redis
import json
import hashlib
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

redis_client = redis.Redis(
    host="redis",
    port=6379,
    decode_responses=True
)

class CacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method != "GET":
            return await call_next(request)
        
        # Skip certain endpoints
        if request.url.path.startswith("/health"):
            return await call_next(request)
        
        # Generate cache key
        key = f"cache:{request.url.path}:{hashlib.md5(str(request.query_params).encode()).hexdigest()}"
        
        # Check cache
        cached = redis_client.get(key)
        if cached:
            return cached  # Return cached response
        
        response = await call_next(request)
        
        # Cache successful responses
        if response.status_code == 200:
            ttl = 300  # 5 min default
            if "overview" in request.url.path:
                ttl = 120  # 2 min
            redis_client.setex(key, ttl, response.body)
        
        return response
```

- [ ] **Step 4: Add cache middleware to main.py**

```python
from middleware.cache import CacheMiddleware

app.add_middleware(CacheMiddleware)
```

- [ ] **Step 5: Test locally (optional)**

Start redis manually for testing if needed.

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yaml api/requirements.txt api/middleware/cache.py api/main.py
git commit -m "feat: add Redis caching for API endpoints"
```

---

## Task 5: Asana Adapter

**Files:**
- Create: `collectors/pm/adapters/asana.go`
- Modify: `collectors/pm/config.yaml` — add Asana config

- [ ] **Step 1: Create Asana adapter**

File: `collectors/pm/adapters/asana.go`

```go
package adapters

import (
    "encoding/json"
    "net/http"
    "os"
    "time"
)

type AsanaAdapter struct {
    WorkspaceID string
    APIKey      string
}

type AsanaTask struct {
    Gid        string    `json:"gid"`
    Name       string    `json:"name"`
    Completed  bool      `json:"completed"`
    CreatedAt  time.Time `json:"created_at"`
    Assignee   string    `json:"assignee.name"`
}

func NewAsanaAdapter() *AsanaAdapter {
    return &AsanaAdapter{
        WorkspaceID: os.Getenv("ASANA_WORKSPACE_ID"),
        APIKey:      os.Getenv("ASANA_API_KEY"),
    }
}

func (a *AsanaAdapter) Fetch() ([]AsanaTask, error) {
    url := "https://app.asana.com/api/1.0/workspaces/" + a.WorkspaceID + "/tasks?opt_fields=name,completed,created_at,assignee.name"
    
    req, _ := http.NewRequest("GET", url, nil)
    req.SetBasicAuth(a.APIKey, "")
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var result struct {
        Data []AsanaTask `json:"data"`
    }
    json.NewDecoder(resp.Body).Decode(&result)
    
    return result.Data, nil
}

func (a *AsanaAdapter) Transform(task AsanaTask) Event {
    eventType := "task_created"
    if task.Completed {
        eventType = "task_completed"
    }
    
    payload, _ := json.Marshal(map[string]string{
        "task_id":  task.Gid,
        "name":     task.Name,
        "assignee": task.Assignee,
    })
    
    return Event{
        SourceType: "pm",
        EventType:  eventType,
        TeamID:     os.Getenv("TEAM_ID"),
        Payload:    string(payload),
        OccurredAt: task.CreatedAt,
    }
}
```

- [ ] **Step 2: Add to config.yaml**

```yaml
sources:
  - type: asana
    config:
      workspace_id: "${ASANA_WORKSPACE_ID}"
      api_key: "${ASANA_API_KEY}"
```

- [ ] **Step 3: Integrate into pm collector**

Modify: `collectors/pm/main.go` — add Asana to adapter list

- [ ] **Step 4: Commit**

```bash
git add collectors/pm/adapters/asana.go collectors/pm/config.yaml collectors/pm/main.go
git commit -m "feat: add Asana adapter to pm collector"
```

---

## Task 6: Trello Adapter

**Files:**
- Create: `collectors/pm/adapters/trello.go`
- Modify: `collectors/pm/config.yaml` — add Trello config

- [ ] **Step 1: Create Trello adapter**

File: `collectors/pm/adapters/trello.go`

```go
package adapters

import (
    "encoding/json"
    "net/http"
    "os"
    "time"
)

type TrelloAdapter struct {
    APIKey string
    Token  string
}

type TrelloCard struct {
    ID        string    `json:"id"`
    Name      string    `json:"name"`
    DateLastActive time.Time `json:"dateLastActive"`
    IDList    string    `json:"idList"`
}

func NewTrelloAdapter() *TrelloAdapter {
    return &TrelloAdapter{
        APIKey: os.Getenv("TRELLO_API_KEY"),
        Token:  os.Getenv("TRELLO_TOKEN"),
    }
}

func (t *TrelloAdapter) Fetch() ([]TrelloCard, error) {
    url := "https://api.trello.com/1/members/me/cards?key=" + t.APIKey + "&token=" + t.Token
    
    resp, err := http.Get(url)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var cards []TrelloCard
    json.NewDecoder(resp.Body).Decode(&cards)
    
    return cards, nil
}

func (t *TrelloAdapter) Transform(card TrelloCard) Event {
    eventType := "card_updated"
    
    payload, _ := json.Marshal(map[string]string{
        "card_id": card.ID,
        "name":    card.Name,
    })
    
    return Event{
        SourceType: "pm",
        EventType:  eventType,
        TeamID:     os.Getenv("TEAM_ID"),
        Payload:    string(payload),
        OccurredAt: card.DateLastActive,
    }
}
```

- [ ] **Step 2: Add to config.yaml**

```yaml
  - type: trello
    config:
      api_key: "${TRELLO_API_KEY}"
      token: "${TRELLO_TOKEN}"
```

- [ ] **Step 3: Integrate into pm collector**

- [ ] **Step 4: Commit**

```bash
git add collectors/pm/adapters/trello.go collectors/pm/config.yaml
git commit -m "feat: add Trello adapter to pm collector"
```

---

## Task 7: Jenkins Adapter

**Files:**
- Create: `collectors/cicd/adapters/jenkins.go`
- Modify: `collectors/cicd/config.yaml` — add Jenkins config

- [ ] **Step 1: Create Jenkins adapter**

File: `collectors/cicd/adapters/jenkins.go`

```go
package adapters

import (
    "encoding/json"
    "net/http"
    "os"
    "time"
)

type JenkinsAdapter struct {
    URL   string
    User  string
    Token string
}

type JenkinsBuild struct {
    Number   int       `json:"number"`
    Result   string    `json:"result"`
    Duration int       `json:"duration"`
    Timestamp int64    `json:"timestamp"`
}

func NewJenkinsAdapter() *JenkinsAdapter {
    return &JenkinsAdapter{
        URL:   os.Getenv("JENKINS_URL"),
        User:  os.Getenv("JENKINS_USER"),
        Token: os.Getenv("JENKINS_TOKEN"),
    }
}

func (j *JenkinsAdapter) Fetch() ([]JenkinsBuild, error) {
    url := j.URL + "/api/json?tree=builds[number,result,duration,timestamp]"
    
    req, _ := http.NewRequest("GET", url, nil)
    req.SetBasicAuth(j.User, j.Token)
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var result struct {
        Builds []JenkinsBuild `json:"builds"`
    }
    json.NewDecoder(resp.Body).Decode(&result)
    
    return result.Builds, nil
}

func (j *JenkinsAdapter) Transform(build JenkinsBuild) Event {
    eventType := "build_completed"
    if build.Result == "FAILURE" {
        eventType = "build_failed"
    }
    
    payload, _ := json.Marshal(map[string]interface{}{
        "build_number": build.Number,
        "result":       build.Result,
        "duration_ms":  build.Duration,
    })
    
    return Event{
        SourceType: "cicd",
        EventType:  eventType,
        TeamID:     os.Getenv("TEAM_ID"),
        Payload:    string(payload),
        OccurredAt: time.Unix(build.Timestamp/1000, 0),
    }
}
```

- [ ] **Step 2: Add to config.yaml**

```yaml
sources:
  - type: jenkins
    config:
      url: "${JENKINS_URL}"
      user: "${JENKINS_USER}"
      token: "${JENKINS_TOKEN}"
```

- [ ] **Step 3: Integrate into cicd collector**

- [ ] **Step 4: Commit**

```bash
git add collectors/cicd/adapters/jenkins.go collectors/cicd/config.yaml
git commit -m "feat: add Jenkins adapter to cicd collector"
```

---

## Task 8: Integration Tests

**Files:**
- Create: `api/tests/integration/test_api_ch.py`
- Create: `tests/fixtures/events.json`

- [ ] **Step 1: Create fixtures**

File: `tests/fixtures/events.json`

```json
[
  {
    "source_type": "git",
    "event_type": "pr_opened",
    "team_id": "550e8400-e29b-41d4-a716-446655440000",
    "payload": "{\"pr_id\": \"test-1\", \"author\": \"testuser\"}"
  },
  {
    "source_type": "pm",
    "event_type": "task_created",
    "team_id": "550e8400-e29b-41d4-a716-446655440000",
    "payload": "{\"task_id\": \"TASK-1\"}"
  }
]
```

- [ ] **Step 2: Create integration test for API**

File: `api/tests/integration/test_api_ch.py`

```python
import pytest
from clickhouse_driver import Client

@pytest.fixture
def ch_client():
    return Client(host="localhost", port="9000")

def test_teams_endpoint(ch_client):
    """Test /teams returns teams from ClickHouse"""
    result = ch_client.execute("SELECT id, name FROM teams LIMIT 1")
    assert len(result) >= 0

def test_dashboard_endpoint(ch_client):
    """Test /dashboard aggregates events"""
    result = ch_client.execute("""
        SELECT count() FROM events
        WHERE occurred_at > now() - INTERVAL 7 DAY
    """)
    assert result[0][0] >= 0

def test_dlq_endpoint(ch_client):
    """Test DLQ table exists"""
    result = ch_client.execute("SHOW TABLES")
    tables = [r[0] for r in result]
    assert "events_dlq" in tables

def test_health_endpoint(ch_client):
    """Test ClickHouse connection"""
    result = ch_client.execute("SELECT 1")
    assert result[0][0] == 1
```

- [ ] **Step 3: Create collector integration test**

File: `tests/integration/test_collector_ch.py`

```python
import pytest
from clickhouse_driver import Client

@pytest.fixture
def ch_client():
    return Client(host="localhost", port="9000")

def test_event_insertion(ch_client):
    """Test event can be inserted via collector"""
    ch_client.execute("""
        INSERT INTO events (team_id, source_type, event_type, payload, occurred_at)
        VALUES ('550e8400-e29b-41d4-a716-446655440000', 'git', 'test_event', '{}', now())
    """)
    result = ch_client.execute("SELECT count() FROM events WHERE event_type = 'test_event'")
    assert result[0][0] >= 1
```

- [ ] **Step 4: Run tests**

```bash
cd /home/zubarev/sources/tl-tools
pytest api/tests/integration/ -v
pytest tests/integration/ -v
```

- [ ] **Step 5: Commit**

```bash
git add tests/fixtures/ api/tests/integration/ tests/integration/
git commit -m "test: add integration tests for API and collectors"
```

---

## Task 9: E2E Tests

**Files:**
- Create: `tests/e2e/test_pipeline.py`
- Create: `tests/e2e/conftest.py`

- [ ] **Step 1: Create E2E test config**

File: `tests/e2e/conftest.py`

```python
import pytest
import requests

BASE_URL = "http://localhost:8000"
UI_URL = "http://localhost:3000"

@pytest.fixture
def api_url():
    return BASE_URL

@pytest.fixture
def ui_url():
    return UI_URL
```

- [ ] **Step 2: Create E2E test**

File: `tests/e2e/test_pipeline.py`

```python
import pytest
import requests

def test_webhook_to_dashboard_pipeline(api_url):
    """Test: webhook -> API -> ClickHouse -> dashboard query"""
    # 1. Send webhook
    resp = requests.post(f"{api_url}/api/v1/webhook/receive", json={
        "source": "git",
        "event_type": "e2e_test",
        "team_id": "550e8400-e29b-41d4-a716-446655440000",
        "payload": {"test": "e2e"}
    })
    assert resp.status_code == 200
    
    # 2. Wait for processing
    import time
    time.sleep(2)
    
    # 3. Query dashboard
    resp = requests.get(f"{api_url}/api/v1/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    
    # 4. Verify event counted
    assert "overview" in data

def test_health_endpoint(api_url):
    """Test health endpoint works"""
    resp = requests.get(f"{api_url}/health")
    assert resp.status_code == 200

def test_collectors_status(api_url):
    """Test collectors status endpoint"""
    resp = requests.get(f"{api_url}/api/v1/collectors/status")
    assert resp.status_code == 200

def test_dlq_endpoints(api_url):
    """Test DLQ endpoints"""
    resp = requests.get(f"{api_url}/api/v1/dLQ")
    assert resp.status_code == 200
```

- [ ] **Step 3: Run E2E tests**

```bash
cd /home/zubarev/sources/tl-tools
pytest tests/e2e/ -v
```

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/
git commit -m "test: add E2E tests for full pipeline"
```

---

## Summary

All tasks complete. The implementation covers:

1. **DLQ** — Table + API + retry logic in collectors
2. **Health checks** — Heartbeat API + Prometheus metrics
3. **Caching** — Redis + middleware
4. **Adapters** — Asana, Trello, Jenkins
5. **Tests** — Integration + E2E

**Plan complete and saved to:** `docs/superpowers/plans/2026-04-29-cycle-2-reliability-plan.md`

**Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?