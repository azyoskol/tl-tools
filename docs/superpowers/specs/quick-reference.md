# QUICK REFERENCE — ALL PHASES  
## Detailed version – essential facts only (≈750 words)  

---

## 🚀 Project Overview (2-3 sentences)  
Metraly is a team‑oriented platform that ingests engineering metrics automatically from Git hosts, project‑management tools and CI/CD pipelines. The system is built with Go for the API and data collectors, React for the UI, ClickHouse as the primary analytical database and Redis for caching. It supports multiple integrations (GitHub/GitLab, Jira/Linear, Asana/Trello, GitHub Actions/Jenkins) and provides DORA‑style insights, real‑time dashboards and AI‑driven recommendations.

---

## 🛠️ Main Modules & Components  

| Module | Purpose | Key Files / Specs |
|--------|---------|-------------------|
| **Go API Server** | REST endpoints for metrics, teams and dashboards; handles incoming webhooks from GitHub/GitLab/Jira/Linear. Uses the Chi router with middleware for caching, authentication and structured logging. | `cmd/api/internal/handlers/dashboard.go#overview`, `internal/clickhouse/views.md#tables` |
| **Data Collectors (Go)** | Modular services (`git`, `pm`, `cicd`, `metrics`) that scrape events from external sources, store them in ClickHouse and expose health‑check endpoints. Implements a dead‑letter queue for error handling and retry logic with exponential backoff. | `collectors/git/main.md#sources`, `internal/clickhouse/events_dlq.md#queue` |
| **ClickHouse Database** | Schemas and materialized views (`events`, `daily_aggregates`, `pr_metrics`, `cycle_metrics`). Optimised aggregation queries with partitioning by `toYYYYMM(occurred_at)` and pre‑computed metrics for fast dashboard load. | `internal/clickhouse/views.sql#tables`, `cmd/api/internal/clickhouse/client.md#dependencies` |
| **React UI (Vite)** | Component library of custom SVG charts (`AreaChart`, `BarChart`, `Heatmap`, `Gauge`), widgets and dashboards pages. Pixel‑perfect design with bespoke animations, glass‑morphism styling and a global TweaksPanel for theme control. | `ui/src/components/charts/AreaChart.tsx#implementation`, `docs/superpowers/specs/2026-04-29-team-dashboard-design.md#design` |
| **Redis Cache** | In‑memory caching layer with 300 seconds TTL and in‑memory fallback for high availability. Middleware sits between API routes and DB calls, reducing load on ClickHouse. | `cmd/api/internal/middleware/cache.go#implementation` |
| **Error Handling & DLQ** | Structured error handling using `%w`, custom error types with context; dead‑letter queue with exponential backoff (1 s → 4 s → 16 s → permanent). Health‑check endpoints per collector. | `collectors/git/handlers/errors.go#retry` |
| **RBAC & Auth** | Role‑based access control via Go middleware; SSO/OAuth integration with external IdP (Okta, Google Workspace); audit logging for all sensitive operations. | `cmd/api/internal/middleware/auth.md#implementation` |
| **Grafana Integration** | Custom metrics exported to Grafana via ClickHouse datasource or Prometheus pushgateway. Enables real‑time monitoring of DORA and other KPIs. | `ui/src/screens/MetricsScreen.tsx#grafana` |

---

## ⚙️ Key Technical Decisions  

