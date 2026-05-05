---
phase: 1
plan: 01B-dashboard-handler
subsystem: api-handlers
tags: [dashboards, handlers, services, repositories]
requires: [FOUND-03]
provides:
  - Service-backed dashboard list/create handlers
  - Router-level 503 for missing dashboard service dependencies
affects:
  - cmd/api/handlers/dashboards.go
  - cmd/api/main.go
  - cmd/api/repo/dashboard_repo.go
tech-stack:
  added: []
  patterns: [constructor-injection, service-backed-handler, explicit-json-errors]
key-files:
  created:
    - cmd/api/handlers/errors.go
  modified:
    - cmd/api/handlers/dashboards.go
    - cmd/api/handlers/handlers_test.go
    - cmd/api/main.go
    - cmd/api/main_test.go
    - cmd/api/repo/dashboard_repo.go
key-decisions:
  - Dashboard routes now use `handlers.NewDashboardHandler` and `biz.DashboardSvc`.
  - Missing dashboard service dependencies return HTTP 503 instead of in-memory fallback data.
  - Repository dashboard JSON marshal/unmarshal errors are returned with wrapped context.
requirements-completed: [FOUND-03]
duration: "in progress"
completed: 2026-05-05
---

# Phase 1 Plan 01B: Service-backed Dashboard Handler Summary

Dashboard list/create routes now go through constructor-injected service-backed handlers instead of package-level in-memory state.

## Tasks Completed

| Task | Status | Commit |
|------|--------|--------|
| 01B-1 Introduce dashboard handler constructor | Complete | `280f762` |
| 01B-2 Connect dashboard handler into router dependencies | Complete | `280f762` |
| 01B-3 Update dashboard handler tests | Complete | `eb5a4bb` |
| 01B-4 Stop ignoring dashboard JSON errors when touching repository code | Complete | `492f008` |

## Verification

| Command | Result |
|---------|--------|
| `GOCACHE=/tmp/go-build go test ./cmd/api/handlers ./cmd/api/biz ./cmd/api/repo ./cmd/api` | PASS |
| `GOCACHE=/tmp/go-build go test ./...` | PASS with escalated Docker access for existing Testcontainers migration test |

## Acceptance Evidence

- `cmd/api/handlers/dashboards.go` contains `type DashboardHandler struct`.
- `cmd/api/handlers/dashboards.go` contains `func NewDashboardHandler`.
- `cmd/api/handlers/dashboards.go` no longer contains package-level `dashboards` state.
- `cmd/api/handlers/dashboards.go` decodes `domain.CreateDashboardInput` and uses fallback owner `admin-seed`.
- `cmd/api/main.go` registers dashboard routes with `dashboardHandler.List` and `dashboardHandler.Create`.
- `cmd/api/main.go` no longer references `getDashboardsHandler` or `postDashboardHandler`.
- `cmd/api/handlers/handlers_test.go` contains `NewDashboardHandler` and no `dashboardsMu`.
- `cmd/api/repo/dashboard_repo.go` no longer ignores dashboard JSON marshal/unmarshal errors.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

The active dashboard API path is now service-backed, tests cover the handler behavior, and static legacy endpoints outside dashboard scope remain intentionally unchanged for Phase 1.
