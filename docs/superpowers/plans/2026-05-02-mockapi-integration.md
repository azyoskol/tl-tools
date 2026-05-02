# MockAPI Integration for Dashboard Screens

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate mockApi into DashboardScreen and RoleDashboardScreen via hooks, enabling future backend replacement

**Architecture:** Components fetch data via custom hooks (useDashboardOverview, useRoleDashboard). Hooks call mockApi, components remain unaware of data source. Add recentActivity to Dashboard model.

**Tech Stack:** React hooks, TypeScript, mockApi

---

## File Structure

```
ui_new/src/hooks/
├── useDashboardOverview.ts    (create) - DashboardScreen hook
└── useRoleDashboard.ts        (create) - RoleDashboardScreen hook

ui_new/src/types/dashboard.ts  (modify) - add recentActivity field

ui_new/src/api/mockApi.ts      (modify) - add recentActivity to dashboards + helper method

ui_new/src/features/dashboard/DashboardScreen.tsx        (modify) - use hook

ui_new/src/features/roleDashboards/RoleDashboardScreen.tsx (modify) - use hook
```

---

## Tasks

### Task 1: Add recentActivity to Dashboard model

**Files:**
- Modify: `ui_new/src/types/dashboard.ts:36-53`

- [ ] **Step 1: Add recentActivity to Dashboard interface**

```typescript
export interface Dashboard {
  // ... existing fields ...
  recentActivity?: ActivityEvent[];  // ADD THIS
}
```

- [ ] **Step 2: Add import for ActivityEvent**

```typescript
import { ActivityEvent } from './user';
```

---

### Task 2: Update mockApi to include recentActivity in dashboards

**Files:**
- Modify: `ui_new/src/api/mockApi.ts:275-326`

- [ ] **Step 1: Add generateRecentActivity helper function after generateLayout (around line 268)**

```typescript
function generateRecentActivity(): ActivityEvent[] {
  const events = [
    { actor: 'push → main', description: 'CI pipeline triggered for feat/auth-tokens', color: 'var(--cyan)' },
    { actor: 'alex.kim', description: 'Merged PR #812: Add rate limiting middleware', color: 'var(--success)' },
    { actor: 'sara.chen', description: 'PR #814 opened: Refactor API layer', color: 'var(--warning)' },
    { actor: 'ci-bot', description: 'Deploy to staging failed — build #4221', color: 'var(--error)' },
  ];
  return events.map((e, i) => ({
    id: `activity-${i}`,
    actor: e.actor,
    description: e.description,
    relativeTime: ['2 min ago', '14 min ago', '31 min ago', '1 hr ago'][i],
    color: e.color,
  }));
}
```

- [ ] **Step 2: Add recentActivity to userDash in initDashboards (line 285)**

```typescript
const userDash: Dashboard = {
  // ... existing fields ...
  recentActivity: generateRecentActivity(),
};
```

- [ ] **Step 3: Add getRecentActivity method to mockApi (after line 440)**

```typescript
async getRecentActivity(): Promise<ActivityEvent[]> {
  await delay();
  return generateRecentActivity();
}
```

---

### Task 3: Create useDashboardOverview hook

**Files:**
- Create: `ui_new/src/hooks/useDashboardOverview.ts`

- [ ] **Step 1: Create hook file**

