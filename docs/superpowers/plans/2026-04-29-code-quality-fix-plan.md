# Code Quality Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix code quality issues from code review - add TypeScript interfaces, error states, constants, shared hooks

**Architecture:** Add shared types/constants/hooks files, refactor components to use proper typing

**Tech Stack:** TypeScript, React, FastAPI, Python

---

## File Structure Overview

```
ui/src/
├── types/
│   └── index.ts          # NEW - shared interfaces
├── hooks/
│   └── useTeams.ts       # NEW - shared team names hook
├── constants/
│   └── events.ts        # NEW - event type constants
├── components/
│   ├── Dashboard.tsx    # MODIFY - use types, error state
│   ├── TeamComparison.tsx  # MODIFY - use types
│   ├── Velocity.tsx     # MODIFY - use types
│   └── ActivityPage.tsx    # MODIFY - use types

api/
├── constants.py         # NEW - source/event type constants
├── routes/
│   ├── velocity.py      # MODIFY - return types, constants
│   └── overview.py      # MODIFY - return types, constants
```

---

## Task 1: Create Shared TypeScript Interfaces

**Files:**
- Create: `ui/src/types/index.ts`
- Modify: `ui/src/api/client.ts` - add types

- [ ] **Step 1: Create types/index.ts**

```typescript
// Team types
export interface Team {
  id: string
  name: string
}

// Dashboard types
export interface OverviewMetrics {
  prs_awaiting_review: number
  blocked_tasks: number
  ci_failures_last_hour: number
}

export interface ActivityItem {
  date: string
  source: 'git' | 'pm' | 'cicd'
  event: string
  count: number
}

export interface HourlyActivity {
  hour: number
  count: number
}

export interface TopTeam {
  team_id: string
  source: string
  count: number
}

export interface DashboardData {
  overview: OverviewMetrics
  activity: ActivityItem[]
  top_teams: TopTeam[]
  hourly: HourlyActivity[]
  top_authors: { author: string; count: number }[]
}

// Velocity types
export interface VelocityData {
  team_id: string
  velocity: { date: string; tasks: number }[]
  cycle_time: { date: string; type: string; count: number }[]
  lead_time: { date: string; count: number }[]
}

// Team Comparison types
export interface TeamComparisonData {
  team_id: string
  prs: number
  tasks: number
  ci_runs: number
}

// Activity Page types
export interface ActivityFilters {
  from?: string
  to?: string
  source?: string
}

export interface ActivityPageData {
  team_id: string
  data: ActivityItem[]
  filters: ActivityFilters
}
```

- [ ] **Step 2: Update client.ts with types**

Modify: `ui/src/api/client.ts`

```typescript
import { Team, DashboardData, VelocityData, TeamComparisonData, ActivityPageData } from '../types'

export const api = {
  getTeams: (): Promise<Team[]> => client.get('/teams'),
  getTeam: (id: string): Promise<Team> => client.get(`/teams/${id}`),
  getOverview: (teamId: string): Promise<OverviewMetrics> => client.get(`/teams/${teamId}/overview`),
  getActivity: (teamId: string): Promise<ActivityItem[]> => client.get(`/teams/${teamId}/activity`),
  getVelocity: (teamId: string): Promise<VelocityData> => client.get(`/teams/${teamId}/velocity`),
  getActivityWithFilters: (teamId: string, params: string): Promise<ActivityPageData> => 
    client.get(`/teams/${teamId}/activity?${params}`),
  getInsights: (teamId: string): Promise<{ insights: string[] }> => 
    client.get(`/teams/${teamId}/insights`),
  getDashboard: (): Promise<DashboardData> => client.get('/dashboard'),
  getTeamsComparison: (): Promise<TeamComparisonData[]> => client.get('/teams/comparison'),
}
```

- [ ] **Step 3: Commit**

```bash
git add ui/src/types/index.ts ui/src/api/client.ts
git commit -m "refactor: add shared TypeScript interfaces"
```

---

## Task 2: Create useTeams Hook (Fix Duplicate API Calls)

**Files:**
- Create: `ui/src/hooks/useTeams.ts`

- [ ] **Step 1: Create useTeams hook**

File: `ui/src/hooks/useTeams.ts`

```typescript
import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Team } from '../types'

export function useTeams() {
  const [teams, setTeams] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getTeams()
      .then(res => {
        const teamMap: Record<string, string> = {}
        res.data.forEach((t: Team) => { teamMap[t.id] = t.name })
        setTeams(teamMap)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load teams:', err)
        setError('Failed to load teams')
        setLoading(false)
      })
  }, [])

  const getTeamName = (teamId: string) => teams[teamId] || teamId.slice(0, 8)

  return { teams, loading, error, getTeamName }
}
```

- [ ] **Step 2: Update Dashboard.tsx to use hook**

Modify: `ui/src/components/Dashboard.tsx`

