# Codebase Structure

**Mapped:** 2026-05-05
**Scope:** full repository
**Project:** Metraly

## Repository Layout

```text
.
├── cmd/api/                 # Main Go API
├── collectors/              # Separate collector services
├── docs/                    # App-local docs and superpowers specs/plans
├── ui/                      # React/Vite frontend
├── Makefile                 # Development commands
├── docker-compose.yaml      # Local runtime stack
├── Dockerfile               # API container
├── README.md                # Product/project overview
├── BACKEND_PLAN.md          # Backend rewrite plan
└── AGENTS.md                # Agent/project instructions
```

## API Structure

```text
cmd/api/
├── auth/          # JWT, auth service, token store, OIDC
├── biz/           # Business services
├── cache/         # Redis cache adapters
├── config/        # Env config loading
├── db/            # pgx pool and migration runner
├── domain/        # Domain/API structs
├── handlers/      # HTTP handlers
├── middleware/    # Auth/RBAC/logger middleware
├── migrations/    # Embedded SQL migrations
├── repo/          # Repository interfaces and pgx implementations
├── respond/       # JSON/error response helpers
├── seed/          # Demo data generation
└── main.go        # Router and server entry point
```

Naming pattern is mostly package-per-layer under `cmd/api`, with files named by entity or concern: `dashboard_svc.go`, `dashboard_repo.go`, `dashboard.go`.

## UI Structure

```text
ui/src/
├── api/                  # mock API and endpoint experiments
├── components/           # shared charts, layout, dashboard, UI primitives
├── context/              # React context
├── features/             # screen-level features
├── hooks/                # data hooks
├── types/                # TypeScript type definitions and mock fixtures
├── utils/                # formatting and seed helpers
├── App.jsx               # top-level navigation
├── index.css             # global theme/styles
└── index.jsx             # React root
```

Screen-level feature folders:

- `ui/src/features/dashboard/`
- `ui/src/features/dashboardWizard/`
- `ui/src/features/metricsExplorer/`
- `ui/src/features/aiAssistant/`
- `ui/src/features/marketplace/`
- `ui/src/features/onboarding/`

## Collector Structure

```text
collectors/
├── shared/       # Shared retry helper module
├── git/          # GitHub/GitLab webhook collector
├── cicd/         # GitHub Actions/GitLab CI/Jenkins collector skeleton
├── pm/           # Jira/Linear/Asana/Trello collector skeleton
└── metrics/      # Prometheus collector skeleton
```

Each collector has its own `go.mod`, `config.yaml`, and `Dockerfile` where applicable. Adapters live under each collector's `adapters/` directory.

## Documentation Structure

App-local docs:

- `docs/architecture.md`
- `docs/dashboard_rendering.md`
- `docs/DashboardWizard.md`
- `docs/superpowers/specs/2026-05-03-infra-optimization-design.md`
- `docs/superpowers/plans/2026-05-03-infra-optimization-plan.md`

External canonical docs repo:

- `../docs/STATUS.md` is the user-confirmed status source of truth.
- `../docs/decisions/2026-05-04.md` captures founder decisions.
- `../docs/product/`, `../docs/tech/`, `../docs/strategy/`, `../docs/risks/`, `../docs/legal/` contain broader planning inputs.

## Generated Planning Structure

GSD files are being added under:

```text
.planning/
├── codebase/
│   ├── STACK.md
│   ├── INTEGRATIONS.md
│   ├── ARCHITECTURE.md
│   ├── STRUCTURE.md
│   ├── CONVENTIONS.md
│   ├── TESTING.md
│   └── CONCERNS.md
```

Future initialization will add:

- `.planning/PROJECT.md`
- `.planning/config.json`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`

## Key File Locations

| Concern | Location |
|---------|----------|
| API router | `cmd/api/main.go` |
| Env config | `cmd/api/config/config.go` |
| Migrations | `cmd/api/migrations/*.sql` |
| Dashboard repo/service | `cmd/api/repo/dashboard_repo.go`, `cmd/api/biz/dashboard_svc.go` |
| Metric repo/service | `cmd/api/repo/metric_repo.go`, `cmd/api/biz/metrics_svc.go` |
| Auth | `cmd/api/auth/*.go`, `cmd/api/middleware/auth.go` |
| Seed data | `cmd/api/seed/*.go` |
| Main UI shell | `ui/src/App.jsx` |
| Dashboard renderer | `ui/src/components/dashboard/DashboardRenderer.tsx` |
| Mock API | `ui/src/api/mockApi.ts` |
| Onboarding wizard | `ui/src/features/onboarding/WizardScreen.tsx` |
| Docker stack | `docker-compose.yaml` |

## Structural Notes

- `cmd/api` is the only application backend module at repo root.
- Collectors are separate modules and should be treated as separate deployable services.
- The UI mixes `.jsx`, `.js`, `.tsx`, and `.ts` files.
- Current backend route handlers and repository/service layers are not fully connected.
- Root `docs/` and sibling `../docs` are distinct; sibling docs are more complete and canonical for product status.
