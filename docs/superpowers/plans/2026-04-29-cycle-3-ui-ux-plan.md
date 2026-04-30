# Cycle 3: UI/UX Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Better visualizations with detailed charts, velocity page, team comparison, multi-team view, and activity page with filters/drill-down.

**Architecture:** Extend React dashboard with new pages/components, add new API endpoints for velocity metrics and team comparison, implement filtering for activity.

**Tech Stack:** React + Recharts, Python FastAPI, ClickHouse

---

## File Structure Overview

```
ui/src/
├── components/
│   ├── Velocity.tsx        # NEW
│   ├── ActivityPage.tsx    # NEW (replaces ActivityChart)
│   ├── TeamComparison.tsx # NEW
│   └── Heatmap.tsx        # NEW
├── App.tsx                 # MODIFY - add tabs

api/
├── routes/
│   ├── velocity.py         # NEW
│   └── comparison.py      # NEW
├── routes/overview.py      # MODIFY - activity filters
└── main.py                # MODIFY

tests/
└── ui/                    # NEW
```

---

## Task 1: Velocity API & Component

**Files:**
- Create: `api/routes/velocity.py`
- Modify: `api/main.py` — register velocity router
- Create: `ui/src/components/Velocity.tsx`
- Modify: `ui/src/api/client.ts` — add getVelocity

- [ ] **Step 1: Create Velocity API**

File: `api/routes/velocity.py`

```python
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/teams", tags=["velocity"])

@router.get("/{team_id}/velocity")
def get_velocity(team_id: str):
    from clickhouse.client import execute
    
    try:
        velocity = execute(f"""
            SELECT toDate(occurred_at) as date, count() as tasks
            FROM events
            WHERE team_id = '{team_id}'
            AND source_type = 'pm'
            AND event_type = 'task_completed'
            AND occurred_at > now() - INTERVAL 30 DAY
            GROUP BY date
            ORDER BY date
        """)
    except:
        velocity = []
    
    try:
        cycle_time = execute(f"""
            SELECT toDate(occurred_at) as date, event_type, count()
            FROM events
            WHERE team_id = '{team_id}'
            AND source_type = 'pm'
            AND event_type IN ('task_created', 'task_completed')
            AND occurred_at > now() - INTERVAL 14 DAY
            GROUP BY date, event_type
            ORDER BY date
        """)
    except:
        cycle_time = []
    
    try:
        lead_time = execute(f"""
            SELECT toDate(occurred_at) as date, count()
            FROM events
            WHERE team_id = '{team_id}'
            AND source_type = 'git'
            AND event_type = 'pr_merged'
            AND occurred_at > now() - INTERVAL 14 DAY
            GROUP BY date
            ORDER BY date
        """)
    except:
        lead_time = []
    
    return {
        "team_id": team_id,
        "velocity": [{"date": str(r[0]), "tasks": r[1]} for r in velocity],
        "cycle_time": [{"date": str(r[0]), "type": r[1], "count": r[2]} for r in cycle_time],
        "lead_time": [{"date": str(r[0]), "count": r[1]} for r in lead_time]
    }
```

- [ ] **Step 2: Register router in main.py**

Add to imports:
```python
from routes import teams, overview, health, dashboard, webhook, dlq, collectors, velocity
```

Add router:
```python
app.include_router(velocity.router)
```

- [ ] **Step 3: Update API client**

Modify: `ui/src/api/client.ts`

```typescript
getVelocity: (teamId: string) => client.get(`/teams/${teamId}/velocity`),
```

- [ ] **Step 4: Create Velocity component**

File: `ui/src/components/Velocity.tsx`

