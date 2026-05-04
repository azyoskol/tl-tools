# Dashboard Rendering Flow (Backend → UI)

## Overview
The Metraly UI displays dashboards that are stored in the backend database. The rendering pipeline consists of three main stages:

1. **Backend storage** – Dashboard definitions (metadata, widget list, layout grid) are persisted as JSONB in the `dashboards` table (see `001_dashboards.sql`). Each widget instance contains a `widgetType` and a `config` field (`json.RawMessage`).
2. **API serving** – The Go API exposes `GET /api/v1/dashboards/{id}` which serialises a `domain.Dashboard` struct (see `cmd/api/domain/dashboard.go`) to JSON. When a client needs widget data, it calls `POST /api/v1/widgets/data` with a list of widget instance IDs. The handler (`handlers/widget.go`) forwards the request to `biz/dashboard_svc.FetchWidgetData`. This service uses an `errgroup` to invoke the appropriate widget data generators in parallel, returning a map of `instanceId → widgetData`.
3. **Frontend consumption** – The React UI (in `ui/`) fetches the dashboard JSON via the generated client (`api/client.js`). The response is deserialised into the TypeScript `Dashboard` type (defined in `ui/src/types/api.ts`). `DashboardScreen` passes the `widgets` array and `layout` to `DashboardRenderer`. The renderer creates a CSS‑grid based on the `layout` entries, then switches on `widgetType` to render the correct component (`MetricChart`, `StatCard`, `DORAOverview`, etc.). For each widget component, the UI either uses the data already supplied by the bulk `/widgets/data` call or makes an individual `POST /api/v1/widgets/data` request if the widget was added later.

## Key implementation details
- **Optimistic locking** – Updates to a dashboard include a `version` field; the repo layer updates with `WHERE id=$1 AND version=$2` to detect conflicts.
- **Parallel data fetching** – `biz/dashboard_svc.FetchWidgetData` builds a slice of `WidgetDataRequest` objects and runs them concurrently with `errgroup.WithContext`. This reduces latency when a dashboard contains many widgets.
- **Caching** – Metric time‑series are cached in Redis for 5 min (`biz/metrics_svc.go`). Dashboard JSON is cached for 30 s (`biz/dashboard_svc.go`).
- **Error handling** – All errors are converted to a standardized JSON error shape (`{ "error": { "code": "…", "message": "…" } }`) as described in `CLAUDE.md`.

## Flow diagram (textual)
```
[PostgreSQL] <---> [Go API (cmd/api)] <---> [Redis cache]
      ^                                 |
      |                                 v
   HTTP GET /dashboards/{id}    HTTP POST /widgets/data
      |                                 |
      v                                 v
[React UI] <-- fetches dashboard JSON & widget data --> renders components
```

This document provides a concise end‑to‑end view of how a dashboard moves from the database model to the rendered UI.

## Implementation Snippets

*MetricChartWidget* renders a chart for a metric using either a bar chart or an area chart, depending on the widget's configuration. It displays the metric label, the latest value with its unit, and optionally a previous period for comparison.

```tsx
return (
  <div
    style={{
      ...widgetStyle,
      background: 'var(--glass)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}
  >
    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{displayLabel}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>
      {displayValue}
      <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>{data.unit}</span>
    </div>
    {isBar ? (
      <div style={{ flex: 1, minHeight: 80 }}>
        <BarChart
          labels={labels}
          values={currentValues}
          compare={compareValues}
          color={chartColor}
          compareColor="var(--purple)"
          height={90}
          horizontal={chartVariant === 'bar-horizontal'}
        />
      </div>
    ) : (
      <div style={{ flex: 1, minHeight: 60 }}>
        <AreaChart
          data={currentValues}
          compare={compareValues}
          labels={labels}
          color={chartColor}
          compareColor="var(--purple)"
          height={70}
          showGrid={false}
          showAxis={false}
        />
      </div>
    )}
  </div>
);
```
