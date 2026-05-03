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
- **Database**: PostgreSQL + TimescaleDB
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
make docker-logs         # View logsa

# Data
make docker-test-data   # Insert test data

## Testing Strategy

- Unit tests in *_test.go files next to implementation
- Mock interfaces for dependencies
- Run: `make test` (19 tests)

## Code Style

- Go: idiomatic, interfaces for dependencies, context.Context for all I/O
- Tests: table-driven where appropriate, clear mock implementations

## License Requirements

- **License**: GNU AGPLv3 — all Go files must include the license header
- When creating new `.go` files, add this header at the very top:
  ```go
  // SPDX-License-Identifier: AGPL-3.0-or-later
  // Metraly - Team Engineering Metrics API
  // Copyright (C) 2026 Metraly Contributors
  ```
- Existing `.go` files should also be updated to include this header
- Swagger docs: use `// @license AGPL-3.0-or-later` in `cmd/api/main.go`