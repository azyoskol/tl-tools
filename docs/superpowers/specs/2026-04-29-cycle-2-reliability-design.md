# Cycle 2: Reliability & Coverage — Design Specification

## Goal

Production-ready system with error handling, more adapters, health monitoring, caching, and comprehensive tests.

---

## 1. Adapters: Asana, Trello, Jenkins

### Structure

```
collectors/
├── pm/
│   └── adapters/
│       ├── asana.go      # Asana API client
│       ├── trello.go     # Trello REST API
│       └── types.go      # Shared interfaces
├── cicd/
│   └── adapters/
│       └── jenkins.go   # Jenkins REST API
```

### Interface

Each adapter implements:

```go
type Adapter interface {
    Fetch() ([]RawEvent, error)
    Transform(raw RawEvent) Event
}
```

### Data Collected

| Adapter | Events |
|---------|--------|
| Asana | tasks, task_completed, task_assigned, comment_added |
| Trello | card_created, card_moved, card_deleted, comment_added |
| Jenkins | build_started, build_completed, build_failed, stage_started |

### Configuration

```yaml
sources:
  - type: asana
    config:
      workspace_id: "${ASANA_WORKSPACE_ID}"
      api_key: "${ASANA_API_KEY}"
  - type: trello
    config:
      api_key: "${TRELLO_API_KEY}"
      token: "${TRELLO_TOKEN}"
  - type: jenkins
    config:
      url: "${JENKINS_URL}"
      user: "${JENKINS_USER}"
      token: "${JENKINS_TOKEN}"
```

---

## 2. Dead Letter Queue (DLQ)

### Implementation

**ClickHouse Table:**

```sql
CREATE TABLE events_dlq (
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
ORDER BY created_at;
```

**Retry Logic:**

| Attempt | Delay |
|---------|-------|
| 1 | 1 second |
| 2 | 4 seconds |
| 3 | 16 seconds |
| → DLQ | permanent |

**Flow:**

```
Collector attempts insert
    │
    ▼
Success → ClickHouse
    │
    Failure
    │
    ▼
Retry attempt (max 3)
    │
    ├─ Success → ClickHouse
    │
    └─ Failed → DLQ table
```

**API Endpoints:**

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/dLQ` | List failed events |
| `GET /api/v1/dLQ/{id}` | Get single failed event |
| `POST /api/v1/dLQ/{id}/retry` | Retry failed event |
| `DELETE /api/v1/dLQ/{id}` | Remove from DLQ |

---

## 3. Collector Health Checks

### Push Model (Heartbeat)

**Endpoint:**
```
POST /api/v1/collectors/{collector_id}/heartbeat
{
  "status": "alive" | "failed",
  "last_event_time": "2026-04-29T12:00:00Z",
  "last_error": "optional error message"
}
```

**Frequency:** Every 30 seconds

**Health API Response:**
```json
GET /api/v1/collectors/status

{
  "git": {
    "status": "alive",
    "last_heartbeat": "2026-04-29T12:00:00Z",
    "last_event_time": "2026-04-29T11:59:00Z"
  },
  "pm": {
    "status": "failed",
    "last_heartbeat": "2026-04-29T12:00:00Z",
    "last_error": "Connection refused to Asana"
  }
}
```

### Prometheus Metrics

Each collector exposes:

```go
var (
    EventsProcessed = prometheus.NewCounter(
        prometheus.CounterOpts{
            Name: "collector_events_total",
            Help: "Total events processed",
        },
    )
    CollectorErrors = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "collector_errors_total",
            Help: "Total errors by type",
        },
        []string{"collector", "error_type"},
    )
    LastSuccessTimestamp = prometheus.NewGauge(
        prometheus.GaugeOpts{
            Name: "collector_last_success_timestamp",
            Help: "Timestamp of last successful event",
        },
    )
)
```

**Scrape endpoint:** `GET /metrics` on each collector

---

## 4. API Caching (Redis)

### Architecture

```
┌─────────────┐    ┌─────────┐    ┌─────────────┐
│   Redis     │◄───│ FastAPI │◄───│  ClickHouse │
│  (cache)    │    │ (API)   │    │  (storage)  │
└─────────────┘    └─────────┘    └─────────────┘
```

### Cached Endpoints

| Endpoint | TTL | Invalidation |
|----------|-----|--------------|
| `GET /api/v1/dashboard` | 5 min | On new event |
| `GET /api/v1/teams/{id}/overview` | 2 min | On new event for team |
| `GET /api/v1/teams/{id}/activity` | 5 min | On new event for team |

### Implementation

```python
# Middleware pattern
@app.middleware("http")
async def cache_response(request: Request, call_next):
    # Check cache for GET requests
    # Return cached if exists
    # Store response in cache on success
```

### Redis Configuration

```yaml
redis:
  host: "redis"
  port: 6379
  db: 0
  password: "${REDIS_PASSWORD}"
```

---

## 5. Tests

### Integration Tests

**Test Files:**

- `api/tests/integration/test_api_ch.py` — API → ClickHouse queries
- `collectors/git/tests/integration/test_collector_ch.py` — collector → ClickHouse

**Scenarios:**

- Insert events via collector, verify in ClickHouse
- Query API with filters, verify correct data
- Test error handling (invalid data, connection failures)

### E2E Tests

**Test File:** `tests/e2e/test_pipeline.py`

**Scenarios:**

1. **Full webhook pipeline:**
   - Send webhook → API webhook endpoint → ClickHouse → API query → verify data

2. **Collector pipeline:**
   - Mock external API → collector fetch → transform → insert → verify

3. **Dashboard pipeline:**
   - Insert test data → query dashboard API → verify response structure

**Test Data:**

- Fixtures in `tests/fixtures/` — sample events for each source
- Mock responses in `tests/mocks/` — fake API responses for collectors

---

## 6. Docker Compose Updates

Add Redis:

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
```

---

## 7. Environment Variables

| Variable | Description |
|----------|-------------|
| `REDIS_HOST` | Redis host |
| `REDIS_PORT` | Redis port |
| `ASANA_API_KEY` | Asana API key |
| `ASANA_WORKSPACE_ID` | Asana workspace |
| `TRELLO_API_KEY` | Trello API key |
| `TRELLO_TOKEN` | Trello token |
| `JENKINS_URL` | Jenkins URL |
| `JENKINS_USER` | Jenkins user |
| `JENKINS_TOKEN` | Jenkins token |

---

## 8. Breaking Changes

None. All additions are backward compatible.

---

## 9. Future Considerations (Not in Scope)

- Grafana integration (Cycle 5)
- DataDog adapter
- RBAC / permissions