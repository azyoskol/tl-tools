# 🚀 Metraly — Open-Core Engineering Metrics Platform

**⚠️ Current Status: Early Prototype. Some features are under active development and may not yet be fully functional.**

**Metraly** is an open-core, self-hosted engineering analytics platform that helps you track team productivity, delivery performance, and developer experience — without sending your data to a third party. It brings together metrics from Git, CI/CD, and project management tools, turns them into actionable dashboards, and offers AI-powered insights you can run on your own infrastructure.

## 🤔 Why Metraly? (vs. SaaS competitors)

Most engineering metrics tools (LinearB, Waydev, Code Climate Velocity, Swarmia, etc.) are proprietary SaaS products. They force you to ship your entire codebase and project management data to their cloud. Metraly takes a completely different approach:

| Capability | SaaS Solutions | Metraly |
| :--- | :--- | :--- |
| **Data ownership** | Your data lives on the vendor’s cloud; you’re bound by their retention policies and data processing agreements. | You host it yourself. All data stays in your PostgreSQL/Redis, on your infrastructure. Full GDPR / compliance control. |
| **Customization** | Limited to what the vendor allows. Custom metrics and dashboards often require enterprise plans. | Completely extensible. Build **custom plugins**, dashboards, and data sources using simple Go interfaces. White-label the UI. |
| **AI & LLM integration** | AI features are typically closed-source, using your data to train proprietary models (often without clear opt-out). | Built-in AI-assistant and smart insights run locally against your data. Bring your own LLM or use built-in lightweight models. No data ever leaves your environment. |
| **Extensibility** | Closed ecosystems. Integrations are slow to add. | Open plugin architecture (data sources, widgets, alert exporters). Plugins can be written in Go or compiled to WASM and executed in a secure sandbox. |
| **Transparency** | You can't see how metrics are calculated or how data is transformed. | Open-core. Every core calculation is visible and auditable. You can fork, modify, and contribute back. |
| **Vendor lock-in** | High. Migrating historical data away is often impossible. | None. Your data is in standard ClickHouse tables. Export to Parquet/CSV at any time. |

If you value data privacy, unlimited flexibility, and full control over your engineering intelligence layer — Metraly is built for you.

## ✨ Key Features & Roadmap

Metraly is being designed as the central hub for engineering productivity. Here's what you get now and what’s planned for the near future.

- **Classic metrics** – PR throughput, cycle time, deployment frequency, change failure rate, lead time for changes (DORA).
- **Team-level dashboards** – Per-team overviews, velocity trends, comparison views, and blocked work analysis.
- **Role-based perspectives** – Tailored views for individual contributors, engineering managers, and VPs of Engineering.
- **Extensible plugin system** – Add your own data sources, custom widgets, and alert exporters without touching the core code.
- **AI-powered analytics** – Automated anomaly detection, NLP-based natural language querying, and predictive velocity forecasting.
- **Enterprise readiness** – SSO (OIDC), RBAC, audit logging, air-gapped deployment, and white-labeling.

The roadmap below outlines the major pillars currently in development or fully designed.

### 🧩 Custom Plugins
Metraly is built as an extensible platform. Plugins allow anyone to integrate new tools or create entirely new visualizations.

- **Plugin types**: Data source adapters (Jira, GitHub, Linear, Sentry, custom HTTP webhooks), dashboard widgets, alert exporters.
- **Developer experience**: Implement a simple Go interface (`Plugin`), package as a binary or WASM module, and drop it into the `/plugins` directory. Plugins are auto-discovered.
- **Security**: Third-party plugins run in isolated sandboxes (gVisor) with strict CPU/memory limits.
- **One-click install**: Plugins can be installed directly from the UI or via `POST /api/v1/plugins/{id}/install`.
- **Metraly Hub (planned)**: A community registry where developers can share and discover plugins and dashboards.

### 🤖 AI Features
Metraly treats AI not as a black-box magic wand, but as a transparent, self-hosted engineering analyst.

- **Smart insights**: Automatically detects delivery bottlenecks (e.g., "PR review times increased by 35% this sprint"), imbalanced review load, and flaky CI/CD steps. Provides natural language explanations, not just charts.
- **AI assistant**: Ask questions in plain English — "Which team had the highest deployment frequency last month?", "Show me the repos where cycle time is above 3 days", "Which epics are at risk of slipping?".
- **Predictive analytics**: Uses historical team performance to forecast sprint completion probability and highlight risky release trains before they derail.
- **BYO-LLM**: Supports plugging in your own LLM endpoint (OpenAI-compatible) or can run local models. No telemetry data leaks to external AI providers.

### 🏢 Enterprise Capabilities
For organizations rolling Metraly out to hundreds of teams, the “Enterprise” feature set provides everything needed for compliant, production-grade operations.

- **Authentication & authorization**: Single Sign-On via OIDC (Okta, Azure AD, Keycloak), full RBAC (Admin, Editor, Viewer) with team-level scoping.
- **Audit & compliance**: Immutable activity log for every user action, exportable to external SIEMs. Configurable data retention policies.
- **White-labeling**: Replace logos, colours, and domain names. Create private dashboard templates for consistent reporting across the company.
- **High availability**: Supports TimescaleDB for time-series, ClickHouse sharding, and Kubernetes-native deployment with Helm.

## 🚧 Future Directions

Beyond the immediate roadmap, we’re actively exploring several strategic initiatives:

1. **DevSecOps Scorecard** – Pull vulnerability data from Trivy, Snyk, and Semgrep. Track mean time to remediate security issues and test coverage directly alongside delivery metrics.
2. **Team Health & Gamification** – Introduce a system of positive “engineering kudos” based on healthy practices (timely code reviews, stable releases, documentation quality) to encourage the right behaviours without weaponizing metrics.
3. **Flow Metrics & Sprint Planning** – Deep monitoring of Flow Metrics (Velocity, Time, Load, Efficiency, Distribution) and calendar-aware release forecasting so teams can answer “When will this feature ship?” with confidence.
4. **Metraly Hub** – A marketplace for community-built plugins, dashboards, AI prompts, and alert templates, turning Metraly into a truly open ecosystem.

## 🐳 Quick Start (Docker Compose)

The fastest way to get a local Metraly instance up and running.

```bash
git clone https://github.com/getmetraly/metraly.git
cd metraly
make docker-up
```

This will build and start the API, ClickHouse, Redis, and the React UI.

- **UI**: [http://localhost:3000](http://localhost:3000)
- **API Health**: [http://localhost:8000/health](http://localhost:8000)
- **ClickHouse HTTP**: [http://localhost:8123](http://localhost:8123)

(Optional) Load demo data:
```bash
make docker-test-data
```

## 🛠️ Development

### Prerequisites
- Go 1.26+
- Node.js 20+
- Docker & Docker Compose

### Common Make Commands
```bash
make help        # Show all available commands
make build       # Build the API binary
make test        # Run tests (19 tests currently)
make lint        # Run linter
make run         # Build and run API locally (without Docker)
make docker-up   # Start all services in Docker
make docker-down # Stop and remove Docker services
make docker-logs # Watch logs from all services in real time
```


## 💻 Tech Stack

- **Backend**: Go 1.26+, Chi Router, gRPC (in progress), OpenTelemetry
- **Database**: ClickHouse 23.8
- **Cache**: Redis 7
- **UI**: React 20, TypeScript, Vite, Recharts
- **Infrastructure**: Docker, Docker Compose, Helm (in progress)

## 📜 License

This project is licensed under the GNU AGPLv3. See the [LICENSE](LICENSE) file for details.
