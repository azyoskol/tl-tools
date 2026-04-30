# AGENTS.md

This file documents agent-specific information for this project.

## Project Context

- **Name**: Metraly — Team Engineering Metrics API
- **Language**: Go (backend), React (frontend)
- **Database**: ClickHouse
- **Cache**: Redis

## Agent Skills Configuration

### Available Skills

Install these skills for best agent experience:

- **diagnose**: For debugging issues ("diagnose this", "debug this")
- **grill-me**: For stress-testing plans and designs
- **grill-with-docs**: For challenging plans against domain model
- **improve-codebase-architecture**: For finding refactoring opportunities
- **tdd**: For test-driven development
- **to-issues**: For converting plans to issues
- **to-prd**: For creating PRDs
- **triage**: For issue workflow management

### Setup Command

```bash
# Run once to configure skills
make setup-matt-pocock-skills  # if using setup-matt-pocock-skills skill
```

## Issue Tracker

- **Type**: Local markdown files in docs/superpowers/
- **Labels**: Plans, Specs
- **Format**: YYYY-MM-DD-{name}-{type}.md

## Triage Labels

- `bug` — Something is broken
- `feature` — New functionality
- `improvement` — Enhancement to existing
- `refactor` — Code restructure

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