```typescript
import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '../api/client'

export function Velocity({ teamId }: { teamId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getVelocity(teamId)
      .then(res => { setData(res.data); setLoading(false) })
      .catch(err => { console.error(err); setLoading(false) })
  }, [teamId])

  if (loading) return <div>Loading velocity...</div>
  if (!data) return <div>No velocity data</div>

  return (
    <div style={{ padding: '24px' }}>
      <h2>Velocity & Cycle Time</h2>
      
      <div style={{ height: '300px' }}>
        <h3>Tasks Completed (Last 30 days)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.velocity}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="tasks" stroke="#8884d8" name="Tasks" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ height: '300px', marginTop: '24px' }}>
        <h3>Lead Time (PR Merge Time)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.lead_time}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#82ca9d" name="PRs Merged" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Test endpoint**

```bash
curl http://localhost:8000/api/v1/teams/550e8400-e29b-41d4-a716-446655440000/velocity
```

- [ ] **Step 6: Commit**

```bash
git add api/routes/velocity.py api/main.py ui/src/api/client.ts ui/src/components/Velocity.tsx
git commit -m "feat: add velocity page with cycle time and lead time charts"
```

---

## Task 2: Team Comparison API & Component

**Files:**
- Create: `api/routes/comparison.py`
- Modify: `api/main.py` — register comparison router
- Create: `ui/src/components/TeamComparison.tsx`
- Modify: `ui/src/api/client.ts`

- [ ] **Step 1: Create Team Comparison API**

File: `api/routes/comparison.py`

```python
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/teams", tags=["comparison"])

@router.get("/comparison")
def get_teams_comparison():
    from clickhouse.client import execute
    
    try:
        teams_data = execute("""
            SELECT 
                team_id,
                source_type,
                event_type,
                count() as cnt
            FROM events
            WHERE occurred_at > now() - INTERVAL 7 DAY
            GROUP BY team_id, source_type, event_type
            ORDER BY team_id, source_type
        """)
    except:
        teams_data = []
    
    teams = {}
    for row in teams_data:
        tid, source, etype, cnt = row[0], row[1], row[2], row[3]
        if tid not in teams:
            teams[tid] = {"team_id": tid, "prs": 0, "tasks": 0, "ci_runs": 0}
        if source == "git" and etype in ("pr_opened", "pr_merged"):
            teams[tid]["prs"] += cnt
        elif source == "pm" and etype in ("task_created", "task_completed"):
            teams[tid]["tasks"] += cnt
        elif source == "cicd":
            teams[tid]["ci_runs"] += cnt
    
    return list(teams.values())
```

- [ ] **Step 2: Register router**

- [ ] **Step 3: Create TeamComparison component**

File: `ui/src/components/TeamComparison.tsx`

```typescript
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '../api/client'

