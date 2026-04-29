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