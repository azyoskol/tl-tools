# AGENTS.md

This file documents agent-specific information for this project.

## Worktrees

All feature work should be done in a **project‑local Git worktree** located under the hidden `.worktrees/` directory. Example workflow:

```bash
# Create a new worktree for a feature branch
git worktree add .worktrees/feature‑xyz feature/xyz
cd .worktrees/feature‑xyz
```

The worktree stays isolated from the main workspace, making it safe to run `make docker-restart` or other heavy commands without affecting other branches.

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

- **License**: GNU AGPLv3 – every Go source file must start with the SPDX‑AGPL‑3.0‑or‑later header.
- **Header text (exactly as required):**
  ```go
  // SPDX-License-Identifier: AGPL-3.0-or-later
  // Metraly - Team Engineering Metrics API
  // Copyright (C) 2026 Metraly Contributors
  ```
- **When adding a new `.go` file** – insert the header at the very top of the file before the `package` clause.
- **Existing files** – must already contain the header; if any are missing, add it.
- **Swagger docs** – include the license line `// @license AGPL-3.0-or-later` in `cmd/api/main.go`.
