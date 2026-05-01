# UI Pixel-Perfect Redesign — Design Spec

_Date: 2026-05-01_

## Overview

Full implementation update to achieve pixel-perfect match with the design prototype from Claude Design (`Metraly.html`, `dashboard-roles.jsx`, `metrics-explorer.jsx`, `dash-wizard.jsx`).

## Design Source

- **Prototype**: `/home/zubarev/Downloads/des/metraly/project/Metraly.html`
- **Role dashboards**: `dashboard-roles.jsx`
- **Metrics explorer**: `metrics-explorer.jsx`
- **Dashboard wizard**: `dash-wizard.jsx`

## 1. CSS Design Tokens (index.css)

### New CSS Variables
```css
--sidebar-w: 228px;
--border2:   rgba(255,255,255,0.12);
```

### Scrollbar (6px, not 8px)
```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
```

### Glass Utility
```css
.glass {
  background: var(--glass);
  border: 1px solid var(--border);
  border-radius: 12px;
  backdrop-filter: blur(16px);
}
```

### Animation Stagger (6 levels)
```css
.fade-up-1 { animation: fade-up 0.35s 0.06s ease both; }
.fade-up-2 { animation: fade-up 0.35s 0.12s ease both; }
.fade-up-3 { animation: fade-up 0.35s 0.18s ease both; }
.fade-up-4 { animation: fade-up 0.35s 0.24s ease both; }
.fade-up-5 { animation: fade-up 0.35s 0.30s ease both; }
.fade-up-6 { animation: fade-up 0.35s 0.36s ease both; }
```

## 2. Icon System (Icon.tsx)

### Required Icons (30+)
zap, home, bar2, gitPR, xCircle, alertTri, clock, brain, puzzle, settings, users, bell, search, star, download, check, github, jira, gitlab, linear, slack, pagerduty, arrowRight, chevronDown, activity, boxes, cpu, trendingUp, filter, layers, chart, plus, x, database, link, sparkles

### Implementation
Lucide-style inline SVGs with strokeWidth="1.5", strokeLinecap="round", strokeLinejoin="round".

## 3. Sidebar Component

- Width: 228px (not 240px)
- Sections: Pinned, Dashboards, Analytics, Configure, System
- Logo: gradient icon (32x32), "Metraly" text with gradient clip
- Status pill: "All systems nominal" with pulse-dot animation
- Pinned dashboards from localStorage
- Hover states: cyan highlight, left border indicator
- User footer: "JD" avatar, "Jamie Dev" / "Admin"

### Navigation Items
```tsx
[
  { id: 'dashboard', icon: 'home', label: 'Overview' },
  { id: 'cto', icon: 'trendingUp', label: 'CTO' },
  { id: 'vp', icon: 'users', label: 'VP Engineering' },
  { id: 'tl', icon: 'gitPR', label: 'Tech Lead' },
  { id: 'devops', icon: 'cpu', label: 'DevOps / SRE' },
  { id: 'ic', icon: 'activity', label: 'My View' },
  { id: 'wizard', icon: 'plus', label: 'New Dashboard', accent: true },
  { id: 'metrics', icon: 'bar2', label: 'Metrics Explorer' },
  { id: 'ai', icon: 'brain', label: 'AI Assistant', badge: 'NEW' },
  { id: 'plugins', icon: 'puzzle', label: 'Marketplace' },
  { id: 'sources', icon: 'link', label: 'Connect Sources' },
  { id: 'settings', icon: 'settings', label: 'Settings' },
]
```

## 4. Topbar Component

- Height: 56px
- Background: rgba(11,15,25,0.6) with backdrop-filter: blur(8px)
- Search: placeholder "Quick search…", ⌘K badge
- Bell: notification dot (7px, cyan, positioned top-right)

## 5. Card Components

### MetricCard (DashboardScreen)
- 36x36 icon container with accentColor background/border
- Styled trend badge (colored background + border)
- Sparkline with gradient fill
- Hover: glass2 background, shadow, translateY(-2px)
- Padding: 20px 20px 16px

### StatCard (Role dashboards)
- 32x32 icon container
- Padding: 16px 16px 13px
- Same hover behavior

### Widget
- Glass background, border, padding 16px 18px, borderRadius 12

## 6. DashboardScreen

### Metric Cards (4)
```tsx
[
  { icon: 'gitPR', label: 'PRs awaiting review', value: '14', trend: '+3 today', trendDir: 'down', accentColor: 'var(--cyan)' },
  { icon: 'xCircle', label: 'Failed builds (24h)', value: '3', trend: '−5 vs avg', trendDir: 'up', accentColor: 'var(--error)' },
  { icon: 'alertTri', label: 'Blocked tasks', value: '7', trend: 'No change', trendDir: 'neutral', accentColor: 'var(--warning)' },
  { icon: 'clock', label: 'Median CI time', value: '4m 22s', trend: '−18s', trendDir: 'up', accentColor: 'var(--purple)' },
]
```

### AI Insights (3 columns)
```tsx
[
  { title: 'CI slowdown detected in monorepo', body: '3 workflows exceeded p95 latency...', action: 'View affected jobs' },
  { title: 'PR review load imbalanced', body: '@alex.kim has 9 open PRs...', action: 'Open PR queue' },
  { title: 'Deployment cadence slowing', body: 'Release frequency dropped 40%...', action: null },
]
```

### Recent Activity
- Status dots with colors (success/cyan/warning/error)
- 4 items with who/what/when

## 7. Role Dashboards

### CTODashboard
- StatCards: Engineering Health, Deploy Frequency, Lead Time, Change Failure Rate
- Gauge: Health Score (0.84, semicircle)
- AreaChart: Deployment Frequency (30 days)
- BarChart: Team Velocity (current vs previous sprint)
- InlineInsight: Security score warning

### VPDashboard
- StatCards: Sprint Velocity, Avg PR Cycle Time, At-Risk Deliverables, Open PRs
- Sprint velocity chart
- BarChart: PR cycle by team
- Heatmap: delivery heatmap

### TLDashboard
- CI pass rate, PR queue, burndown, failing builds

### DevOpsDashboard
- Deploy frequency, MTTR, deploy heatmap, incidents

### ICDashboard
- My PRs, CI runs, review queue, sprint progress

## 8. Remaining Screens

| Screen | Description |
|--------|-------------|
| WizardScreen | 4-step connect sources wizard |
| PluginScreen | Marketplace with search/filters |
| AIScreen | Chat interface |
| MetricsScreen | Grafana-style metrics explorer |
| DashboardWizardScreen | Custom dashboard builder |
| PlaceholderScreen | Settings placeholder |

## Out of Scope

- Backend API changes (already implemented)
- Real ClickHouse queries
- Authentication