# AGENTS.md

This file documents agent-specific information for this project.

## Worktrees

Worktrees should be created inside project directory (`.worktrees/`), not in global location.

```bash
# Preferred location: .worktrees/ (hidden, project-local)
```

## Project Context

- **Name**: Metraly — Team Engineering Metrics API
- **Language**: Go (backend), React (frontend)
- **Database**: ClickHouse
- **Cache**: Redis

## Issue Tracker

- **Type**: Local markdown files in docs/
- **Labels**: Plans, Specs
- **Format**: YYYY-MM-DD-{name}-{type}.md


## Common Commands

```bash
# Development
make build              # Build API
make test               # Run tests
make lint               # Run linter
make run                # Run locally

# Docker
make docker-up          # Start services
make docker-down        # Stop services
make docker-restart     # Restart services

# Debugging
make health             # Check API health
make dashboard          # Check dashboard data
make docker-logs         # View logs

# Data
make docker-test-data   # Insert test data

## Setup & Environment

- Required env vars for `cmd/api`: `PORT`, `POSTGRES_DSN`, `REDIS_HOST`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (used by seed runner).
- After adding Go dependencies run `go mod tidy` to keep `go.mod`/`go.sum` clean.
- Worktree directory `.worktrees/` must be listed in `.gitignore`. If missing, add `/.worktrees/` and commit before creating worktrees.
- Baseline verification: after creating a worktree run `go test ./...` to ensure all existing tests pass before starting implementation.
- To run a single test: `go test ./cmd/api/... -run TestName`.

```

## Architecture Notes

### Layered Architecture

```
Handler → Biz → Repo → Database
```

- **handlers/** — HTTP validation + marshaling only
- **biz/** — Business logic, orchestration
- **repo/** — Data access, queries
- **database/** — Low-level DB communication

### Key Interfaces

- `database.Database` — Query, Exec, Ping
- `repo.EventRepo` — CountEvents, GetActivity, etc.
- `biz.DashboardService` — GetDashboard, GetOverview, etc.
- `cache.Cache` — Get, Set, Delete

### Database

ClickHouse via HTTP (port 8123). Uses JSON format for responses.

## Testing Strategy

- Unit tests in *_test.go files next to implementation
- Mock interfaces for dependencies
- Run: `make test` (19 tests)

## Code Style

- Go: idiomatic, interfaces for dependencies, context.Context for all I/O
- Tests: table-driven where appropriate, clear mock implementations