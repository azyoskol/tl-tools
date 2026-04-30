# Metraly UI Redesign — Design Spec

_Date: 2026-04-30_

## Overview

Full replacement of the existing minimal React UI (`ui/src/`) with a production-quality implementation of the Metraly design from Claude Design. The design is a glassmorphism dark-mode engineering-metrics dashboard with 11 screens, a custom SVG chart library, role-based dashboards, a dashboard builder wizard, and a Grafana-style metrics explorer.

New Go API endpoints are added as stubs returning seeded deterministic JSON — correct contract shapes for future ClickHouse wiring.

## Approach

- **Frontend:** Full `ui/src/` replacement. TypeScript React with Vite (existing stack). Custom SVG charts ported from prototype (not Recharts). Inline styles matching prototype exactly.
- **Backend:** 5 new Go stub handlers wired into the existing chi router. Return seeded JSON; no ClickHouse queries yet.
- **Scope:** UI + API contract only. Real ClickHouse queries, auth, and multi-tenant support are out of scope.

## Design System (`ui/src/index.css`)

CSS variables, Google Fonts, and animations ported directly from the prototype:

**Colors**
- `--bg: #0B0F19` — page background
- `--glass: #131825` — card surface
- `--glass2: #1a2235` — hovered card surface
- `--border: rgba(255,255,255,0.07)`
- `--cyan: #00E5FF` — primary accent
- `--purple: #B44CFF` — secondary accent
- `--success: #00C853`, `--warning: #FF9100`, `--error: #FF1744`
- `--text: #E8EDF5`, `--muted: #6B7A9A`, `--muted2: #9BAABF`
- `--grad: linear-gradient(135deg, #00E5FF, #B44CFF)`

**Fonts** (Google Fonts)
- `Space Grotesk` — headings (`--font-head`)
- `Inter` — body (`--font-body`)
- `JetBrains Mono` — data/code (`--font-mono`)

**Animations**
- `fade-up` with 6 stagger levels (`fade-up-1` … `fade-up-6`)
- `pulse-dot` — pulsing status indicator
- `shimmer`, `bar-grow`, `spin-slow`

## File Structure

```
ui/src/
  index.css
  main.tsx                      # unchanged
  App.tsx                       # shell: sidebar + topbar + screen router

  components/
    charts/
      utils.ts                  # seededRand, makeTimeSeries, bezierPath, scalePoints
      AreaChart.tsx             # bezier area+line chart with compare mode
      BarChart.tsx              # vertical + horizontal bar chart
      Heatmap.tsx               # activity heatmap grid
      Gauge.tsx                 # semicircle gauge SVG
      Leaderboard.tsx           # ranked bar list
      MiniSparkline.tsx         # compact sparkline (full-width SVG)
      DataTable.tsx             # styled table component

    ui/
      Icon.tsx                  # inline SVG icon set (Lucide-style, ~30 icons)
      Sidebar.tsx               # nav with pinnable dashboards + localStorage
      Topbar.tsx                # search bar + notification bell
      MetricCard.tsx            # large stat card with sparkline + trend badge
      StatCard.tsx              # compact stat card for role dashboards
      AIInsightCard.tsx         # gradient-border AI insight card with pulse dot
      Widget.tsx                # glass container (background + border + padding)
      Badge.tsx                 # status badge: On track / At risk / Blocked / Done
      InlineInsight.tsx         # full-width AI insight strip
      SectionHeader.tsx         # section title + horizontal rule + optional right label
      FilterPill.tsx            # dropdown filter pill with click-outside close

  screens/
    DashboardScreen.tsx         # Overview: 4 metric cards, AI insights, activity feed
    RoleDashboardScreen.tsx     # Tab bar wrapper for role dashboards
    CTODashboard.tsx            # Health gauge, DORA trends, team velocity
    VPDashboard.tsx             # Sprint velocity, PR cycle time, heatmap, delivery risk
    TLDashboard.tsx             # CI pass rate, PR queue, burndown, failing builds
    DevOpsDashboard.tsx         # Deploy freq, MTTR, deploy heatmap, incidents
    ICDashboard.tsx             # My PRs, CI runs, review queue, sprint progress
    DashboardWizardScreen.tsx   # 3-step wizard + live PreviewPanel
    MetricsScreen.tsx           # Grafana-style: metric tree + DORA panel + filters
    AIScreen.tsx                # Chat interface (client-side fallback)
    PluginScreen.tsx            # Marketplace grid (static data)
    WizardScreen.tsx            # Connect Sources 4-step onboarding
    PlaceholderScreen.tsx       # Settings stub

  api/
    client.ts                   # axios base instance (existing, unchanged)
    metrics.ts                  # typed fetch functions for new endpoints
```