```typescript
// @ts-nocheck
import { useState, useEffect } from 'react';
import { mockApi } from '../api/mockApi';
import type { ActivityEvent } from '../types/user';

interface Metric {
  icon: string;
  label: string;
  value: string;
  trend: string;
  trendDir: 'up' | 'down' | 'neutral';
  color: string;
  sparkData: number[];
}

interface Insight {
  title: string;
  body: string;
  action?: string;
}

interface DashboardOverviewData {
  metrics: Metric[];
  insights: Insight[];
  recentActivity: ActivityEvent[];
  isLoading: boolean;
  error: string | null;
}

const mockMetrics: Metric[] = [
  { icon: 'gitPR', label: 'PRs awaiting review', value: '14', trend: '+3 today', trendDir: 'down', color: 'cyan', sparkData: [4,7,5,9,6,8,11,14] },
  { icon: 'xCircle', label: 'Failed builds (24h)', value: '3', trend: '−5 vs avg', trendDir: 'up', color: 'error', sparkData: [12,9,11,7,5,8,4,3] },
  { icon: 'alertTri', label: 'Blocked tasks', value: '7', trend: 'No change', trendDir: 'neutral', color: 'warning', sparkData: [5,6,7,7,6,8,7,7] },
  { icon: 'clock', label: 'Median CI time', value: '4m 22s', trend: '−18s', trendDir: 'up', color: 'purple', sparkData: [8,7,9,6,7,5,5,4] },
];

const mockInsights: Insight[] = [
  { title: 'CI slowdown detected in monorepo', body: '3 workflows exceeded p95 latency over the last 6 hours. Root cause appears to be a Docker layer cache miss introduced in commit a3f91b.', action: 'View affected jobs' },
  { title: 'PR review load imbalanced', body: '@alex.kim has 9 open PRs awaiting review while the team average is 2.3. Consider redistributing or enabling auto-assignment.', action: 'Open PR queue' },
  { title: 'Deployment cadence slowing', body: 'Release frequency dropped 40% this week compared to the 4-week rolling average. No clear blocker found — recommend a retro.' },
];

export function useDashboardOverview(): DashboardOverviewData {
  const [data, setData] = useState<DashboardOverviewData>({
    metrics: [],
    insights: [],
    recentActivity: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [insights, recentActivity] = await Promise.all([
          mockApi.getAIInsights(),
          mockApi.getRecentActivity(),
        ]);

        // Map mockApi data to component format
        const mappedInsights: Insight[] = insights.map((ins) => ({
          title: ins.title,
          body: ins.body,
          action: ins.action,
        }));

        setData({
          metrics: mockMetrics,
          insights: mappedInsights,
          recentActivity,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        setData((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load dashboard data',
        }));
      }
    }

    fetchData();
  }, []);

  return data;
}
```

---

### Task 4: Create useRoleDashboard hook

**Files:**
- Create: `ui_new/src/hooks/useRoleDashboard.ts`

- [ ] **Step 1: Create hook file**

```typescript
// @ts-nocheck
import { useState, useEffect } from 'react';
import { mockApi } from '../api/mockApi';
import type { Dashboard } from '../types/dashboard';
import type { WidgetDataItem } from '../types/api';

interface UseRoleDashboardResult {
  dashboard: Dashboard | null;
  widgetData: Record<string, any>;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const ROLE_DASHBOARD_IDS: Record<string, string> = {
  cto: 'dash-cto',
  vp: 'dash-vp',
  tl: 'dash-tl',
  devops: 'dash-devops',
  ic: 'dash-ic',
};

export function useRoleDashboard(roleId: string): UseRoleDashboardResult {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgetData, setWidgetData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!roleId || roleId === 'overview') {
      setDashboard(null);
      setIsLoading(false);
      return;
    }

    const dashboardId = ROLE_DASHBOARD_IDS[roleId];
    if (!dashboardId) {
      setError(`Unknown role: ${roleId}`);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch dashboard
      const dash = await mockApi.getDashboard(dashboardId);
      setDashboard(dash);

      // Fetch widget data
      if (dash.widgets.length > 0) {
        const widgetRequests = dash.widgets.map((w) => ({
          instanceId: w.instanceId,
          widgetType: w.widgetType,
          config: w.config,
        }));

        const dataResponse = await mockApi.getDashboardData(dashboardId, widgetRequests);

        // Map to record by instanceId
        const dataMap: Record<string, any> = {};
        dataResponse.widgets.forEach((item: WidgetDataItem) => {
          dataMap[item.instanceId] = item.data;
        });
        setWidgetData(dataMap);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [roleId]);

  return {
    dashboard,
    widgetData,
    isLoading,
    error,
    refresh: fetchData,
  };
}
```

---

### Task 5: Update DashboardScreen to use hook

**Files:**
- Modify: `ui_new/src/features/dashboard/DashboardScreen.tsx:1-87`

- [ ] **Step 1: Add import for useDashboardOverview**

```typescript
import { useDashboardOverview } from '../../hooks/useDashboardOverview';
```

- [ ] **Step 2: Replace hardcoded data with hook**

