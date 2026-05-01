# Metraly — Team Engineering Metrics API (Alpha)

**⚠️ Current status: Prototype / Early version. Many features are under active development.**

Metraly is a multi-team engineering productivity dashboard. It helps track development efficiency in real time by collecting data from Git, CI/CD, and PM tools.

## ✨ Planned Features (Roadmap)

- **Metrics & Charts**: PRs (open/merged), Cycle Time, Velocity, CI/CD Success Rate, Blocked Tasks.
- **Dashboards**: Executive Overview, Activity Drill-down, Team Comparison.
- **Role-Based Views**: Tailored perspectives for engineers, team leads, and executives.
- **Integrations**: Built-in data collection from GitHub, GitLab, Jenkins, Jira.
- **Enterprise**: SSO, RBAC, audit trails (future versions).

## 🚀 Quick Start (Docker Compose)

The easiest way to get a local instance running for demonstration.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/getmetraly/metraly.git
   cd metraly
   ```

1. **Launch all services**:

   ```bash
   make docker-up
   ```

   This builds and starts the API, ClickHouse, Redis, and the UI.

2. **Open in your browser**:
   - **User Interface**: [http://localhost:3000](http://localhost:3000)
   - **API (Health Check)**: [http://localhost:8000/health](http://localhost:8000/health)
   - **ClickHouse (HTTP Interface)**: [http://localhost:8123](http://localhost:8123)

3. **Insert demo data (optional)**:

   ```bash
   make docker-test-data
   ```

   This populates the database with sample events so the UI isn’t empty.

## 💻 Development

### Prerequisites

- Go 1.26+
- Node.js 20+
- Docker and Docker Compose

### Makefile Commands

```bash
make help            # Show all available commands
make build           # Build the Go API binary
make test            # Run tests (currently 19 tests)
make lint            # Run the linter
make run             # Build and run the API locally (without Docker)
make docker-up       # Start all services in Docker
make docker-down     # Stop and remove all Docker services
make docker-logs     # Tail logs from all services
```

## 🏗️ Architecture

The project follows a layered architecture, separating request handling, business logic, and data access.

```
HTTP Request ↓
Handler (validation, marshaling) ↓
Biz (business logic) ↓
Repo (data access) ↓
Database (ClickHouse HTTP)
```

### Project Structure

```
.
├── cmd/api/main.go         # API server entry point
├── internal/pkg/           # Business logic and infrastructure
│   ├── biz/                # Business logic services (DashboardService, etc.)
│   ├── cache/              # Redis-backed cache with in-memory fallback
│   ├── config/             # Environment and file-based configuration
│   ├── database/           # HTTP client for ClickHouse
│   ├── handlers/           # HTTP request handlers (API endpoints)
│   ├── middleware/          # CORS, logging, and other middleware
│   ├── logger/             # Structured logging
│   ├── models/             # Shared data types
│   ├── repo/               # Data access layer (ClickHouse implementation)
│   └── telemetry/          # OpenTelemetry tracing and metrics
├── ui/                     # React frontend (Vite, Recharts)
├── clickhouse/             # ClickHouse schemas and initialization scripts
├── collectors/             # (In Development) Data collection services
├── helm/                   # (In Development) Helm chart for Kubernetes
└── config.yaml             # Application configuration file
```

## 📡 API (Endpoints)

| Endpoint | Description | Status |
| :--- | :--- | :--- |
| `GET /health` | API health check | ✅ Working |
| `GET /api/v1/teams` | List of teams | ⚠️ Demo data |
| `GET /api/v1/dashboard` | Metrics overview | ⚠️ Demo data |
| `GET /api/v1/teams/{id}/overview` | Team metrics overview | ⚠️ Demo data |
| `GET /api/v1/teams/{id}/velocity` | Team velocity | ⚠️ Demo data |
| `GET /api/v1/teams/comparison` | Team comparison | ⚠️ Demo data |
| `GET /api/v1/dora` | DORA metrics | ⚠️ Demo data |
| `GET /api/v1/insights` | AI-powered insights | ⚠️ Demo data |

> **Note on "⚠️ Demo data"**: These endpoints currently return static sample values to exercise the UI, not real data from ClickHouse. They will be upgraded to fully functional soon.

## 🛠️ Technology Stack

- **Backend**: Go 1.26+, Chi Router, gRPC (in development), OpenTelemetry
- **Database**: ClickHouse 23.8
- **Cache**: Redis 7
- **UI**: React 20, TypeScript, Vite, Recharts
- **Infrastructure**: Docker, Docker Compose, Helm (in development)

## 📄 License

This project is licensed under the GNU AGPLv3. See the [LICENSE](LICENSE) file for details.
