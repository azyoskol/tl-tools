# Codebase Conventions

**Mapped:** 2026-05-05
**Scope:** full repository
**Project:** Metraly

## Go Conventions

Observed conventions:

- Package names are short and layer-oriented: `auth`, `biz`, `repo`, `cache`, `domain`, `handlers`.
- Interfaces are defined near their implementation layer, for example `repo.DashboardRepo` in `cmd/api/repo/dashboard_repo.go`.
- I/O functions generally accept `context.Context`, especially repo/cache/service methods.
- Errors are usually returned and wrapped with `%w` in infrastructure code such as `cmd/api/db/migrate.go` and `cmd/api/auth/service.go`.
- Tests use Go's `testing` package plus `github.com/stretchr/testify`.
- SQL is written inline in repository methods and migration files.

Project-specific required convention from `AGENTS.md`:

```go
// SPDX-License-Identifier: AGPL-3.0-or-later
// Metraly - Team Engineering Metrics API
// Copyright (C) 2026 Metraly Contributors
```

Every Go file should begin with that header before `package`. Existing files currently do not consistently satisfy this.

## Backend Layering Convention

Intended flow:

```text
handler -> biz service -> repo/cache -> database/redis
```

Examples:

- `cmd/api/biz/dashboard_svc.go` wraps `repo.DashboardRepo` and `cache.DashboardCache`.
- `cmd/api/biz/metrics_svc.go` wraps `repo.MetricRepo` and `cache.MetricsCache`.
- `cmd/api/respond/respond.go` centralizes JSON/error responses.

Current deviations:

- `cmd/api/handlers/dashboards.go` keeps package-level in-memory dashboards and bypasses service/repo layers.
- Several endpoints in `cmd/api/main.go` write JSON literals directly.
- Handler packages are not yet uniformly using `respond`.

## Error Handling

Patterns:

- Sentinel business errors exist in `cmd/api/biz/errors.go`.
- Infrastructure errors are wrapped with contextual messages.
- HTTP error shaping exists in `cmd/api/respond/respond.go`.

Gaps:

- Some handlers use `http.Error` directly.
- Some `json.Unmarshal` and `json.Marshal` errors are ignored in repository code.
- Some methods collapse auth failures to `biz.ErrUnauthorized`, which is fine externally but can hide operational diagnostics internally.

## Context Usage

Most repo/service/cache methods accept `context.Context`. The collector `saveEvent` currently uses `context.Background()` rather than request or service shutdown context. Community Preview work should preserve context propagation in all I/O paths.

## Frontend Conventions

Observed UI patterns:

- Feature screens are under `ui/src/features/*`.
- Shared visual primitives are under `ui/src/components/*`.
- The app uses local React state for navigation in `ui/src/App.jsx`.
- Styling is mostly inline style objects plus CSS variables from `ui/src/index.css`.
- Icons come from a local `Icon` component rather than an external icon package.
- Dashboard widgets are type-routed through `ui/src/components/dashboard/widgetRegistry.tsx`.

Risks:

- Inline styling is quick but makes visual consistency and responsive review harder.
- UI mixes JS and TS; type boundaries are partial.
- There is no route-level structure, data-fetching library, or shared API client abstraction yet.

## Testing Conventions

Observed test style:

- Tests live next to packages as `*_test.go`.
- Mocks are mostly local structs or `testify/mock`.
- Tests are direct and focused on service/cache/auth/repo behavior.
- `cmd/api/db/migrate_test.go` uses Testcontainers.

See `.planning/codebase/TESTING.md` for details.

## Documentation Conventions

- App-local technical notes live in `docs/`.
- Strategic and canonical product docs live in sibling repo `../docs`.
- GSD planning docs live under `.planning/`.
- Local issue tracker convention from `AGENTS.md`: markdown files in `docs/`, format `YYYY-MM-DD-{name}-{type}.md`.

## Commit And Workflow Conventions

`AGENTS.md` says feature work should normally happen in `.worktrees/`, but user explicitly chose current `app/` for this initialization. Future feature implementation should revisit the worktree rule unless the user again overrides it.

GSD config selected by user:

- mode: `yolo`
- granularity: `coarse`
- parallelization: `true`
- commit docs: `true`
- research: `true`
- plan check: `true`
- verifier: `true`
- model profile: recommended/default
