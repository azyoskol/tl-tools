---
phase: 1
phase_name: Runtime Foundation
plan: 01C-license-headers
type: execute
wave: 1
depends_on: []
requirements: [FOUND-05]
requirements_addressed: [FOUND-05]
files_modified:
  - "**/*.go"
  - cmd/api/main.go
autonomous: true
---

# Plan 01C: Go License Header Compliance

<objective>
Make every Go source file comply with the project-required AGPL-3.0-or-later header and align Swagger license metadata.
</objective>

<must_haves>
<truth id="D-01">Add the required AGPL-3.0-or-later SPDX header to all Go files in the app repository, including cmd/api and all collectors modules.</truth>
<truth id="D-02">Treat this as a one-time repository hygiene pass in Phase 1, not changed-files-only cleanup.</truth>
<truth id="D-03">Align Swagger license metadata with AGPL-3.0-or-later.</truth>
</must_haves>

<threat_model>
Assets: legal/license metadata, generated API documentation.
Trust boundaries: source files to downstream package consumers, Swagger comments to generated API docs.
Threats:
- Medium: license metadata conflicts between file headers and Swagger docs. Mitigation: use one SPDX value, `AGPL-3.0-or-later`, everywhere required by AGENTS.md.
</threat_model>

<tasks>
<task id="01C-1" type="execute">
<title>Add AGPL header to every Go file</title>
<read_first>
- `AGENTS.md`
- `cmd/api/main.go`
- `cmd/api/config/config.go`
- `collectors/git/main.go`
- `collectors/cicd/main.go`
- `collectors/pm/main.go`
- `collectors/metrics/main.go`
</read_first>
<action>
For every `.go` file under the repository, excluding `.worktrees/` if present, insert this exact header at the very top of the file before `package` declarations, Swagger annotations, or other comments:

```go
// SPDX-License-Identifier: AGPL-3.0-or-later
// Metraly - Team Engineering Metrics API
// Copyright (C) 2026 Metraly Contributors
```

Do not duplicate the header if a file already has it. Preserve package comments, build tags, and Swagger comments after the header. If a file has a Go build tag, keep build tags valid by placing license comments before the build tag only if Go tooling accepts it; otherwise place the license after build tags and before package comments. Verify with `go test ./...`.
</action>
<acceptance_criteria>
- Every `.go` file outside `.worktrees/` contains `// SPDX-License-Identifier: AGPL-3.0-or-later`.
- `cmd/api/main.go` starts with the SPDX header before `// @title Metraly API`.
- `go test ./...` exits 0.
</acceptance_criteria>
</task>

<task id="01C-2" type="execute">
<title>Align Swagger license annotation</title>
<read_first>
- `cmd/api/main.go`
- `AGENTS.md`
</read_first>
<action>
Change the Swagger license annotation in `cmd/api/main.go` from `// @license.name AGPL-3.0-only` to:

```go
// @license.name AGPL-3.0-or-later
// @license.url https://www.gnu.org/licenses/agpl-3.0.html
```

Keep `// @license.url https://www.gnu.org/licenses/agpl-3.0.html` present exactly once.
</action>
<acceptance_criteria>
- `cmd/api/main.go` contains `// @license.name AGPL-3.0-or-later`.
- `cmd/api/main.go` does not contain `AGPL-3.0-only`.
- `go test ./cmd/api` exits 0.
</acceptance_criteria>
</task>

<task id="01C-3" type="execute">
<title>Add header verification command to execution summary</title>
<read_first>
- `AGENTS.md`
- `Makefile`
</read_first>
<action>
During execution verification, run a deterministic check that all Go files contain the SPDX header. A valid command is:

```bash
find . -path './.worktrees' -prune -o -name '*.go' -print | xargs -r awk 'FNR==1 && $0 !~ /^\/\/ SPDX-License-Identifier: AGPL-3.0-or-later$/ { print FILENAME }' | sort -u
```

The command must print no file paths. If the command is too brittle because of build tags, use an equivalent shell/Go check and include the exact command and empty output in the execution summary.
</action>
<acceptance_criteria>
- Execution summary includes the exact header verification command used.
- Header verification command output is empty.
</acceptance_criteria>
</task>
</tasks>

<verification>
Run:

```bash
go test ./...
go vet ./...
find . -path './.worktrees' -prune -o -name '*.go' -print | xargs -r awk 'FNR==1 && $0 !~ /^\/\/ SPDX-License-Identifier: AGPL-3.0-or-later$/ { print FILENAME }' | sort -u
```
</verification>

<success_criteria>
- All Go source files have the required AGPL-3.0-or-later header.
- Swagger license metadata uses AGPL-3.0-or-later.
- Go tooling still passes after header insertion.
</success_criteria>