## API Contract

Five new endpoints added to the Go API. All return `application/json`. Stubs use seeded deterministic data; response shapes are final.

### `GET /api/v1/dora`

```json
{
  "metrics": [
    {
      "id": "deploy-freq",
      "label": "Deployment Frequency",
      "value": "4.2/day",
      "delta": "+0.8",
      "good": true,
      "level": "Elite",
      "color": "#00E5FF",
      "series": [4.1, 3.8, 4.5, ...]  // 30 points
    },
    ...
  ]
}
```

### `GET /api/v1/metrics?metric=X&range=30d&team=&repo=`

Query params: `metric` (required), `range` = `7d|14d|30d|90d`, `team`, `repo`.

```json
{
  "id": "deploy-freq",
  "label": "Deployment Frequency",
  "unit": "deploys/day",
  "color": "#00E5FF",
  "current": 4.2,
  "delta": 0.8,
  "series": [3.1, 3.4, ...],
  "compare": [3.8, 4.0, ...]
}
```

### `GET /api/v1/role/{role}`

`role` = `cto | vp | tl | devops | ic`

The response shape is role-specific. Each role returns a consistent envelope with role-typed payload:

```json
{
  "role": "cto",
  "stats": [
    { "icon": "trendingUp", "label": "Engineering Health", "value": "84", "trend": "+3 pts", "trendDir": "up", "color": "cyan", "spark": [...] }
  ],
  "payload": { ... }
}
```

`payload` keys vary per role (e.g. CTO has `deployTrend`, `velocityByTeam`, `leadTimeTrend`, `healthScore`; DevOps has `deployFreq`, `mttrTrend`, `deployHeatData`, `incidents`). The frontend screen component for each role knows which payload keys to consume. This avoids a single rigid schema across incompatible role data shapes.
```

### `GET /api/v1/insights`

```json
{
  "insights": [
    { "title": "CI slowdown detected", "body": "...", "action": "View affected jobs" }
  ],
  "updatedAt": "2026-04-30T17:05:00Z"
}
```

### `GET /api/v1/dashboards` / `POST /api/v1/dashboards`

GET returns array of saved dashboards. POST accepts:

```json
{
  "name": "My Dashboard",
  "description": "",
  "widgets": ["dora-overview", "ci-pass-rate"],
  "widgetSizes": { "dora-overview": "lg", "ci-pass-rate": "sm" },
  "timeRange": "30d",
  "team": "All teams"
}
```

Returns saved object with `"id"` field added.

## Screen-to-API Mapping

| Screen | Data |
|--------|------|
| Overview Dashboard | `GET /api/v1/insights` + seeded metric cards |
| Role Dashboards (all 5) | `GET /api/v1/role/{role}` |
| Metrics Explorer | `GET /api/v1/dora` + `GET /api/v1/metrics?metric=X` |
| Dashboard Wizard | Client-side state; `POST /api/v1/dashboards` on save |
| AI Assistant | Client-side only (no inference endpoint) |
| Plugin Marketplace | Static data (no API) |
| Connect Sources | Static wizard (no API) |
| Settings | Placeholder |

## Build Sequence

1. `index.css` — design tokens, font imports, animation keyframes, scrollbar, utility classes
2. `components/charts/utils.ts` — seededRand, makeTimeSeries, bezierPath, scalePoints
3. Chart primitives in dependency order: MiniSparkline → AreaChart → BarChart → Heatmap → Gauge → Leaderboard → DataTable
4. Shared UI: Icon → Widget → Badge → SectionHeader → StatCard → MetricCard → AIInsightCard → InlineInsight → FilterPill → Topbar → Sidebar
5. Go stub handlers: dora.go, metrics.go, role.go, insights.go, dashboards.go — wire into `cmd/api/main.go`
6. `api/metrics.ts` — typed fetch functions
7. Screens: DashboardScreen → CTODashboard → VPDashboard → TLDashboard → DevOpsDashboard → ICDashboard → RoleDashboardScreen → MetricsScreen → DashboardWizardScreen → AIScreen → PluginScreen → WizardScreen → PlaceholderScreen
8. `App.tsx` — sidebar + topbar shell, state-based router, TweaksPanel (accent color, density, sparklines toggle)

## Out of Scope

- Real ClickHouse queries backing the new endpoints
- Authentication / per-user dashboard persistence
- Multi-tenant team isolation
- Drag-and-drop widget reordering (arrow buttons used instead, matching prototype)
- Export to CSV/PDF/Slack (UI rendered, no backend implementation)