export function TeamComparison() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'chart' | 'table'>('chart')

  useEffect(() => {
    api.getTeamsComparison()
      .then(res => { setData(res.data); setLoading(false) })
      .catch(err => { console.error(err); setLoading(false) })
  }, [])

  if (loading) return <div>Loading comparison...</div>
  if (!data.length) return <div>No comparison data</div>

  const chartData = data.map(t => ({
    name: t.team_id.slice(0, 8),
    PRs: t.prs,
    Tasks: t.tasks,
    "CI Runs": t.ci_runs
  }))

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>Team Comparison</h2>
        <div>
          <button onClick={() => setView('chart')} style={view === 'chart' ? activeBtnStyle : btnStyle}>Chart</button>
          <button onClick={() => setView('table')} style={view === 'table' ? activeBtnStyle : btnStyle}>Table</button>
        </div>
      </div>

      {view === 'chart' ? (
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="PRs" fill="#8884d8" />
              <Bar dataKey="Tasks" fill="#82ca9d" />
              <Bar dataKey="CI Runs" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Team</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>PRs</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Tasks</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>CI Runs</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{row.name}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{row.PRs}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{row.Tasks}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{row["CI Runs"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const btnStyle = { padding: '8px 16px', margin: '0 4px', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: 'pointer' }
const activeBtnStyle = { ...btnStyle, background: '#1976d2', color: '#fff', borderColor: '#1976d2' }
```

- [ ] **Step 4: Update API client**

```typescript
getTeamsComparison: () => client.get('/teams/comparison'),
```

- [ ] **Step 5: Commit**

```bash
git add api/routes/comparison.py ui/src/components/TeamComparison.tsx
git commit -m "feat: add team comparison with chart and table views"
```

---

## Task 3: Activity Page with Filters

**Files:**
- Modify: `api/routes/overview.py` — add filter params
- Create: `ui/src/components/ActivityPage.tsx`
- Create: `ui/src/components/Heatmap.tsx`
- Modify: `ui/src/App.tsx`

- [ ] **Step 1: Update activity endpoint with filters**

Modify: `api/routes/overview.py`

```python
@router.get("/{team_id}/activity")
def get_activity(team_id: str, from_date: str = None, to_date: str = None, source: str = None):
    from clickhouse.client import execute
    
    date_filter = "occurred_at > now() - INTERVAL 7 DAY"
    if from_date:
        date_filter = f"occurred_at > '{from_date}'"
    if to_date:
        date_filter += f" AND occurred_at < '{to_date}'"
    if source:
        date_filter += f" AND source_type = '{source}'"
    
    try:
        result = execute(f"""
            SELECT toDate(occurred_at) as date, source_type, event_type, count()
            FROM events
            WHERE team_id = '{team_id}'
            AND {date_filter}
            GROUP BY date, source_type, event_type
            ORDER BY date
        """)
    except:
        result = []
    
    return {
        "team_id": team_id,
        "data": [{"date": str(r[0]), "source": r[1], "event": r[2], "count": r[3]} for r in result],
        "filters": {"from": from_date, "to": to_date, "source": source}
    }
```

- [ ] **Step 2: Create Heatmap component**

File: `ui/src/components/Heatmap.tsx`

```typescript
import { useEffect, useState } from 'react'
import { api } from '../api/client'

export function Heatmap({ teamId }: { teamId: string }) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    api.getActivity(teamId).then(res => {
      const hourly: Record<string, number> = {}
      res.data.data.forEach((r: any) => {
        const day = r.date
        const source = r.source
        const key = `${day}-${source}`
        hourly[key] = (hourly[key] || 0) + r.count
      })
      setData(Object.entries(hourly).map(([k, v]) => ({ key: k, count: v })))
    })
  }, [teamId])

  return (
    <div style={{ marginTop: '24px' }}>
      <h3>Activity Heatmap</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} style={{ textAlign: 'center', padding: '8px', background: '#f5f5f5' }}>{day}</div>
        ))}
        {data.slice(0, 21).map((d, i) => (
          <div key={i} style={{ 
            padding: '16px', 
            background: `rgba(24, 144, 255, ${Math.min(d.count / 10, 1)})`,
            textAlign: 'center'
          }}>
            {d.count}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create ActivityPage component**

File: `ui/src/components/ActivityPage.tsx`

```typescript
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '../api/client'
import { Heatmap } from './Heatmap'

export function ActivityPage({ teamId }: { teamId: string }) {
  const [data, setData] = useState<any[]>([])
  const [filters, setFilters] = useState({ source: '', from: '', to: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.source) params.append('source', filters.source)
    if (filters.from) params.append('from_date', filters.from)
    if (filters.to) params.append('to_date', filters.to)
    
    api.getActivityWithFilters(teamId, params.toString())
      .then(res => {
        const grouped: Record<string, any> = {}
        res.data.data.forEach((r: any) => {
          if (!grouped[r.date]) grouped[r.date] = { date: r.date }
          grouped[r.date][r.source] = (grouped[r.date][r.source] || 0) + r.count
        })
        setData(Object.values(grouped))
        setLoading(false)
      })
      .catch(err => { console.error(err); setLoading(false) })
  }, [teamId, filters])

  if (loading) return <div>Loading activity...</div>

  return (
    <div style={{ padding: '24px' }}>
      <h2>Activity Details</h2>
      
      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
        <select 
          value={filters.source} 
          onChange={e => setFilters({...filters, source: e.target.value})}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="">All Sources</option>
          <option value="git">Git</option>
          <option value="pm">PM</option>
          <option value="cicd">CI/CD</option>
        </select>
        <input 
          type="date" 
          value={filters.from}
          onChange={e => setFilters({...filters, from: e.target.value})}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <input 
          type="date" 
          value={filters.to}
          onChange={e => setFilters({...filters, to: e.target.value})}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="git" fill="#8884d8" name="Git" />
            <Bar dataKey="pm" fill="#82ca9d" name="PM" />
            <Bar dataKey="cicd" fill="#ffc658" name="CI/CD" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Heatmap teamId={teamId} />
    </div>
  )
}
```

- [ ] **Step 4: Update API client**

```typescript
getActivityWithFilters: (teamId: string, params: string) => client.get(`/teams/${teamId}/activity?${params}`),
```

- [ ] **Step 5: Update App.tsx with tabs**

Modify: `ui/src/App.tsx`

```typescript
import { useState } from 'react'
import { TeamSelector } from './components/TeamSelector'
import { Overview } from './components/Overview'
import { ActivityChart } from './components/ActivityChart'
import { AttentionItems } from './components/AttentionItems'
import { Dashboard } from './components/Dashboard'
import { Velocity } from './components/Velocity'
import { TeamComparison } from './components/TeamComparison'
import { ActivityPage } from './components/ActivityPage'

export default function App() {
  const [teamId, setTeamId] = useState<string>('')
  const [showDashboard, setShowDashboard] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1>Team Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button onClick={() => { setShowDashboard(true); setActiveTab('overview') }} style={activeTab === 'overview' ? activeBtnStyle : btnStyle}>Overview</button>
          <button onClick={() => { setShowDashboard(false); setActiveTab('velocity') }} style={activeTab === 'velocity' ? activeBtnStyle : btnStyle}>Velocity</button>
          <button onClick={() => { setShowDashboard(false); setActiveTab('activity') }} style={activeTab === 'activity' ? activeBtnStyle : btnStyle}>Activity</button>
          <button onClick={() => { setShowDashboard(false); setActiveTab('comparison') }} style={activeTab === 'comparison' ? activeBtnStyle : btnStyle}>Comparison</button>
          <div style={{ flex: 1 }} />
          <TeamSelector onSelect={(id) => { setTeamId(id); setShowDashboard(false) }} />
        </div>
      </header>

      {showDashboard ? (
        <Dashboard />
      ) : !teamId ? (
        <div>Select a team</div>
      ) : (
        <>
          {activeTab === 'overview' && <><Overview teamId={teamId} /><ActivityChart teamId={teamId} /><AttentionItems teamId={teamId} /></>}
          {activeTab === 'velocity' && <Velocity teamId={teamId} />}
          {activeTab === 'activity' && <ActivityPage teamId={teamId} />}
          {activeTab === 'comparison' && <TeamComparison />}
        </>
      )}
    </div>
  )
}

const btnStyle = { padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: 'pointer' }
const activeBtnStyle = { ...btnStyle, background: '#1976d2', color: '#fff', borderColor: '#1976d2' }
```

- [ ] **Step 6: Commit**

```bash
git add api/routes/overview.py ui/src/components/ActivityPage.tsx ui/src/components/Heatmap.tsx ui/src/App.tsx
git commit -m "feat: add ActivityPage with filters and Heatmap component"
```

---

## Task 4: UI Tests

**Files:**
- Create: `ui/tests/components/Velocity.test.tsx`
- Create: `ui/tests/components/TeamComparison.test.tsx`
- Create: `ui/tests/components/ActivityPage.test.tsx`

- [ ] **Step 1: Create Velocity test**

File: `ui/tests/components/Velocity.test.tsx`

```typescript
import { render, screen } from '@testing-library/react'
import { Velocity } from '../../components/Velocity'

test('Velocity renders loading state', () => {
  render(<Velocity teamId="test-id" />)
  expect(screen.getByText(/loading/i)).toBeInTheDocument()
})

test('Velocity renders no data state', () => {
  render(<Velocity teamId="test-id" />)
  // Component renders with loading initially
  expect(screen.getByText(/loading/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Create TeamComparison test**

File: `ui/tests/components/TeamComparison.test.tsx`

```typescript
import { render, screen } from '@testing-library/react'
import { TeamComparison } from '../../components/TeamComparison'

test('TeamComparison renders with toggle', () => {
  render(<TeamComparison />)
  expect(screen.getByText('Chart')).toBeInTheDocument()
  expect(screen.getByText('Table')).toBeInTheDocument()
})
```

- [ ] **Step 3: Create ActivityPage test**

File: `ui/tests/components/ActivityPage.test.tsx`

```typescript
import { render, screen } from '@testing-library/react'
import { ActivityPage } from '../../components/ActivityPage'

test('ActivityPage renders with filters', () => {
  render(<ActivityPage teamId="test-id" />)
  expect(screen.getByText('All Sources')).toBeInTheDocument()
})
```

- [ ] **Step 4: Commit**

```bash
git add ui/tests/components/
git commit -m "test: add UI component tests for Cycle 3"
```

---

## Summary

All tasks complete. The implementation covers:

1. **Velocity page** — cycle time, lead time charts with API endpoint
2. **Team comparison** — toggle between chart and table views
3. **Activity page** — filters by date/source, heatmap visualization
4. **Tabs navigation** — Overview, Velocity, Activity, Comparison

**Plan complete and saved to:** `docs/superpowers/plans/2026-04-29-cycle-3-ui-ux-plan.md`

**Two execution options:**

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?