```typescript
export const DashboardScreen = () => {
  const { tweaks } = useTweaks();
  const { metrics, insights, recentActivity, isLoading } = useDashboardOverview();
  const density = tweaks.density as 'compact' | 'comfortable' | 'spacious';
  const gap = { compact: 12, comfortable: 16, spacious: 24 }[density] ?? 16;
  const padding = { compact: '16px 20px', comfortable: '24px 28px', spacious: '32px 36px' }[density] ?? '24px 28px';

  if (isLoading) {
    return (
      <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--muted)' }}>Loading...</span>
      </div>
    );
  }

  return (
    // ... keep existing JSX, but use recentActivity from hook instead of hardcoded
  );
};
```

- [ ] **Step 3: Update recentActivity rendering**

Find this section:
```tsx
const recentActivity = [
  { who: 'push → main', what: 'CI pipeline triggered for feat/auth-tokens', when: '2 min ago', color: 'var(--cyan)' },
  ...
];
```

Replace with hook data in JSX:
```tsx
{recentActivity.map((ev, i) => (
  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
    <div style={{ width: 6, height: 6, borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--muted2)', marginRight: 6 }}>{ev.actor}</span>
        {ev.description}
      </div>
    </div>
    <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{ev.relativeTime}</span>
  </div>
))}
```

---

### Task 6: Update RoleDashboardScreen to use hook

**Files:**
- Modify: `ui_new/src/features/roleDashboards/RoleDashboardScreen.tsx:1-133`

- [ ] **Step 1: Add import for useRoleDashboard**

```typescript
import { useRoleDashboard } from '../../hooks/useRoleDashboard';
```

- [ ] **Step 2: Remove mockDashboards and related code**

Remove lines 4, 15-21:
```typescript
// DELETE:
import { createMockCTODashboard, createMockVPDashboard, createMockTLDashboard, createMockDevOpsDashboard, createMockICDashboard } from '../../types/mocks/dashboards';

const mockDashboards: Record<string, ReturnType<typeof createMockCTODashboard>> = {
  cto: createMockCTODashboard(),
  vp: createMockVPDashboard(),
  tl: createMockTLDashboard(),
  devops: createMockDevOpsDashboard(),
  ic: createMockICDashboard(),
};
```

- [ ] **Step 3: Update component to use hook**

Replace:
```typescript
export const RoleDashboardScreen: React.FC<RoleDashboardScreenProps> = ({ initialRole = 'cto', onNewDashboard, onNavigate }) => {
  const [role, setRole] = useState(initialRole);
  // ...
  const renderRole = () => {
    const dashboard = mockDashboards[role];
    if (!dashboard) return null;
    return <DashboardRenderer dashboard={dashboard} />;
  };
```

With:
```typescript
export const RoleDashboardScreen: React.FC<RoleDashboardScreenProps> = ({ initialRole = 'cto', onNewDashboard, onNavigate }) => {
  const [role, setRole] = useState(initialRole);
  const { dashboard, widgetData, isLoading } = useRoleDashboard(role);

  // ... existing useEffect and handlers ...

  const renderRole = () => {
    if (isLoading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <span style={{ color: 'var(--muted)' }}>Loading dashboard...</span>
        </div>
      );
    }
    if (!dashboard) return null;
    return <DashboardRenderer dashboard={dashboard} widgetData={widgetData} />;
  };
```

---

### Task 7: Update DashboardRenderer to accept widgetData prop

**Files:**
- Modify: `ui_new/src/components/dashboard/DashboardRenderer.tsx:12`

- [ ] **Step 1: The component already accepts widgetData prop**

The interface already has it:
```typescript
interface DashboardRendererProps {
  dashboard: Dashboard;
  widgetData?: Record<string, MetricTimeSeries>;
}
```

But the widget type in widgetRegistry expects different data. This is already correct - widgetData is passed through. No changes needed.

---

## Verification

Run the app and verify:
1. DashboardScreen loads metrics, insights, recentActivity from mockApi
2. RoleDashboardScreen loads different dashboards per role via mockApi
3. Loading states display correctly

---

## Plan complete

Save to: `docs/superpowers/plans/2026-05-02-mockapi-integration.md`