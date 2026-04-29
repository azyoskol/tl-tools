# Team Dashboard

Developer productivity dashboard for multiple teams. Track your team's performance in real-time.

## Features

### Metrics & Charts

| Chart | Source | Purpose |
|-------|--------|---------|
| **Commits per day** | GitHub/GitLab | Development activity, work patterns |
| **PRs opened/merged** | GitHub/GitLab | Code review speed, bottlenecks |
| **PR merge time** | GitHub/GitLab | Time from creation to merge |
| **Cycle time** | Jira/Linear | Time from start to task completion |
| **Velocity** | Jira/Linear | Team speed per sprint |
| **CI/CD success rate** | GitHub Actions/GitLab CI | Build stability |
| **CI duration** | GitHub Actions/GitLab CI | CI/CD speed |
| **Blocked tasks** | Jira/Linear | Blocked work items |
| **WIP count** | Jira/Linear | Work in progress (context switching) |
| **CPU/Memory** | Prometheus | Application resources |

### Attention Items

Automated alerts that draw attention to issues:

- ⚠️ PRs waiting for review > 2 days
- ⚠️ Tasks blocked > 1 day
- ⚠️ Tasks overdue > 3 days
- ⚠️ CI failures in last hour
- ⚠️ Large PRs (>1000 lines)

### Dashboard Pages

1. **Overview** — main page with key metrics
   - Cards: PRs awaiting, Blocked tasks, CI failures
   - 7-day activity chart
   - Attention items

2. **Activity** — detailed charts by source
   - Git: commits, PRs, reviews
   - PM: tasks, blockers
   - CI/CD: pipelines, failures

3. **Velocity** — retrospective analysis
   - Cycle time distribution
   - Velocity per sprint
   - Lead time trends

4. **Insights** — recommendations
   - Rule-based alerts
   - Productivity trends

### Multi-Team Support

- Team selector at the top of the page
- Separate data per team
- Company-wide view for managers

## Data Flow

```
GitHub/GitLab ──┐
Jira/Linear  ───┼──> Go Collectors ──> ClickHouse ──> FastAPI ──> React UI
CI/CD        ───┤                      (Materialized Views)
Prometheus   ───┘
```

### Architecture

- **Collectors (Go)**: 4 services for data collection from different sources
  - `git-collector` — GitHub, GitLab (commits, PRs, MRs)
  - `pm-collector` — Jira, Linear (tasks, sprints)
  - `cicd-collector` — GitHub Actions, GitLab CI, Jenkins
  - `metrics-collector` — Prometheus, DataDog

- **Storage**: ClickHouse with materialized views
- **API**: FastAPI (Python)
- **UI**: React + Recharts

## Quick Start

### Docker Compose (recommended)

```bash
# Clone and run
git clone https://github.com/azyoskol/tl-tools.git
cd tl-tools
docker-compose up -d

# Access
# UI:         http://localhost:3000
# API:        http://localhost:8000
# ClickHouse: http://localhost:8123
```

### Load Test Data

```bash
# Create tables
docker exec -i clickhouse clickhouse-client < clickhouse/schema.sql

# Load mock data
docker exec -i clickhouse clickhouse-client < clickhouse/mock_data.sql
```

## Webhooks

Configure webhooks in your source systems to send events to the dashboard:

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/webhook/receive` | Generic webhook (source, event_type, payload) |
| `POST /api/v1/webhook/github` | GitHub webhooks (auto-parsed) |
| `POST /api/v1/webhook/gitlab` | GitLab webhooks (auto-parsed) |
| `POST /api/v1/webhook/jira` | Jira webhooks (auto-parsed) |
| `POST /api/v1/webhook/linear` | Linear webhooks (auto-parsed) |

Example generic webhook:
```bash
curl -X POST http://localhost:8000/api/v1/webhook/receive \
  -H "Content-Type: application/json" \
  -d '{"source":"git","event_type":"pr_opened","team_id":"550e8400-e29b-41d4-a716-446655440000","payload":{"pr_id":"123","author":"john"}}'
```

## Configuration

### Collector config.yaml

Each collector is configured via `config.yaml`:

```yaml
clickhouse:
  host: "clickhouse"
  port: 9000

teams:
  - id: "550e8400-..."
    name: "Platform Team"
    sources:
      - type: "github"
        config:
          token: "${GITHUB_TOKEN}"
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `CLICKHOUSE_HOST` | ClickHouse host |
| `CLICKHOUSE_PORT` | ClickHouse port (default: 9000) |
| `GITHUB_TOKEN` | GitHub API token |
| `GITLAB_TOKEN` | GitLab API token |
| `JIRA_URL` | Jira URL |
| `JIRA_EMAIL` | Jira email |
| `JIRA_TOKEN` | Jira API token |
| `LINEAR_API_KEY` | Linear API key |
| `PROMETHEUS_URL` | Prometheus URL |

## Development

### Prerequisites

- Go 1.21+
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose

### Run Separately

```bash
# ClickHouse
docker run -d -p 9000:9000 clickhouse/clickhouse-server:23.8

# API
cd api
pip install -r requirements.txt
uvicorn main:app --reload

# UI
cd ui
npm install
npm run dev
```

### Tests

```bash
# Python API
cd api && pytest

# Go collectors
cd collectors/git && go test ./...
```

## Deployment

### Kubernetes (Helm)

```bash
# Install
helm install team-dashboard ./helm/team-dashboard -f values-prod.yaml

# Upgrade
helm upgrade team-dashboard ./helm/team-dashboard -f values-prod.yaml
```

### Docker

```bash
# Build images
docker-compose build

# Run
docker-compose up -d
```

## Roadmap

- [x] Cycle 1: MVP (basic metrics)
- [ ] Cycle 2: Reliability (error handling, more adapters)
- [ ] Cycle 3: UI/UX (detailed charts, velocity)
- [ ] Cycle 4: Advanced (management API, filters)
- [ ] Cycle 5: Performance (query optimization)
- [ ] Cycle 6: Enterprise (SSO, RBAC)

## License

MIT