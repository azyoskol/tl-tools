# Cycle 3: UI/UX Polish — Design Specification

## Goal

Better visualizations, user experience with detailed charts, velocity metrics, team comparison, and multi-team views.

## 1. Velocity Page

### Component: `ui/src/components/Velocity.tsx`

### Metrics

| Metric | Formula | Source |
|--------|---------|--------|
| Cycle Time | `completed_at - started_at` | events (pm) |
| Velocity | `SUM(story_points)` per sprint | events (pm) |
| Lead Time | `delivered_at - created_at` | events (pm, git) |
| PR Merge Time | `merged_at - created_at` | events (git) |
| WIP Count | Active tasks count | events (pm) |

### Visualization

- **Line chart**: velocity per sprint (last 10 sprints)
- **Bar chart**: cycle time distribution
- **Line chart**: lead time trend

### API

- `GET /api/v1/teams/{id}/velocity` — update with real data

---

## 2. Team Comparison

### Component: `ui/src/components/TeamComparison.tsx`

### Views

- **Toggle**: table / charts
- **Table**: columns — team, PRs, tasks, CI%, velocity, cycle time
- **Charts**: grouped bar chart with team overlay

### API

- `GET /api/v1/teams/comparison` — aggregated metrics for all teams

---

## 3. Multi-Team View (Extended Dashboard)

### Component: `ui/src/components/Dashboard.tsx` (extend)

### Additional Features

- Top teams by activity (already exists)
- Team comparison chart
- Heatmap by day of week

---

## 4. Activity Page (Detailed)

### Component: `ui/src/components/ActivityPage.tsx` (replaces ActivityChart)

### Features

- **Filters**: date range, source, event type
- **Drill-down**: click day → popup with events
- **Timeline**: full timeline (scrollable)
- **Heatmap**: by hour and day of week
- **Tops**: top authors, top projects

### API

- `GET /api/v1/teams/{id}/activity?from=&to=&source=&type=` — with filters

---

## 5. File Structure

```
ui/src/
├── components/
│   ├── Velocity.tsx        # NEW
│   ├── ActivityPage.tsx   # NEW (replaces ActivityChart)
│   ├── TeamComparison.tsx # NEW
│   ├── Heatmap.tsx        # NEW
│   └── Dashboard.tsx      # MODIFY
├── pages/
│   └── App.tsx            # MODIFY - add tabs
└── api/
    └── client.ts          # MODIFY - add new endpoints
```

---

## 6. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/teams/{id}/velocity` | GET | Velocity metrics with trends |
| `/api/v1/teams/comparison` | GET | All teams comparison data |
| `/api/v1/teams/{id}/activity` | GET | Activity with filters |

---

## 7. UI Tests

- `ui/tests/components/Velocity.test.tsx`
- `ui/tests/components/TeamComparison.test.tsx`
- `ui/tests/components/ActivityPage.test.tsx`

---

## 8. Not in Scope

- Advanced analytics (Cycle 4)
- Real-time updates (future)
- Custom dashboards (future)
- Grafana integration (Cycle 5)