# Model Implementation Design — Metraly UI

> **Date**: 2026-05-02
> **Status**: Approved
> **Based on**: `ui_new/API_MODEL.ts`, `ui_new/REFACTORING_PLAN.md` (Step 13)

## Goal

Migrate `ui_new/` to TypeScript, split `API_MODEL.ts` into feature-based type files, create mock data preserving existing dashboard content, and refactor hardcoded role dashboards to model-driven rendering.

## Scope

- Frontend only (`ui_new/`)
- All `.jsx` files → `.tsx`
- Split `API_MODEL.ts` into domain-specific type files
- Create typed mock data factories
- Replace CTODashboard, VPDashboard, TLDashboard, DevOpsDashboard, ICDashboard with generic `<DashboardRenderer>`

## Design

### 1. Type Structure — Split API_MODEL.ts

Replace single `API_MODEL.ts` with feature-based type files in `ui_new/types/`:

| File | Contents from API_MODEL.ts |
|------|---------------------------|
| `types/common.ts` | TrendDir, DORALevel, ItemStatus, TimeRange, TeamName, RepoName |
| `types/metrics.ts` | MetricId, MetricTimeSeries, MetricQueryParams, MetricDataResponse, MetricBreakdownItem, DORAMetricDetail, DORAResponse |
| `types/widgets.ts` | BaseWidgetConfig, all `*Config` interfaces, WidgetConfig union, WidgetType |
| `types/dashboard.ts` | DashboardFilters, WidgetLayout, DashboardWidgetInstance, Dashboard, DashboardDraft, DashboardCacheEntry, DashboardIndexEntry, SystemTemplateId, DashboardSourceType, DashboardVisibility, SystemTemplate |
| `types/api.ts` | All API request/response types (CreateDashboardRequest, UpdateDashboardRequest, WidgetDataRequest, DashboardDataResponse, etc.) |
| `types/user.ts` | CurrentUser, SystemStatus, MeResponse, ActivityEvent |
| `types/plugins.ts` | PluginCategory, Plugin, PluginsResponse, IntegrationStatus, SourceId, SourceSyncConfig, ConnectSourceRequest |
| `types/ai.ts` | AIInsight, ChatMessage, AIChatRequest, AIChatResponse |

Each file exports only its domain types, imports from siblings when necessary.

### 2. Migration Order (Follows REFACTORING_PLAN Step 13)

1. Add `tsconfig.json` to `ui_new/` with strict settings
2. Migrate shared primitives first:
   - `components/ui/` — all reusable UI components
   - `hooks/` — all custom hooks
3. Migrate features incrementally:
   - `features/dashboards/`
   - `features/metricsExplorer/`
   - `features/onboarding/`
   - `features/plugins/`
   - `features/ai/`
4. Run `tsc --noEmit` after each batch to enforce zero type errors

### 3. Mock Data Strategy

Create `types/mocks/` with typed factories preserving existing dashboard data:

| File | Purpose |
|------|---------|
| `types/mocks/metrics.ts` | Mock `MetricTimeSeries`, `DORAResponse`, `MetricBreakdownItem` |
| `types/mocks/dashboards.ts` | Mock `Dashboard` objects for each role (CTO, VP, TL, DevOps, IC) using `SystemTemplate` structure |
| `types/mocks/widgets.ts` | Mock `DashboardWidgetInstance[]` with realistic `WidgetConfig` for each dashboard |
| `types/mocks/user.ts` | Mock `CurrentUser`, `MeResponse`, `ActivityEvent[]` |
| `types/mocks/ai.ts` | Mock `AIInsight` responses |

Example factory pattern:
```ts
// types/mocks/dashboards.ts
export const createMockCTODashboard = (): Dashboard => ({
  id: 'cto-1',
  name: 'CTO Dashboard',
  sourceType: 'system-template',
  sourceTemplateId: 'cto',
  // ... rest of Dashboard fields
})
```

### 4. Model-Driven Dashboard Rendering

Replace 5+ hardcoded dashboard components with generic rendering:

**Before** (to be removed):
- `CTODashboard.jsx` — hardcoded HealthScore, MetricCharts, etc.
- `VPDashboard.jsx` — hardcoded SprintVelocity, PR cycle, etc.
- Similar for TL, DevOps, IC

**After**:
1. Each role dashboard becomes a `SystemTemplate` instance in `types/mocks/dashboards.ts`
2. Single `<DashboardRenderer dashboard={Dashboard} />` component:
   - Reads `dashboard.widgets[]` and `dashboard.layout[]`
   - Maps `widgetType` → component via registry
   - Passes typed `config` (discriminated union) as props
3. Widget registry:
   ```ts
   const widgetRegistry: Record<WidgetType, React.ComponentType<{config: WidgetConfig}>> = {
     'metric-chart': MetricChartWidget,
     'stat-card': StatCardWidget,
     'health-gauge': GaugeWidget,
     'dora-overview': DORAOverviewWidget,
     'heatmap': HeatmapWidget,
     'data-table': DataTableWidget,
     'leaderboard': LeaderboardWidget,
     'sprint-burndown': SprintBurndownWidget,
     'ai-insight': AIInsightWidget,
     'anomaly-detector': AnomalyDetectorWidget,
     'compare-bar-chart': CompareBarChartWidget,
   }
   ```

### 5. Component Updates

Each migrated component will:
- Import types from appropriate `types/*.ts` file
- Use `API_MODEL.ts` types (now split) for props, state, API calls
- Replace inline data with model-driven rendering where applicable

Example for StatCard:
```tsx
// Before
const StatCard = ({ title, value, trend, trendDir, colorKey }) => ...

// After
import type { StatCardConfig } from '../../types/widgets';
import type { MetricTimeSeries } from '../../types/metrics';

interface StatCardProps {
  config: StatCardConfig;
  data?: MetricTimeSeries;
}

const StatCard: React.FC<StatCardProps> = ({ config, data }) => ...
```

### 6. Success Criteria

- ✅ All `ui_new/` files migrated from `.jsx` to `.tsx`
- ✅ `API_MODEL.ts` split into `types/{common,metrics,widgets,dashboard,api,user,plugins,ai}.ts`
- ✅ Mock data created in `types/mocks/` preserving existing dashboard data
- ✅ Hardcoded dashboards replaced with `<DashboardRenderer>`
- ✅ `tsc --noEmit` passes with zero errors
- ✅ All components use typed props from new type files

## Files to Create

All new files live under `ui_new/src/` — the Vite entry point and tsconfig both resolve from there.

```
ui_new/src/
├── types/
│   ├── common.ts         — primitives (TrendDir, DORALevel, TimeRange…)
│   ├── metrics.ts        — MetricId, MetricTimeSeries, DORAResponse…
│   ├── widgets.ts        — WidgetConfig discriminated union, WidgetType
│   ├── dashboard.ts      — Dashboard entity, filters, layout, system templates
│   ├── api.ts            — request/response DTOs only; imports domain types from dashboard.ts
│   ├── user.ts           — CurrentUser, SystemStatus, MeResponse, ActivityEvent
│   ├── plugins.ts        — Plugin, IntegrationStatus, SourceSyncConfig…
│   ├── ai.ts             — AIInsight, ChatMessage, AIChatRequest/Response
│   └── mocks/
│       ├── metrics.ts
│       ├── dashboards.ts
│       ├── widgets.ts
│       ├── user.ts
│       └── ai.ts
├── components/
│   └── dashboard/
│       ├── DashboardRenderer.tsx
│       └── widgetRegistry.tsx  ← .tsx (contains JSX placeholder components)
└── (all .jsx files → .tsx with type annotations)
```

> **Note on api.ts scope:** `api.ts` contains only HTTP request/response DTOs. All domain entities (`Dashboard`, `DashboardFilters`, etc.) are defined in `dashboard.ts` and imported by `api.ts`. This avoids duplication and keeps the source of truth in one place.

## Dependencies

- TypeScript (add to `package.json`)
- `@types/react`, `@types/react-dom`
- Keep existing `axios`, `react`, `react-dom` versions