```typescript
import { useTeams } from '../hooks/useTeams'

export function Dashboard() {
  const { teams, loading: teamsLoading, error: teamsError, getTeamName } = useTeams()
  // ... rest of component
  // Replace t.team_id.slice(0, 8) with getTeamName(t.team_id)
}
```

- [ ] **Step 3: Update TeamComparison.tsx to use hook**

```typescript
import { useTeams } from '../hooks/useTeams'

export function TeamComparison() {
  const { teams, loading, error, getTeamName } = useTeams()
  // Replace t.team_id.slice(0, 8) with getTeamName(t.team_id)
}
```

- [ ] **Step 4: Commit**

```bash
git add ui/src/hooks/useTeams.ts ui/src/components/Dashboard.tsx ui/src/components/TeamComparison.tsx
git commit -m "refactor: extract useTeams hook to eliminate duplicate API calls"
```

---

## Task 3: Add Error States to UI Components

**Files:**
- Modify: `ui/src/components/Dashboard.tsx`
- Modify: `ui/src/components/Velocity.tsx`
- Modify: `ui/src/components/ActivityPage.tsx`
- Modify: `ui/src/components/TeamComparison.tsx`

- [ ] **Step 1: Add error state to Dashboard.tsx**

Modify: `ui/src/components/Dashboard.tsx`

```typescript
export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [dataError, setDataError] = useState<string | null>(null)
  const [teams, setTeams] = useState<Record<string, string>>({})
  const [teamsError, setTeamsError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getDashboard().catch(e => { setDataError(e.message); return null }),
      api.getTeams().catch(e => { setTeamsError(e.message); return null })
    ])
      .then(([dashRes, teamsRes]) => {
        if (dashRes) setData(dashRes.data)
        if (teamsRes) {
          const teamMap: Record<string, string> = {}
          teamsRes.data.forEach((t: Team) => { teamMap[t.id] = t.name })
          setTeams(teamMap)
        }
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading dashboard...</div>
  
  if (dataError && !data) {
    return (
      <div style={{ padding: '24px', color: 'red' }}>
        <h2>Error loading dashboard</h2>
        <p>{dataError}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  // Show warning banner if teams failed but data loaded
  const showTeamWarning = teamsError && data
```

- [ ] **Step 2: Add error state to Velocity.tsx**

Modify: `ui/src/components/Velocity.tsx`

```typescript
export function Velocity({ teamId }: { teamId: string }) {
  const [data, setData] = useState<VelocityData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getVelocity(teamId)
      .then(res => { setData(res.data); setLoading(false) })
      .catch(err => { 
        console.error(err); 
        setError(err.message || 'Failed to load velocity data');
        setLoading(false) 
      })
  }, [teamId])

  if (loading) return <div>Loading velocity...</div>
  if (error) return <div style={{ color: 'red', padding: '24px' }}>Error: {error}</div>
  if (!data) return <div>No velocity data available</div>
  // ... rest
}
```

- [ ] **Step 3: Similar error handling to ActivityPage.tsx and TeamComparison.tsx**

- [ ] **Step 4: Commit**

```bash
git add ui/src/components/Dashboard.tsx ui/src/components/Velocity.tsx ui/src/components/ActivityPage.tsx ui/src/components/TeamComparison.tsx
git commit -m "fix: add user-facing error states to all components"
```

---

## Task 4: Create Constants for Event Types

**Files:**
- Create: `ui/src/constants/events.ts`
- Create: `api/constants.py`
- Modify: `api/routes/velocity.py`
- Modify: `api/routes/overview.py`

- [ ] **Step 1: Create UI constants**

File: `ui/src/constants/events.ts`

```typescript
export const SOURCE_TYPES = {
  GIT: 'git',
  PM: 'pm',
  CICD: 'cicd',
  METRICS: 'metrics',
} as const

export const EVENT_TYPES = {
  // Git events
  PR_OPENED: 'pr_opened',
  PR_MERGED: 'pr_merged',
  PR_REVIEW_REQUEST: 'pr_review_request',
  COMMIT: 'commit',
  
  // PM events
  TASK_CREATED: 'task_created',
  TASK_COMPLETED: 'task_completed',
  TASK_BLOCKED: 'task_blocked',
  
  // CI/CD events
  PIPELINE_SUCCESS: 'pipeline_success',
  PIPELINE_FAILED: 'pipeline_failed',
} as const

export const SOURCE_LABELS: Record<string, string> = {
  git: 'Git',
  pm: 'Project Management',
  cicd: 'CI/CD',
  metrics: 'Metrics',
}

export type SourceType = typeof SOURCE_TYPES[keyof typeof SOURCE_TYPES]
export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES]
```

- [ ] **Step 2: Create Python constants**

File: `api/constants.py`

