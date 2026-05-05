# GSD State: Metraly

**Initialized:** 2026-05-05
**Current focus:** Phase 1 - Runtime Foundation

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-05)

**Core value:** Metraly must give teams a trustworthy self-hosted view of engineering delivery health without leaking sensitive engineering data.
**Canonical status:** `../docs/STATUS.md`
**Nearest milestone:** Community Preview
**Roadmap scope:** Full product roadmap

## Workflow Settings

- Mode: YOLO
- Granularity: Coarse
- Execution: Parallel
- Commit planning docs: Yes
- Research: Yes
- Plan check: Yes
- Verifier: Yes
- Nyquist validation: No for coarse granularity
- Model profile: Inherit/current default

## Current Roadmap

| Phase | Status | Goal |
|-------|--------|------|
| 1 | Pending | Runtime Foundation |
| 2 | Pending | Auth And Access |
| 3 | Pending | Sandbox Onboarding |
| 4 | Pending | Dashboard Data Path |
| 5 | Pending | Preview Ingestion |
| 6 | Pending | Community GA Polish |
| 7 | Pending | Licensing And Pro Gate |
| 8 | Pending | Private AI Core |
| 9 | Pending | Plugin Runtime |
| 10 | Pending | Enterprise Readiness |

## Decisions To Preserve

- Use `../docs/STATUS.md` as source of truth when documents conflict.
- Use `AGPL-3.0-or-later`.
- Defer ClickHouse for Community Preview.
- Preserve future ClickHouse role for dirty/raw event ingestion into TimescaleDB aggregates.
- Work in current `app/` workspace for this initialization.

## Next Action

Plan Phase 1:

```text
$gsd-plan-phase 1
```
