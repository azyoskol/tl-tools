---
phase: 1
phase_name: Runtime Foundation
plan: 01B-dashboard-handler
type: execute
wave: 1
depends_on: []
requirements: [FOUND-03]
requirements_addressed: [FOUND-03]
files_modified:
  - cmd/api/handlers/dashboards.go
  - cmd/api/handlers/handlers_test.go
  - cmd/api/main.go
  - cmd/api/repo/dashboard_repo.go
  - cmd/api/biz/dashboard_svc.go
autonomous: true
---

# Plan 01B: Service-backed Dashboard Handler

<objective>
Replace the active in-memory dashboard route path with constructor-injected handlers backed by the existing dashboard service.
</objective>

<must_haves>
<truth id="D-08">Replace obvious in-memory/static handlers with service-backed handlers when existing repo/service code already supports the path.</truth>
<truth id="D-09">Do not perform full backend cleanup of all legacy/static endpoints in Phase 1.</truth>
</must_haves>

<threat_model>
Assets: dashboard definitions, owner IDs, public/shared dashboards.
Trust boundaries: authenticated claims to handler owner selection, request JSON to domain structs, handler to service/repository.
Threats:
- Medium: unauthenticated requests create dashboards for an arbitrary or empty owner. Mitigation: derive owner from auth claims when auth is enabled; use only an explicit dev/test fallback.
- Medium: corrupt dashboard JSON silently becomes zero values. Mitigation: return JSON marshal/unmarshal errors from repo methods touched in this plan.
</threat_model>

<tasks>
<task id="01B-1" type="execute">
<title>Introduce dashboard handler constructor</title>
<read_first>
- `cmd/api/handlers/dashboards.go`
- `cmd/api/domain/dashboard.go`
- `cmd/api/biz/dashboard_svc.go`
- `cmd/api/respond/respond.go`
- `cmd/api/middleware/auth.go`
</read_first>
<action>
Replace package-level dashboard state in the active handler path with:

- `type DashboardHandler struct { svc *biz.DashboardSvc }`
- `func NewDashboardHandler(svc *biz.DashboardSvc) *DashboardHandler`
- `func (h *DashboardHandler) List(w http.ResponseWriter, r *http.Request)`
- `func (h *DashboardHandler) Create(w http.ResponseWriter, r *http.Request)`

`List` must call `h.svc.List(r.Context(), userID)`. Get `userID` from `middleware.ClaimsKey` when present. If claims are absent, use explicit fallback `admin-seed` only to preserve unauthenticated local/test behavior.

`Create` must decode `domain.CreateDashboardInput`, create a `domain.Dashboard` with:

- `ID` generated from 16 random bytes encoded as hex or another existing local ID helper if present.
- `OwnerID` from claims or `admin-seed` fallback.
- `Name`, `Description`, `Icon`, `Widgets`, and `Layout` from input.
- `IsPublic` false.

Return HTTP 400 on invalid JSON, HTTP 500 on service errors, and JSON dashboard on success.
</action>
<acceptance_criteria>
- `cmd/api/handlers/dashboards.go` contains `type DashboardHandler struct`.
- `cmd/api/handlers/dashboards.go` contains `func NewDashboardHandler`.
- `cmd/api/handlers/dashboards.go` no longer contains `var (` with `dashboards = []Dashboard`.
- `cmd/api/handlers/dashboards.go` contains `domain.CreateDashboardInput`.
- `cmd/api/handlers/dashboards.go` contains `admin-seed`.
</acceptance_criteria>
</task>

<task id="01B-2" type="execute">
<title>Connect dashboard handler into router dependencies</title>
<read_first>
- `cmd/api/main.go`
- `cmd/api/runtime.go`
- `cmd/api/handlers/dashboards.go`
- `cmd/api/main_test.go`
</read_first>
<action>
Update router dependency wiring so `/api/v1/dashboards` GET and POST call the injected `DashboardHandler` when a dashboard service exists.

Concrete route target:

- `GET /api/v1/dashboards` -> `dashboardHandler.List`
- `POST /api/v1/dashboards` -> `dashboardHandler.Create`

If router dependencies do not include a dashboard service, return HTTP 503 with a JSON error for dashboard routes instead of falling back to package-level in-memory data.
</action>
<acceptance_criteria>
- `cmd/api/main.go` contains `.Get("/api/v1/dashboards"` and `.Post("/api/v1/dashboards"` registrations that reference methods on a dashboard handler or dependency-backed closures.
- `cmd/api/main.go` does not reference `getDashboardsHandler`.
- `cmd/api/main.go` does not reference `postDashboardHandler`.
- `go test ./cmd/api` exits 0.
</acceptance_criteria>
</task>

<task id="01B-3" type="execute">
<title>Update dashboard handler tests</title>
<read_first>
- `cmd/api/handlers/handlers_test.go`
- `cmd/api/handlers/dashboards.go`
- `cmd/api/biz/dashboard_svc_test.go`
- `cmd/api/repo/repo_test.go`
</read_first>
<action>
Replace tests that reset package-level `dashboards` state with tests around the constructor-injected handler.

Use a simple fake or stub implementing the dashboard repo/cache interfaces through `biz.NewDashboardSvc`, or add a narrow handler test seam if simpler. Cover:

- `List` returns HTTP 200 and JSON array when service returns dashboards.
- `Create` returns HTTP 400 for invalid JSON.
- `Create` returns HTTP 200 and JSON dashboard for valid `domain.CreateDashboardInput`.
- Missing service path returns HTTP 503 if tested through router.
</action>
<acceptance_criteria>
- `cmd/api/handlers/handlers_test.go` no longer contains `dashboardsMu`.
- `cmd/api/handlers/handlers_test.go` contains `NewDashboardHandler`.
- `go test ./cmd/api/handlers ./cmd/api` exits 0.
</acceptance_criteria>
</task>

<task id="01B-4" type="execute">
<title>Stop ignoring dashboard JSON errors when touching repository code</title>
<read_first>
- `cmd/api/repo/dashboard_repo.go`
- `cmd/api/repo/repo_test.go`
</read_first>
<action>
If `cmd/api/repo/dashboard_repo.go` must be touched for handler/runtime integration, replace ignored `json.Unmarshal` and `json.Marshal` errors with explicit error handling. Use wrapped errors such as `decode dashboard widgets: %w`, `decode dashboard layout: %w`, `encode dashboard widgets: %w`, and `encode dashboard layout: %w`.

If the repository file is not touched by execution, this task may be marked not applicable in the execution summary, but do not leave new ignored JSON errors.
</action>
<acceptance_criteria>
- If `cmd/api/repo/dashboard_repo.go` is modified, it contains no `json.Unmarshal(` call whose returned error is ignored.
- If `cmd/api/repo/dashboard_repo.go` is modified, it contains no `json.Marshal(` call whose returned error is ignored.
- `go test ./cmd/api/repo ./cmd/api/biz` exits 0.
</acceptance_criteria>
</task>
</tasks>

<verification>
Run:

```bash
go test ./cmd/api/handlers ./cmd/api/biz ./cmd/api/repo ./cmd/api
go test ./...
```
</verification>

<success_criteria>
- Active dashboard routes no longer use package-level in-memory dashboard state.
- Router wiring makes missing dashboard dependencies visible with HTTP 503 instead of fake success.
- Handler behavior is covered by tests.
</success_criteria>