```python
from enum import Enum

class SourceType(str, Enum):
    GIT = 'git'
    PM = 'pm'
    CICD = 'cicd'
    METRICS = 'metrics'

class EventType(str, Enum):
    # Git
    PR_OPENED = 'pr_opened'
    PR_MERGED = 'pr_merged'
    PR_REVIEW_REQUEST = 'pr_review_request'
    COMMIT = 'commit'
    
    # PM
    TASK_CREATED = 'task_created'
    TASK_COMPLETED = 'task_completed'
    TASK_BLOCKED = 'task_blocked'
    
    # CI/CD
    PIPELINE_SUCCESS = 'pipeline_success'
    PIPELINE_FAILED = 'pipeline_failed'

VELOCITY_EVENTS = {EventType.TASK_CREATED, EventType.TASK_COMPLETED}
LEAD_TIME_EVENTS = {EventType.PR_MERGED}
```

- [ ] **Step 3: Update velocity.py to use constants**

```python
from constants import EventType, VELOCITY_EVENTS, LEAD_TIME_EVENTS

@router.get("/{team_id}/velocity")
def get_velocity(team_id: str):
    # ... use constants instead of hardcoded strings
    AND event_type IN ('task_created', 'task_completed')
    # becomes
    AND event_type IN ({", ".join(f"'{e}'" for e in VELOCITY_EVENTS)})
```

- [ ] **Step 4: Commit**

```bash
git add ui/src/constants/events.ts api/constants.py api/routes/velocity.py api/routes/overview.py
git commit -m "refactor: extract event type constants"
```

---

## Task 5: Add Memoization to Dashboard

**Files:**
- Modify: `ui/src/components/Dashboard.tsx`

- [ ] **Step 1: Add useMemo for chart data**

```typescript
import { useMemo } from 'react'

// Replace computed values with useMemo
const chartData = useMemo(() => {
  const grouped: Record<string, ActivityItem> = {}
  activity.forEach((r) => {
    if (!grouped[r.date]) grouped[r.date] = { date: r.date, source: '', event: '', count: 0 }
    grouped[r.date][r.source] = (grouped[r.date][r.source] || 0) + r.count
  })
  return Object.values(grouped)
}, [activity])

const hourlyData = useMemo(() => 
  hourly.map((h) => ({ hour: `${h.hour}:00`, count: h.count })), 
  [hourly]
)
```

- [ ] **Step 2: Commit**

```bash
git add ui/src/components/Dashboard.tsx
git commit -m "perf: add useMemo to Dashboard chart calculations"
```

---

## Task 6: Add Unit Tests for API Routes

**Files:**
- Create: `api/tests/test_velocity.py`
- Create: `api/tests/test_overview.py`

- [ ] **Step 1: Create test_velocity.py**

```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_velocity_endpoint_valid_uuid():
    response = client.get("/api/v1/teams/550e8400-e29b-41d4-a716-446655440000/velocity")
    assert response.status_code == 200
    data = response.json()
    assert "velocity" in data
    assert "cycle_time" in data
    assert "lead_time" in data

def test_velocity_endpoint_invalid_uuid():
    response = client.get("/api/v1/teams/not-a-uuid/velocity")
    assert response.status_code == 400

def test_velocity_returns_empty_for_unknown_team():
    response = client.get("/api/v1/teams/00000000-0000-0000-0000-000000000000/velocity")
    assert response.status_code == 200
    data = response.json()
    assert data["velocity"] == []
```

- [ ] **Step 2: Create test_overview.py**

```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_overview_endpoint():
    response = client.get("/api/v1/teams/550e8400-e29b-41d4-a716-446655440000/overview")
    assert response.status_code == 200
    data = response.json()
    assert "prs_awaiting_review" in data
    assert "blocked_tasks" in data
    assert "ci_failures_last_hour" in data

def test_activity_with_filters():
    response = client.get(
        "/api/v1/teams/550e8400-e29b-41d4-a716-446655440000/activity?from_date=2024-01-01&source=git"
    )
    assert response.status_code == 200

def test_activity_invalid_date():
    response = client.get(
        "/api/v1/teams/550e8400-e29b-41d4-a716-446655440000/activity?from_date=invalid"
    )
    assert response.status_code == 400
```

- [ ] **Step 3: Run tests**

```bash
cd /home/zubarev/sources/tl-tools && python3 -m pytest api/tests/ -v
```

- [ ] **Step 4: Commit**

```bash
git add api/tests/test_velocity.py api/tests/test_overview.py
git commit -m "test: add unit tests for velocity and overview endpoints"
```

---

## Summary

**Plan complete.** Issues addressed:

| Priority | Task | Fixes |
|----------|------|-------|
| Critical | Task 1-2 | Any types, duplicate API calls |
| Critical | Task 3 | Error states |
| Important | Task 4 | Magic strings, constants |
| Important | Task 5 | Performance (memoization) |
| Minor | Task 6 | API unit tests |

**Plan saved to:** `docs/superpowers/plans/2026-04-29-code-quality-fix-plan.md`

**Two execution options:**

1. **Subagent-Driven (recommended)** - dispatch fresh subagent per task
2. **Inline Execution** - execute in this session with checkpoints

Which approach?