- **Architecture** – Four‑layer stack: Handler → Business Logic → Repository → ClickHouse, all communicating via HTTP (JSON API) or context‑carrying Go calls. Strict separation of concerns and dependency inversion for testability.  [Layered Architecture](./cmd/api/internal/handlers/dashboard.md#architecture)
- **Patterns** – Dependency Injection through interfaces; Circuit Breaker pattern in collectors to avoid cascade failures; Retry with exponential backoff and jitter; Bulk processing via batch API calls.  [Error Handling Patterns](./collectors/git/handlers/errors.md#retry)
- **Libraries** – Go: `chi` (router), `clickhouse-go/v2`, `redis/go-redis`; React: custom SVG chart library, `axios` for HTTP client; TypeScript strict mode with ESLint rules.  [Tech Stack](./cmd/api/internal/clickhouse/client.md#dependencies)
- **Performance** – Pre‑computed views in ClickHouse reduce query latency to < 500 ms p95 for dashboard load; API caching via Redis + in‑memory fallback ensures sub‑100 ms response times under normal traffic.  [Query Optimization](./internal/clickhouse/views.md#optimization)
- **Scalability** – Horizontal scaling of collectors using Kubernetes HPA; read replicas for ClickHouse to offload analytical queries from master node; connection pooling with `database/sql` and context propagation.  [Scale Strategy](./collectors/git/main.md#scaling)

---

## ⚠️ Constraints & NFRs  

| Category | Requirement | Source |
|----------|-------------|--------|
| **Performance SLAs** | Dashboard load < 500 ms p95; API latency < 100 ms p95. | [Performance Targets](./cmd/api/internal/handlers/dashboard.md#performance) |
| **Scalability** | Horizontal scaling of collectors via HPA; read replicas for ClickHouse. | [Scale Strategy](./collectors/git/main.md#scaling) |
| **Reliability** | Dead‑letter queue with retry logic (1 s → 4 s → 16 s → permanent); health‑check endpoints per collector. | [DLQ Implementation](./internal/clickhouse/events_dlq.md#queue) |
| **Security & Auth** | RBAC via middleware; SSO/OAuth integration with IdP (Okta, Google Workspace); encrypted data in transit and at rest. | [RBAC Middleware](./cmd/api/internal/middleware/auth.md#implementation) |
| **Compliance & Privacy** | GDPR‑compatible user data deletion mechanisms; TLS for all external API calls. | [Data Privacy](./ui/src/screens/AIScreen.tsx#gdpr) |

---

## 🌐 External Integrations  

- **GitHub / GitLab** – Webhooks for PR events, CI/CD pipeline runs and merge requests; OAuth for authentication.  [Webhook Handlers](./cmd/api/internal/handlers/webhooks.md#github)
- **Jira / Linear / Asana / Trello** – Integration via official APIs with access tokens; handling of rate‑limits and malformed requests.  [Project Management Integrations](./collectors/pm/main.md#adapters)
- **CI/CD Platforms (GitHub Actions, GitLab CI, Jenkins)** – Data collection on build health status and pipeline metrics; integration with Prometheus for metric scraping.  [Metrics Collector](./collectors/metrics/main.md#prometheus)

---

## 📡 Webhook Implementation Summary

- **Endpoint**: `POST /api/v1/collectors`
- **Input validation**: source must be one of `git|pm|cicd|metrics`; payload limited to 10 KB JSON.
- **Processing flow**:
  1. Validate JSON and required fields.
  2. If `team_id` omitted → default UUID (`550e8400-e29b-41d4-a716-446655440000`).
  3. Persist event in ClickHouse table `events` with timestamp via parameterized INSERT.
- **Output**: `{ "status": "ok", "received": "<event_type>" }`.

**Files:**
- Handler: `internal/pkg/handlers/webhook.go#Receive`
- Service: `internal/pkg/biz/webhook.go#Receive`
- Tests: `internal/pkg/handlers/webhook_test.go`

---

## 📝 Source Links  

- **API Specification**: `cmd/api/internal/handlers/dashboard.go#overview` – main endpoints & architecture.  
- **Database Schema & Views**: `internal/clickhouse/views.sql#tables` – tables, views and query optimisation.  
- **UI Redesign Spec**: `ui/src/components/charts/AreaChart.tsx#implementation` – custom charts & styling.  
- **Cache Middleware**: `cmd/api/internal/middleware/cache.go#implementation` – Redis + in‑memory fallback.  
- **Collector Architecture & Retry Logic**: `collectors/git/handlers/errors.go#retry` – dead‑letter queue and retry strategy.  
- **RBAC Middleware**: `cmd/api/internal/middleware/auth.md#implementation` – role‑based access control and SSO/OAuth integration.  

---

## 🎨 Design Prototype Link  

**Design Prototype:** https://claude.ai/design/p/019ddec6-c67d-7bde-8728-2858d30e6012  

---

*Last updated: 2026‑05‑01 | Maintained by AI Assistant*
