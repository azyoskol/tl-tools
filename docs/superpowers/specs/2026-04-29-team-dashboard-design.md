# Team Dashboard MVP — Design Specification

## Overview

A multi-team developer productivity dashboard that aggregates metrics from multiple sources (GitHub, GitLab, Jira, Linear, CI/CD, Prometheus) and provides real-time operational insights and retrospective analytics.

**Stack**: React + FastAPI (Python) + Go (Collectors) + ClickHouse + Kubernetes

---

## 1. High-Level Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Sources   │     │  Collectors │     │  ClickHouse │
│             │     │   (Go)       │     │             │
│ GitHub/GitLab│────▶│  Workers    │────▶│   Storage   │
│ Jira/Linear │     │             │     │             │
│ CI/CD       │     └─────────────┘     └──────┬──────┘
│ Prometheus  │                                   │
└─────────────┘                            ┌──────▼──────┐
                                           │  FastAPI    │
                                           │  (Python)   │
                                           └──────┬──────┘
                                                  │
                                           ┌──────▼──────┐
                                           │   React UI  │
                                           │  Dashboard  │
                                           └─────────────┘
```

**Data Flow**: Sources → Go Collectors (push/webhooks) → ClickHouse → Python API → React UI

---

## 2. Components

### 2.1 Go Collectors

Six independent collector services, each handling one source:

| Collector | Sources (configurable) | Data Collected |
|-----------|--------|----------------|
| `git-collector` | GitHub, GitLab | commits, PRs/MRs, reviews, issues, pipelines |
| `pm-collector` | Jira, Linear, Asana, Trello | issues, sprints, cycles, velocity |
| `cicd-collector` | GitHub Actions, GitLab CI, Jenkins, CircleCI | pipeline runs, duration, status |
| `metrics-collector` | Prometheus, DataDog, Grafana | custom metrics, app metrics |

Each collector uses pluggable adapters. To add a new source:
1. Implement adapter interface (fetch, transform)
2. Register in config
3. No code changes to collector core

**Collector responsibilities**:
- Receive webhooks or poll API periodically
- Validate incoming data
- Transform to unified event schema
- Enrich with team_id, project_id
- Batch insert to ClickHouse

### 2.2 ClickHouse Schema

**Raw events table**:
```sql
CREATE TABLE events (
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
```

**Materialized views**:

| View | Purpose | Key Fields |
|------|---------|------------|
| `daily_aggregates` | Daily counts per source/event | team_id, date, source_type, count |
| `pr_metrics` | PR lifecycle tracking | team_id, pr_id, author, created_at, merged_at, first_review_at, pr_size |
| `cycle_metrics` | Cycle time by task | team_id, task_id, started_at, completed_at, story_points |
| `team_workload` | User daily workload | team_id, user_id, date, tasks_created, tasks_completed, points_completed |
| `cicd_health` | CI/CD pipeline stats | team_id, project, date, success_count, failed_count, avg_duration |
| `realtime_alerts` | Attention items | team_id, alert_type, details, created_at |

### Daily Aggregates
```sql
CREATE MATERIALIZED VIEW daily_aggregates
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
```
**Graphs**: commits/day, PRs opened/merged, issues created/resolved

### PR Metrics
```sql
CREATE MATERIALIZED VIEW pr_metrics
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
```
**Graphs**: PR merge time, review time, PR size distribution, author throughput

### Cycle Metrics
```sql
CREATE MATERIALIZED VIEW cycle_metrics
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
```
**Graphs**: Cycle time distribution, velocity per sprint, lead time

### Team Workload
```sql
CREATE MATERIALIZED VIEW team_workload
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
```
**Graphs**: Individual workload, blocked tasks per user, team capacity

### CI/CD Health
```sql
CREATE MATERIALIZED VIEW cicd_health
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
```
**Graphs**: Success rate, avg duration, failure frequency, trends

### Realtime Alerts
```sql
CREATE MATERIALIZED VIEW realtime_alerts
ENGINE = MergeTree()
ORDER BY (team_id, alert_type, created_at)
AS SELECT
    team_id,
    event_type AS alert_type,
    payload AS details,
    occurred_at AS created_at
FROM events
WHERE event_type IN ('pr_stale', 'task_overdue', 'ci_failed', 'task_blocked');
```
**Dashboard**: Real-time alerts filtered by team

### 2.3 Python API (FastAPI)

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/teams` | List all teams |
| `GET /api/v1/teams/{id}` | Get single team |
| `GET /api/v1/teams/{id}/overview` | Main dashboard — key metrics |
| `GET /api/v1/teams/{id}/activity` | Activity graphs (commits, PRs, tasks) |
| `GET /api/v1/teams/{id}/velocity` | Velocity and cycle time trends |
| `GET /api/v1/teams/{id}/insights` | Automated attention items |
| `GET /api/v1/dashboard` | Overall dashboard with aggregated metrics |
| `POST /api/v1/webhook/receive` | Generic webhook endpoint |
| `POST /api/v1/webhook/github` | GitHub webhook endpoint |
| `POST /api/v1/webhook/gitlab` | GitLab webhook endpoint |
| `POST /api/v1/webhook/jira` | Jira webhook endpoint |
| `POST /api/v1/webhook/linear` | Linear webhook endpoint |
| `GET /health` | Health check |
| `GET /health/clickhouse` | DB connectivity check |

### 2.4 React Dashboard

**Pages**:
1. **Team Selector** — dropdown to switch between teams
2. **Overview** — key metrics cards, activity graph, attention items
3. **Activity** — detailed charts per source
4. **Velocity** — retrospective metrics (cycle time, velocity trend)
5. **Insights** — rule-based recommendations

---

## 3. Metrics & Attention Items

### Operational Metrics (Overview)

| Metric | Source | Purpose |
|--------|--------|---------|
| PRs awaiting review | GitHub/GitLab | Identify bottlenecks |
| PR merge time | GitHub/GitLab | Track review efficiency |
| Blocked tasks | Jira/Linear | Highlight blockers |
| Overdue tasks | Jira/Linear | Risk prediction |
| CI/CD failures | GitHub Actions/GitLab CI | Detect issues |
| Deployment frequency | CI/CD | Release health |
| WIP count | Jira/Linear | Context switching indicator |

### Attention Items (Rule-based for MVP)

- "3 PRs waiting for review > 2 days"
- "2 tasks blocked by 'awaiting deployment'"
- "1 task overdue by 3 days"
- "CI failed 3 times in last hour"
- "PR with 2000+ lines, consider split"

**Note**: For MVP, teams are configured via config.yaml in each collector. Later, a team management API will be added.

### Retrospective Metrics

| Metric | Formula |
|--------|---------|
| Cycle time | done_at - in_progress_at |
| Velocity | story points completed per sprint |
| Lead time | created_at - delivered_at |
| PR throughput | merged PRs per week |

### Multi-Team View

- **Company Dashboard** — aggregated metrics across all teams
- **Compare teams** — side-by-side velocity, PR time, deployments

---

## 4. Error Handling

### Collectors (Go)

| Scenario | Behavior |
|----------|----------|
| Source unavailable | Retry with exponential backoff (3 attempts, then 15 min) |
| Rate limit hit | Backoff + log, do not lose data |
| Malformed webhook | Log to error bucket, skip event |
| ClickHouse unavailable | Buffer in memory (max 1000 events), flush on recovery |

**Dead Letter Queue**: Failed events stored in separate table for manual review.

### API (Python)

| Scenario | Behavior |
|----------|----------|
| ClickHouse timeout | Return cached data (5 min TTL) + warning header |
| Invalid team_id | 404 with clear message |
| Slow query | 30s timeout, return partial + warning |

---

## 5. Testing Strategy

### Unit Tests
- Go Collectors: Transform functions, validation, mapping
- Python API: Endpoints, business logic, serialization
- React Components: Rendering, user interactions

### Integration Tests
- Collector → ClickHouse: Real event insertion, schema validation
- API → ClickHouse: Query correctness

### E2E
- Full data pipeline: webhook → collector → clickhouse → API → UI

---

## 6. Deployment

### Docker Images

| Component | Image |
|-----------|-------|
| Go Collectors | `team-dashboard/collector-{source}:latest` (4 images) |
| Python API | `team-dashboard/api:latest` |
| React UI | `team-dashboard/ui:latest` |
| ClickHouse | `clickhouse/clickhouse-server:latest` or managed |

### Docker Compose (local dev)

```yaml
version: '3.8'
services:
  clickhouse:
    image: clickhouse/clickhouse-server
    volumes:
      - ./data/clickhouse:/var/lib/clickhouse
  
  api:
    build: ./api
    depends_on: [clickhouse]
    ports: [8000:8000]
  
  ui:
    build: ./ui
    ports: [3000:80]
  
  collector-github:
    build: ./collectors/git
    environment:
      - CLICKHOUSE_HOST=clickhouse
      - WEBHOOK_PORT=8080
```

### Helm Chart (Kubernetes)

```
helm/team-dashboard/
├── Chart.yaml
├── values.yaml
├── values-prod.yaml
├── values-staging.yaml
└── templates/
    ├── _helpers.tpl
    ├── clickhouse/
    │   ├── statefulset.yaml
    │   └── service.yaml
    ├── api/
    │   ├── deployment.yaml
    │   └── service.yaml
    ├── collectors/
    │   ├── git-deployment.yaml
    │   ├── pm-deployment.yaml
    │   ├── cicd-deployment.yaml
    │   └── metrics-deployment.yaml
    ├── ui/
    │   ├── deployment.yaml
    │   └── ingress.yaml
    └── configmap.yaml
```

**values.yaml includes**:
- Resource limits per component
- HPA (Horizontal Pod Autoscaler) for collectors and API
- Ingress with TLS
- Secrets via external secrets operator or Vault

---

## 7. Data Freshness

| Data Type | Expected Freshness |
|-----------|-------------------|
| Operational (blocked tasks, PRs waiting) | ~1-5 minutes |
| Activity charts | ~15 minutes |
| Retrospective (velocity, cycle time) | ~1 hour |

---

## 8. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Recharts/Visx |
| API | Python + FastAPI |
| Collectors | Go |
| Storage | ClickHouse |
| Containerization | Docker |
| Orchestration | Kubernetes + Helm |
| CI/CD | GitHub Actions |

---

## 9. Roadmap

### Cycle 1: MVP (Core)

**Goal**: Working dashboard with basic metrics

- [x] Go collectors (git, pm, cicd, metrics) with basic adapters
- [x] ClickHouse schema + materialized views
- [x] FastAPI with core endpoints + webhooks
- [x] React dashboard with team selector + overview
- [x] Docker Compose for local dev
- [x] Basic Helm chart for K8s
- [x] Unit tests for collectors and API
- [x] Overall dashboard with aggregated metrics
- [x] Bar charts (replaced line charts)
- [x] Additional visualizations (hourly activity, top authors)

### Cycle 2: Reliability & Coverage

**Goal**: Production-ready, error handling, more sources

- [ ] Add adapters: Asana, Trello, Jenkins, DataDog, Grafana
- [ ] Dead Letter Queue implementation
- [ ] Collector health checks + monitoring
- [ ] API caching + timeout handling
- [ ] Integration tests (collector → CH)
- [ ] E2E tests for data pipeline

### Cycle 3: UI/UX Polish

**Goal**: Better visualizations, user experience

- [ ] Activity page with detailed charts per source
- [ ] Velocity page with cycle time trends
- [ ] Insights page with rule-based recommendations
- [ ] Multi-team view for managers
- [ ] Team comparison view
- [ ] UI tests

### Cycle 4: Advanced Features

**Goal**: Smarter insights, better analytics

- [ ] Team management API (add/edit teams)
- [ ] Project-level filtering
- [ ] Custom alerts configuration
- [ ] Data export (CSV, JSON)
- [ ] Dashboard sharing / embed

### Cycle 5: Scale & Performance

**Goal**: Handle larger datasets, better performance

- [ ] Query optimization (aggregations in CH)
- [ ] Grafana integration (use existing Grafana instead of custom UI)
- [ ] RBAC / permissions
- [ ] Audit logging

### Cycle 6: Enterprise

**Goal**: Enterprise features, SaaS readiness

- [ ] SSO / OAuth
- [ ] Multi-tenant isolation
- [ ] Usage analytics
- [ ] Custom branding
- [ ] SLA monitoring
- [ ] API rate limiting