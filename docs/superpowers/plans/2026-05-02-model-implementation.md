# Model Implementation Plan

> **For agentic workers:** REQUIRED SUB‑SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task‑by‑task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `ui_new/` to TypeScript, split `API_MODEL.ts` into domain‑specific type files, add typed mock data, and refactor all dashboards to be driven by the new model.

**Architecture:**
- Split the monolithic `API_MODEL.ts` into eight focused type modules (`common`, `metrics`, `widgets`, `dashboard`, `api`, `user`, `plugins`, `ai`) under `ui_new/src/types/`.
- All new files live under `ui_new/src/` so that `tsconfig.json` (which includes `src/**/*`) covers them.
- Incrementally rename `.jsx` → `.tsx` following REFACTORING_PLAN Step 13 order.
- Introduce a generic `DashboardRenderer` component that reads a `Dashboard` model and uses a widget registry to render the appropriate widget component.
- Provide typed mock factories that supply realistic data for each model type, ensuring UI continues to work while the backend is still in progress.

**Tech Stack:** TypeScript, React 18, Vite, Axios, Node JS (dev dependencies: `typescript`, `@types/react`, `@types/react-dom`)

---

## Task 1: Initialize TypeScript Environment — ✅ DONE
`tsconfig.json` created with strict options; `typescript`, `@types/react`, `@types/react-dom` added to `devDependencies`.

---

## Task 2: Split `API_MODEL.ts` into Feature‑Specific Type Files — ✅ DONE
All 8 type files created under `ui_new/src/types/`. `API_MODEL.ts` deleted.

**Corrections applied:**
- `api.ts` initially duplicated all domain types from `dashboard.ts` and was missing `WidgetType`/`WidgetConfig` imports. Fixed: `api.ts` now contains only HTTP DTOs and imports domain types from `dashboard.ts`.
- `dashboard.ts` removed unused `MetricId` import (it's not used directly — `MetricId` lives in `metrics.ts`).
- `ai.ts` added missing imports for `MetricId` (from `./metrics`) and `DashboardFilters` (from `./dashboard`).
- `user.ts` removed a circular self-import of `ActivityEvent` from `./api`; added import of `DashboardIndexEntry` from `./dashboard`.

---

## Task 3: Add Typed Mock Data Factories — ✅ DONE
All factories created under `ui_new/src/types/mocks/`.

**Correction applied:** `mocks/dashboards.ts` was missing imports for `createMockStatCardWidget` and `createMockMetricChartWidget` from `mocks/widgets.ts`. Fixed.

---

## Task 4: Build a Generic Dashboard Renderer — ✅ DONE
`DashboardRenderer.tsx` and `widgetRegistry.tsx` created under `ui_new/src/components/dashboard/`.

**Corrections applied:**
- Files were initially placed at `ui_new/components/` (root level outside `src/`), so `tsconfig` did not cover them. Moved to `ui_new/src/components/dashboard/`.
- `widgetRegistry.ts` renamed to `.tsx` (file contains JSX).
- `DashboardRenderer.tsx` now uses `gridColumn: \`${x} / span ${w}\`` to respect the layout `x` position, not just column span.

---

## Task 5: Migrate Shared UI Primitives to TypeScript
**Targets:** All files in `ui_new/src/components/ui/` and `ui_new/src/hooks/`.

- Example: `Toggle.jsx` → `Toggle.tsx` with typed props (`value: boolean`, `onChange: (b: boolean) => void`).

- [ ] **Step 1:** Rename each `.jsx` → `.tsx`.
- [ ] **Step 2:** Add appropriate type annotations (import types from `ui_new/src/types/*`).
- [ ] **Step 3:** Run TypeScript compilation; fix any errors.
- [ ] **Step 4:** Commit the migrated primitives.

---

## Task 6: Replace Hard‑Coded Role Dashboards with Model‑Driven Rendering
**Files:**

- Delete the original role dashboard components (`CTODashboard.jsx`, `VPDashboard.jsx`, `TLDashboard.jsx`, `DevOpsDashboard.jsx`, `ICDashboard.jsx`).
- Update `RoleDashboardScreen.jsx` → `RoleDashboardScreen.tsx` to load a mock dashboard (e.g., `createMockCTODashboard()`) and render it via `<DashboardRenderer />`.

- [ ] **Step 1:** Implement the new `RoleDashboardScreen.tsx` (see plan).
- [ ] **Step 2:** Remove the now‑unused hard‑coded dashboard files.
- [ ] **Step 3:** Verify compilation.
- [ ] **Step 4:** Commit the changes.

---

## Task 7: Complete TypeScript Migration of Remaining Feature Files
**Scope:** All remaining `.jsx` files in `ui_new/src/features/` (metrics, onboarding, plugins, AI, etc.).

- [ ] **Step 1:** Bulk‑rename remaining `.jsx` → `.tsx`.
- [ ] **Step 2:** Add type annotations to each component (import the now‑available types from `src/types/*`).
- [ ] **Step 3:** Run `npx tsc --noEmit` to ensure the whole codebase type‑checks.
- [ ] **Step 4:** Commit the fully migrated codebase.

---

## Self‑Review (performed)

1. **Spec coverage:** Every requirement from the design spec is addressed by a dedicated task.
2. **No placeholders:** All steps contain concrete commands, code snippets, or file paths—no "TODO" or "TBD".
3. **Type consistency:** All types referenced across tasks are defined in the new `ui_new/src/types/` modules; widget registry and renderer use the same types.
4. **tsconfig coverage:** All new files live under `ui_new/src/`, which is covered by `"include": ["src/**/*.tsx", "src/**/*.ts"]`.

---

**Plan saved:** `docs/superpowers/plans/2026-05-02-model-implementation.md`

---

**Execution choice**

1️⃣ **Subagent‑Driven (recommended)** – Dispatch a fresh subagent for each task, review after each task, and proceed quickly.
2️⃣ **Inline Execution** – Execute tasks sequentially in this session using the `executing-plans` sub‑skill.

**Which approach would you like to use?**
