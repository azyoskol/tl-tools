# Metraly UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full replacement of minimal React UI with production-quality glassmorphism dashboard with 11 screens, custom SVG charts, role-based dashboards, dashboard builder wizard, and Grafana-style metrics explorer.

**Architecture:** Frontend: TypeScript React with Vite (existing stack). Custom SVG charts ported from prototype. Inline styles matching prototype exactly. Backend: 5 new Go stub handlers wired into existing chi router. Return seeded JSON; no ClickHouse queries yet.

**Tech Stack:** React + Vite + TypeScript (frontend), Go + chi (backend), CSS custom properties for theming

---

## Phase 1: Design System & Utilities

### Task 1: Create Design System CSS

**Files:**
- Modify: `ui/src/index.css`

- [ ] **Step 1: Backup existing index.css**

```bash
cp ui/src/index.css ui/src/index.css.backup
```

- [ ] **Step 2: Write complete design system**

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --bg: #0B0F19;
  --glass: #131825;
  --glass2: #1a2235;
  --border: rgba(255,255,255,0.07);
  --cyan: #00E5FF;
  --purple: #B44CFF;
  --success: #00C853;
  --warning: #FF9100;
  --error: #FF1744;
  --text: #E8EDF5;
  --muted: #6B7A9A;
  --muted2: #9BAABF;
  --grad: linear-gradient(135deg, #00E5FF, #B44CFF);
  --font-head: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
}

h1, h2, h3, h4, h5, h6 { font-family: var(--font-head); font-weight: 600; }

code, pre { font-family: var(--font-mono); }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-up-1 { animation: fadeUp 0.5s ease-out 0.1s forwards; opacity: 0; }
.fade-up-2 { animation: fadeUp 0.5s ease-out 0.2s forwards; opacity: 0; }
.fade-up-3 { animation: fadeUp 0.5s ease-out 0.3s forwards; opacity: 0; }
.fade-up-4 { animation: fadeUp 0.5s ease-out 0.4s forwards; opacity: 0; }
.fade-up-5 { animation: fadeUp 0.5s ease-out 0.5s forwards; opacity: 0; }
.fade-up-6 { animation: fadeUp 0.5s ease-out 0.6s forwards; opacity: 0; }

@keyframes pulseDot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.pulse-dot { animation: pulseDot 2s ease-in-out infinite; }

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }

@keyframes barGrow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.bar-grow { transform-origin: left; animation: barGrow 0.6s ease-out forwards; }

@keyframes spinSlow {
  to { transform: rotate(360deg); }
}

.spin-slow { animation: spinSlow 3s linear infinite; }

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--glass2); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--muted); }
```

- [ ] **Step 3: Verify CSS compiles**

Run: `cd ui && npm run build 2>&1 | head -20`
Expected: Build completes without errors

- [ ] **Step 4: Commit**

```bash
git add ui/src/index.css ui/src/index.css.backup
git commit -m "feat: add design system CSS with glassmorphism theme"
```

---

### Task 2: Create Chart Utilities

**Files:**
- Create: `ui/src/components/charts/utils.ts`

- [ ] **Step 1: Create utils.ts with seeded random and chart helpers**

```typescript
export const seededRand = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

export const makeTimeSeries = (seed: number, points: number, base: number, variance: number): number[] => {
  const arr: number[] = [];
  let s = seed;
  for (let i = 0; i < points; i++) {
    arr.push(base + (seededRand(s++) - 0.5) * variance * 2);
  }
  return arr;
};

export const bezierPath = (points: number[], width: number, height: number, smooth = 0.2): string => {
  if (points.length < 2) return '';
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const scaled = points.map((v, i) => ({
    x: (i / (points.length - 1)) * width,
    y: height - ((v - min) / range) * height
  }));
  let d = `M ${scaled[0].x},${scaled[0].y}`;
  for (let i =1; i < scaled.length; i++) {
    const prev = scaled[i-1];
    const curr = scaled[i];
    const cp1x = prev.x + (curr.x - prev.x) * smooth;
    const cp1y = prev.y;
    const cp2x = curr.x - (curr.x - prev.x) * smooth;
    const cp2y = curr.y;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
  }
  return d;
};

export const scalePoints = (points: number[], width: number, height: number, minVal?: number, maxVal?: number) => {
  const min = minVal ?? Math.min(...points);
  const max = maxVal ?? Math.max(...points);
  const range = max - min || 1;
  return points.map((v, i) => ({
    x: (i / (points.length - 1 || 1)) * width,
    y: height - ((v - min) / range) * height
  }));
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd ui && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to utils.ts

- [ ] **Step 3: Commit**

```bash
git add ui/src/components/charts/utils.ts
git commit -m "feat: add chart utilities (seededRand, makeTimeSeries, bezierPath, scalePoints)"
```

---

## Phase 2: Chart Components

### Task 3: MiniSparkline Component

**Files:**
- Create: `ui/src/components/charts/MiniSparkline.tsx`

- [ ] **Step 1: Create MiniSparkline.tsx**

```tsx
import React from 'react';
import { bezierPath, scalePoints } from './utils';

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data,
  width = 120,
  height = 24,
  color = '#00E5FF',
  fill = false
}) => {
  if (data.length < 2) return null;
  const points = scalePoints(data, width, height);
  const path = bezierPath(data, width, height);
  const areaPath = path + ` L ${width},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {fill && <path d={areaPath} fill={color} fillOpacity="0.15" />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};
```

- [ ] **Step 2: Verify compiles**

Run: `cd ui && npx tsc --noEmit 2>&1 | grep -i sparkline`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add ui/src/components/charts/MiniSparkline.tsx
git commit -m "feat: add MiniSparkline SVG chart component"
```

---

### Task 4: AreaChart Component

**Files:**
- Create: `ui/src/components/charts/AreaChart.tsx`

- [ ] **Step 1: Create AreaChart.tsx with compare mode**

```tsx
import React from 'react';
import { bezierPath, scalePoints, makeTimeSeries } from './utils';

interface AreaChartProps {
  data: number[];
  compare?: number[];
  width?: number;
  height?: number;
  color?: string;
  compareColor?: string;
  showGrid?: boolean;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  compare,
  width = 400,
  height = 200,
  color = '#00E5FF',
  compareColor = '#B44CFF',
  showGrid = true
}) => {
  if (data.length < 2) return null;

  const path = bezierPath(data, width, height);
  const areaPath = path + ` L ${width},${height} L 0,${height} Z`;
  const comparePath = compare ? bezierPath(compare, width, height) : '';
  const compareAreaPath = compare ? comparePath + ` L ${width},${height} L 0,${height} Z` : '';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {showGrid && (
        <g stroke="rgba(255,255,255,0.05)" strokeWidth="1">
          {[0,0.25,0.5,0.75,1].map((p, i) => (
            <line key={i} x1="0" y1={p * height} x2={width} y2={p * height} />
          ))}
        </g>
      )}
      {compare && <path d={compareAreaPath} fill={compareColor} fillOpacity="0.1" />}
      {compare && <path d={comparePath} fill="none" stroke={compareColor} strokeWidth="2" strokeDasharray="4,4" />}
      <path d={areaPath} fill={color} fillOpacity="0.2" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};
```

- [ ] **Step 2: Verify compiles**

Run: `cd ui && npx tsc --noEmit 2>&1 | grep -i AreaChart`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add ui/src/components/charts/AreaChart.tsx
git commit -m "feat: add AreaChart with compare mode support"
```

---

### Task 5: BarChart Component

**Files:**
- Create: `ui/src/components/charts/BarChart.tsx`

- [ ] **Step 1: Create BarChart.tsx (vertical + horizontal)**

```tsx
import React from 'react';

interface BarChartProps {
  data: { label: string; value: number }[];
  horizontal?: boolean;
  width?: number;
  height?: number;
  color?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  horizontal = false,
  width = 400,
  height = 200,
  color = '#00E5FF'
}) => {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value));
  const padding = 4;
  const chartW = horizontal ? height : width;
  const chartH = horizontal ? width : height;
  const barSize = (chartW / data.length) - padding;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((d, i) => {
        const barLen = (d.value / max) * chartH;
        if (horizontal) {
          const y = i * (barSize + padding);
          return (
            <g key={i}>
              <rect x="0" y={y} width={barLen} height={barSize} fill={color} rx="2" />
              <text x={barLen + 8} y={y + barSize/2} fill="#E8EDF5" fontSize="11" dominantBaseline="middle">{d.label}</text>
            </g>
          );
        }
        const x = i * (barSize + padding);
        const y = chartH - barLen;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barSize} height={barLen} fill={color} rx="2" />
            <text x={x + barSize/2} y={y - 6} fill="#6B7A9A" fontSize="10" textAnchor="middle">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};
```

- [ ] **Step 2: Verify compiles**

Run: `cd ui && npx tsc --noEmit 2>&1 | grep -i BarChart`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add ui/src/components/charts/BarChart.tsx
git commit -m "feat: add BarChart (vertical + horizontal modes)"
```

---

### Task 6: Heatmap Component

**Files:**
- Create: `ui/src/components/charts/Heatmap.tsx`

- [ ] **Step 1: Create Heatmap.tsx**

```tsx
import React from 'react';

interface HeatmapProps {
  data: number[][];
  width?: number;
  height?: number;
  colorScale?: string[];
}

export const Heatmap: React.FC<HeatmapProps> = ({
  data,
  width = 300,
  height = 100,
  colorScale = ['#131825', '#00E5FF']
}) => {
  const rows = data.length;
  const cols = data[0]?.length || 0;
  const cellW = width / cols;
  const cellH = height / rows;
  const max = Math.max(...data.flat());
  const min = Math.min(...data.flat());

  const getColor = (val: number) => {
    const t = max === min ? 0.5 : (val - min) / (max - min);
    const r = Math.round(parseInt(colorScale[0].slice(1,3), 16) * (1-t) + parseInt(colorScale[1].slice(1,3), 16) * t);
    const g = Math.round(parseInt(colorScale[0].slice(3,5), 16) * (1-t) + parseInt(colorScale[1].slice(3,5), 16) * t);
    const b = Math.round(parseInt(colorScale[0].slice(5,7), 16) * (1-t) + parseInt(colorScale[1].slice(5,7), 16) * t);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((row, ri) =>
        row.map((val, ci) => (
          <rect
            key={`${ri}-${ci}`}
            x={ci * cellW}
            y={ri * cellH}
            width={cellW - 1}
            height={cellH - 1}
            fill={getColor(val)}
            rx="2"
          />
        ))
      )}
    </svg>
  );
};
```

- [ ] **Step 2: Verify compiles**

Run: `cd ui && npx tsc --noEmit 2>&1 | grep -i Heatmap`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add ui/src/components/charts/Heatmap.tsx
git commit -m "feat: add Heatmap chart component"
```

---

### Task 7: Gauge Component

**Files:**
- Create: `ui/src/components/charts/Gauge.tsx`

- [ ] **Step 1: Create Gauge.tsx (semicircle)**

```tsx
import React from 'react';

interface GaugeProps {
  value: number;
  max?: number;
  width?: number;
  height?: number;
  color?: string;
  label?: string;
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  max = 100,
  width = 120,
  height = 70,
  color = '#00E5FF',
  label
}) => {
  const radius = width / 2 - 10;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const valueAngle = startAngle + (value / max) * (endAngle - startAngle);
  const arc = (a: number) => `${width/2 + radius * Math.cos(a)},${height + radius * Math.sin(a) - height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={`M ${arc(startAngle)} A ${radius} ${radius} 0 0 1 ${arc(endAngle)}`}
        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeLinecap="round" />
      <path d={`M ${arc(startAngle)} A ${radius} ${radius} 0 0 1 ${arc(valueAngle)}`}
        fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <text x={width/2} y={height - 10} textAnchor="middle" fill="#E8EDF5" fontSize="18" fontWeight="600">
        {Math.round(value)}%
      </text>
      {label && <text x={width/2} y={height - 28} textAnchor="middle" fill="#6B7A9A" fontSize="10">{label}</text>}
    </svg>
  );
};
```

- [ ] **Step 2: Verify compiles**

Run: `cd ui && npx tsc --noEmit 2>&1 | grep -i Gauge`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add ui/src/components/charts/Gauge.tsx
git commit -m "feat: add semicircle Gauge component"
```

---

### Task 8: Leaderboard & DataTable Components

**Files:**
- Create: `ui/src/components/charts/Leaderboard.tsx`
- Create: `ui/src/components/charts/DataTable.tsx`

- [ ] **Step 1: Create Leaderboard.tsx**

```tsx
import React from 'react';

interface LeaderboardProps {
  data: { rank: number; name: string; value: string; trend?: string }[];
  color?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ data, color = '#00E5FF' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {data.map((d) => (
        <div key={d.rank} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            width: '24px', height: '24px', borderRadius: '50%',
            background: d.rank <= 3 ? color : 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 600
          }}>{d.rank}</span>
          <span style={{ flex: 1, color: '#E8EDF5' }}>{d.name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: '#6B7A9A' }}>{d.value}</span>
          {d.trend && <span style={{ color: '#00C853', fontSize: '12px' }}>{d.trend}</span>}
        </div>
      ))}
    </div>
  );
};
```

- [ ] **Step 2: Create DataTable.tsx**

```tsx
import React from 'react';

interface Column<T> { key: keyof T; header: string; render?: (v: T[keyof T], row: T) => React.ReactNode }
interface DataTableProps<T> { columns: Column<T>[]; data: T[] }

export function DataTable<T extends Record<string, any>>({ columns, data }: DataTableProps<T>) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {columns.map(col => (
            <th key={String(col.key)} style={{
              textAlign: 'left', padding: '12px 8px', color: '#6B7A9A',
              fontWeight: 500, fontSize: '12px', textTransform: 'uppercase'
            }}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            {columns.map(col => (
              <td key={String(col.key)} style={{ padding: '12px 8px', color: '#E8EDF5' }}>
                {col.render ? col.render(row[col.key], row) : String(row[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 3: Verify compiles**

Run: `cd ui && npx tsc --noEmit 2>&1 | grep -E "(Leaderboard|DataTable)"`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add ui/src/components/charts/Leaderboard.tsx ui/src/components/charts/DataTable.tsx
git commit -m "feat: add Leaderboard and DataTable components"
```

---

## Phase 3: UI Components

### Task 9: Icon & Widget Components

**Files:**
- Create: `ui/src/components/ui/Icon.tsx`
- Create: `ui/src/components/ui/Widget.tsx`
- Create: `ui/src/components/ui/Badge.tsx`

- [ ] **Step 1: Create Icon.tsx (inline SVG icons)**

```tsx
import React from 'react';

type IconName = 'activity' | 'alertCircle' | 'barChart2' | 'bell' | 'checkCircle' | 'chevronDown' | 'clock' | 'code' | 'database' | 'gitCommit' | 'github' | 'home' | 'layers' | 'layout' | 'list' | 'lock' | 'menu' | 'messageSquare' | 'monitor' | 'package' | 'search' | 'settings' | 'star' | 'trendingUp' | 'trendingDown' | 'users' | 'zap' | 'plus' | 'x' | 'filter';

const icons: Record<IconName, string> = {
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  alertCircle: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 14a1 1 0 110-2 1 1 0 010 2zm0-4a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1z',
  barChart2: 'M18 20V10M12 20V4M6 20v-6',
  bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  checkCircle: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
  chevronDown: 'M6 9l6 6 6-6',
  clock: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 4v4l3 3',
  code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  database: 'M3 3h18v18H3zM3 9h18M9 3v18',
  gitCommit: 'M3 12h18M3 6h18M3 18h18',
  github: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22',
  home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
  layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  layout: 'M3 3h18v18H3zM3 9h18M9 3v18',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM12 11V7a4 4 0 10-8 0v4',
  menu: 'M3 12h18M3 6h18M3 18h18',
  messageSquare: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
  monitor: 'M22 12h-4l-3 9L9 3l-3 9H2',
  package: 'M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
  settings: 'M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  trendingUp: 'M23 6l-9.5 9.5-5-5L1 18',
  trendingDown: 'M23 18l-9.5-9.5-5 5L1 6',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  plus: 'M12 5v14M5 12h14',
  x: 'M18 6L6 18M6 6l12 12',
  filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z'
};

interface IconProps { name: IconName; size?: number; className?: string }

export const Icon: React.FC<IconProps> = ({ name, size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={icons[name]} />
  </svg>
);
```

- [ ] **Step 2: Create Widget.tsx (glass container)**

```tsx
import React from 'react';

interface WidgetProps { children: React.ReactNode; className?: string }

export const Widget: React.FC<WidgetProps> = ({ children, className }) => (
  <div style={{
    background: 'var(--glass)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '20px'
  }} className={className}>
    {children}
  </div>
);
```

- [ ] **Step 3: Create Badge.tsx (status badges)**

```tsx
import React from 'react';

type BadgeType = 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps { type: BadgeType; children: React.ReactNode }

const colors: Record<BadgeType, string> = {
  success: '#00C853', warning: '#FF9100', error: '#FF1744', neutral: '#6B7A9A'
};

export const Badge: React.FC<BadgeProps> = ({ type, children }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
    background: `${colors[type]}20`, color: colors[type]
  }}>
    {type === 'success' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors[type] }} />}
    {children}
  </span>
);
```

- [ ] **Step 4: Verify compiles**

Run: `cd ui && npx tsc --noEmit 2>&1 | grep -E "(Icon|Widget|Badge)"`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add ui/src/components/ui/Icon.tsx ui/src/components/ui/Widget.tsx ui/src/components/ui/Badge.tsx
git commit -m "feat: add Icon, Widget, Badge UI components"
```

---

### Task 10: Card Components

**Files:**
- Create: `ui/src/components/ui/MetricCard.tsx`
- Create: `ui/src/components/ui/StatCard.tsx`
- Create: `ui/src/components/ui/SectionHeader.tsx`

- [ ] **Step 1: Create MetricCard.tsx**

```tsx
import React from 'react';
import { MiniSparkline } from '../charts/MiniSparkline';

interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down';
  sparkline?: number[];
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, delta, trend, sparkline }) => (
  <div style={{
    background: 'var(--glass)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px'
  }}>
    <span style={{ color: 'var(--muted)', fontSize: '14px' }}>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-head)' }}>{value}</span>
      {sparkline && <MiniSparkline data={sparkline} width={80} height={32} color={trend === 'up' ? '#00C853' : '#FF1744'} />}
    </div>
    {delta && (
      <span style={{ color: trend === 'up' ? '#00C853' : '#FF1744', fontSize: '13px', fontWeight: 500 }}>
        {trend === 'up' ? '↑' : '↓'} {delta}
      </span>
    )}
  </div>
);
```

- [ ] **Step 2: Create StatCard.tsx (compact)**

```tsx
import React from 'react';

interface StatCardProps { icon?: React.ReactNode; label: string; value: string; trend?: string; trendDir?: 'up' | 'down' }

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, trend, trendDir }) => (
  <div style={{
    background: 'var(--glass)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px'
  }}>
    {icon && <div style={{ color: 'var(--cyan)' }}>{icon}</div>}
    <div style={{ flex: 1 }}>
      <div style={{ color: 'var(--muted)', fontSize: '12px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 600 }}>{value}</div>
    </div>
    {trend && (
      <div style={{ color: trendDir === 'up' ? '#00C853' : '#FF1744', fontSize: '12px' }}>
        {trendDir === 'up' ? '↑' : '↓'} {trend}
      </div>
    )}
  </div>
);
```

- [ ] **Step 3: Create SectionHeader.tsx**

```tsx
import React from 'react';

interface SectionHeaderProps { title: string; action?: React.ReactNode }

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action }) => (
  <div style={{ marginBottom: '20px' }}>
    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{title}</h3>
    <div style={{ height: '1px', background: 'var(--border)' }} />
  </div>
);
```

- [ ] **Step 4: Verify compiles**

Run: `cd ui && npx tsc --noEmit 2>&1 | grep -E "(MetricCard|StatCard|SectionHeader)"`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add ui/src/components/ui/MetricCard.tsx ui/src/components/ui/StatCard.tsx ui/src/components/ui/SectionHeader.tsx
git commit -m "feat: add MetricCard, StatCard, SectionHeader components"
```

---

### Task 11: AI & Filter Components

**Files:**
- Create: `ui/src/components/ui/AIInsightCard.tsx`
- Create: `ui/src/components/ui/InlineInsight.tsx`
- Create: `ui/src/components/ui/FilterPill.tsx`

- [ ] **Step 1: Create AIInsightCard.tsx (gradient border)**

```tsx
import React from 'react';

interface AIInsightCardProps { title: string; body: string; action?: string }

export const AIInsightCard: React.FC<AIInsightCardProps> = ({ title, body, action }) => (
  <div style={{
    background: 'var(--glass)', borderRadius: '12px', padding: '1px',
    backgroundImage: 'linear-gradient(135deg, var(--cyan), var(--purple))',
    backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box'
  }}>
    <div style={{ background: 'var(--glass)', borderRadius: '12px', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--purple)' }} />
        <span style={{ fontSize: '12px', fontWeight: 600, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI INSIGHT</span>
      </div>
      <h4 style={{ fontSize: '16px', marginBottom: '8px' }}>{title}</h4>
      <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: action ? '12px' : 0 }}>{body}</p>
      {action && <button style={{ background: 'var(--grad)', border: 'none', borderRadius: '6px', padding: '8px 16px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>{action}</button>}
    </div>
  </div>
);
```

- [ ] **Step 2: Create InlineInsight.tsx**

```tsx
import React from 'react';

interface InlineInsightProps { text: string }

export const InlineInsight: React.FC<InlineInsightProps> = ({ text }) => (
  <div style={{
    background: 'linear-gradient(90deg, rgba(180,76,255,0.1), rgba(0,229,255,0.1))',
    borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px'
  }}>
    <span style={{ width: 4, height: '100%', minHeight: 24, borderRadius: 2, background: 'var(--grad)' }} />
    <span style={{ color: 'var(--text)', fontSize: '14px' }}>{text}</span>
  </div>
);
```

- [ ] **Step 3: Create FilterPill.tsx**

```tsx
import React, { useState, useRef, useEffect } from 'react';

interface FilterPillProps { label: string; options: string[]; value: string; onChange: (v: string) => void }

export const FilterPill: React.FC<FilterPillProps> = ({ label, options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) return; const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener('click', onClick); return () => document.removeEventListener('click', onClick); }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        background: value !== 'All' ? 'var(--cyan)20' : 'var(--glass)',
        border: '1px solid var(--border)', borderRadius: '20px', padding: '6px 14px',
        color: 'var(--text)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
      }}>
        {label}: {value}
        <span style={{ fontSize: '10px' }}>▼</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'var(--glass2)', border: '1px solid var(--border)', borderRadius: 8, padding: 4, minWidth: 120, zIndex: 10 }}>
          {options.map(o => (
            <div key={o} onClick={() => { onChange(o); setOpen(false); }} style={{ padding: '8px 12px', borderRadius: 4, cursor: 'pointer', fontSize: '13px' }}>{o}</div>
          ))}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Verify compiles**

Run: `cd ui && npx tsc --noEmit 2>&1 | grep -E "(AIInsightCard|InlineInsight|FilterPill)"`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add ui/src/components/ui/AIInsightCard.tsx ui/src/components/ui/InlineInsight.tsx ui/src/components/ui/FilterPill.tsx
git commit -m "feat: add AIInsightCard, InlineInsight, FilterPill components"
```

---

### Task 12: Navigation Components

**Files:**
- Create: `ui/src/components/ui/Sidebar.tsx`
- Create: `ui/src/components/ui/Topbar.tsx`

- [ ] **Step 1: Create Sidebar.tsx**

```tsx
import React from 'react';

const navItems = [
  { id: 'dashboard', label: 'Overview', icon: 'home' },
  { id: 'cto', label: 'CTO Dashboard', icon: 'activity' },
  { id: 'vp', label: 'VP Dashboard', icon: 'trendingUp' },
  { id: 'tl', label: 'Team Lead', icon: 'users' },
  { id: 'devops', label: 'DevOps', icon: 'server' },
  { id: 'ic', label: 'Individual', icon: 'code' },
  { id: 'metrics', label: 'Metrics Explorer', icon: 'barChart2' },
  { id: 'wizard', label: 'Dashboard Builder', icon: 'layout' },
  { id: 'ai', label: 'AI Assistant', icon: 'messageSquare' },
  { id: 'plugins', label: 'Plugins', icon: 'package' },
  { id: 'sources', label: 'Connect Sources', icon: 'database' },
];

interface SidebarProps { active: string; onNavigate: (id: string) => void }

export const Sidebar: React.FC<SidebarProps> = ({ active, onNavigate }) => (
  <nav style={{ width: 240, height: '100vh', background: 'var(--glass)', borderRight: '1px solid var(--border)', padding: '20px 12px', display: 'flex', flexDirection: 'column' }}>
    <div style={{ padding: '0 12px 24px', fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-head)', background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Metraly</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {navItems.map(item => (
        <button key={item.id} onClick={() => onNavigate(item.id)} style={{
          background: active === item.id ? 'rgba(0,229,255,0.1)' : 'transparent',
          border: 'none', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
          color: active === item.id ? 'var(--cyan)' : 'var(--muted)', fontSize: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
        }}>
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  </nav>
);
```

- [ ] **Step 2: Create Topbar.tsx**

```tsx
import React, { useState } from 'react';

interface TopbarProps { onSearch?: (q: string) => void }

export const Topbar: React.FC<TopbarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  return (
    <header style={{ height: 60, background: 'var(--glass)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', borderRadius: 8, padding: '8px 16px', width: 400 }}>
        <span style={{ color: 'var(--muted)' }}>🔍</span>
        <input value={query} onChange={e => { setQuery(e.target.value); onSearch?.(e.target.value); }} placeholder="Search metrics, teams..." style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '14px', width: '100%', outline: 'none' }} />
      </div>
      <button style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', position: 'relative' }}>
        <span style={{ fontSize: 20 }}>🔔</span>
        <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'var(--error)', borderRadius: '50%' }} />
      </button>
    </header>
  );
};
```

- [ ] **Step 3: Verify compiles**

Run: `cd ui && npx tsc --noEmit 2>&1 | grep -E "(Sidebar|Topbar)"`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add ui/src/components/ui/Sidebar.tsx ui/src/components/ui/Topbar.tsx
git commit -m "feat: add Sidebar and Topbar navigation components"
```

---

## Phase 4: Backend API Stubs

### Task 13: Go API Stub Handlers

**Files:**
- Create: `cmd/api/handlers/dora.go`
- Create: `cmd/api/handlers/metrics.go`
- Create: `cmd/api/handlers/role.go`
- Create: `cmd/api/handlers/insights.go`
- Create: `cmd/api/handlers/dashboards.go`
- Modify: `cmd/api/main.go`

- [ ] **Step 1: Create dora.go handler**

```go
package handlers

import (
	"encoding/json"
	"math/rand"
	"net/http"
)

func seededRand(seed int) float64 {
	rand.Seed(int64(seed))
	return rand.Float64()
}

func makeSeries(seed int, points int, base, variance float64) []float64 {
	res := make([]float64, points)
	s := seed
	for i := 0; i < points; i++ {
		res[i] = base + (seededRand(s) - 0.5) * variance * 2
		s++
	}
	return res
}

type DORAMetrics struct {
	ID       string   `json:"id"`
	Label    string   `json:"label"`
	Value    string   `json:"value"`
	Delta    string   `json:"delta"`
	Good     bool     `json:"good"`
	Level    string   `json:"level"`
	Color    string   `json:"color"`
	Series   []float64 `json:"series"`
}

type DORAResponse struct {
	Metrics []DORAMetrics `json:"metrics"`
}

func DORAHandler(w http.ResponseWriter, r *http.Request) {
	metrics := []DORAMetrics{
		{ID: "deploy-freq", Label: "Deployment Frequency", Value: "4.2/day", Delta: "+0.8", Good: true, Level: "Elite", Color: "#00E5FF", Series: makeSeries(1, 30, 4, 1)},
		{ID: "lead-time", Label: "Lead Time for Changes", Value: "2.1 hrs", Delta: "-0.3", Good: true, Level: "High", Color: "#00E5FF", Series: makeSeries(2, 30, 2.5, 0.8)},
		{ID: "mttr", Label: "Mean Time to Recovery", Value: "12 min", Delta: "-5 min", Good: true, Level: "Elite", Color: "#00E5FF", Series: makeSeries(3, 30, 15, 5)},
		{ID: "change-fail", Label: "Change Failure Rate", Value: "4%", Delta: "-2%", Good: true, Level: "Elite", Color: "#00C853", Series: makeSeries(4, 30, 5, 2)},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(DORAResponse{Metrics: metrics})
}
```

- [ ] **Step 2: Create metrics.go handler**

```go
package handlers

import (
	"encoding/json"
	"net/http"
)

type MetricResponse struct {
	ID       string   `json:"id"`
	Label    string   `json:"label"`
	Unit     string   `json:"unit"`
	Color    string   `json:"color"`
	Current  float64  `json:"current"`
	Delta    float64  `json:"delta"`
	Series   []float64 `json:"series"`
	Compare  []float64 `json:"compare"`
}

func MetricsHandler(w http.ResponseWriter, r *http.Request) {
	metric := r.URL.Query().Get("metric")
	rangeVal := r.URL.Query().Get("range")
	_ = rangeVal // stub
	
	points := 30
	if metric == "" {
		metric = "deploy-freq"
	}
	
	resp := MetricResponse{
		ID:      metric,
		Label:   "Deployment Frequency",
		Unit:    "deploys/day",
		Color:   "#00E5FF",
		Current: 4.2,
		Delta:   0.8,
		Series:  makeSeries(100, points, 4, 1),
		Compare: makeSeries(200, points, 3.8, 1),
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
```

- [ ] **Step 3: Create role.go handler**

```go
package handlers

import (
	"encoding/json"
	"net/http"
)

type RoleStats struct {
	Icon      string    `json:"icon"`
	Label     string    `json:"label"`
	Value     string    `json:"value"`
	Trend     string    `json:"trend"`
	TrendDir  string    `json:"trendDir"`
	Color     string    `json:"color"`
	Spark     []float64 `json:"spark"`
}

type RoleResponse struct {
	Role   string                 `json:"role"`
	Stats  []RoleStats            `json:"stats"`
	Payload map[string]interface{} `json:"payload"`
}

func RoleHandler(w http.ResponseWriter, r *http.Request) {
	role := r.URL.Query().Get("role")
	if role == "" {
		role = "cto"
	}
	
	var resp RoleResponse
	switch role {
	case "cto":
		resp = RoleResponse{
			Role: "cto",
			Stats: []RoleStats{
				{Icon: "trendingUp", Label: "Engineering Health", Value: "84", Trend: "+3 pts", TrendDir: "up", Color: "cyan", Spark: makeSeries(1, 10, 80, 5)},
			},
			Payload: map[string]interface{}{
				"deployTrend": makeSeries(1, 14, 4, 1),
				"velocityByTeam": []map[string]string{{"team": "Platform", "velocity": "42"}, {"team": "Frontend", "velocity": "38"}},
				"leadTimeTrend": makeSeries(2, 14, 2, 0.5),
				"healthScore": 84,
			},
		}
	case "vp":
		resp = RoleResponse{
			Role: "vp",
			Stats: []RoleStats{
				{Icon: "trendingUp", Label: "Sprint Velocity", Value: "42 pts", Trend: "+5%", TrendDir: "up", Color: "cyan", Spark: makeSeries(3, 10, 40, 5)},
			},
			Payload: map[string]interface{}{
				"sprintVelocity": 42,
				"prCycleTime": makeSeries(4, 14, 4, 2),
				"heatmap": [][]int{{2,4,3,5,2,3,4}, {3,5,4,6,3,4,5}, {1,3,2,4,2,3,4}},
				"deliveryRisk": "low",
			},
		}
	case "tl":
		resp = RoleResponse{
			Role: "tl",
			Stats: []RoleStats{
				{Icon: "checkCircle", Label: "CI Pass Rate", Value: "94%", Trend: "+2%", TrendDir: "up", Color: "success", Spark: makeSeries(5, 10, 92, 3)},
			},
			Payload: map[string]interface{}{
				"ciPassRate": 94,
				"prQueue": 5,
				"burndown": makeSeries(6, 14, 50, 10),
				"failingBuilds": 2,
			},
		}
	case "devops":
		resp = RoleResponse{
			Role: "devops",
			Stats: []RoleStats{
				{Icon: "zap", Label: "Deploy Frequency", Value: "4.2/day", Trend: "+0.8", TrendDir: "up", Color: "cyan", Spark: makeSeries(7, 10, 4, 1)},
			},
			Payload: map[string]interface{}{
				"deployFreq": 4.2,
				"mttrTrend": makeSeries(8, 14, 12, 5),
				"deployHeatData": [][]int{{1,2,3,4,5,4,3}, {2,3,5,6,5,4,3}},
				"incidents": 2,
			},
		}
	default: // ic
		resp = RoleResponse{
			Role: "ic",
			Stats: []RoleStats{
				{Icon: "code", Label: "My PRs", Value: "8", Trend: "+2", TrendDir: "up", Color: "purple", Spark: makeSeries(9, 10, 6, 3)},
			},
			Payload: map[string]interface{}{
				"myPRs": 8,
				"ciRuns": 24,
				"reviewQueue": 3,
				"sprintProgress": 65,
			},
		}
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
```

- [ ] **Step 4: Create insights.go handler**

```go
package handlers

import (
	"encoding/json"
	"net/http"
)

type Insight struct {
	Title  string `json:"title"`
	Body   string `json:"body"`
	Action string `json:"action"`
}

type InsightsResponse struct {
	Insights  []Insight `json:"insights"`
	UpdatedAt string    `json:"updatedAt"`
}

func InsightsHandler(w http.ResponseWriter, r *http.Request) {
	resp := InsightsResponse{
		Insights: []Insight{
			{Title: "CI slowdown detected", Body: "Pipeline times increased 15% over the last week", Action: "View affected jobs"},
			{Title: "High PR review queue", Body: "5 PRs have been waiting > 24 hours for review", Action: "Review queue"},
			{Title: "Deploy frequency up", Body: "Team velocity increased 20% this sprint", Action: "View trends"},
		},
		UpdatedAt: "2026-05-01T12:00:00Z",
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
```

- [ ] **Step 5: Create dashboards.go handler**

```go
package handlers

import (
	"encoding/json"
	"net/http"
	"sync"
)

type WidgetConfig struct {
	Size     string `json:"widgetSizes,omitempty"`
}

type Dashboard struct {
	ID          string                 `json:"id,omitempty"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Widgets     []string               `json:"widgets"`
	WidgetSizes map[string]string      `json:"widgetSizes"`
	TimeRange   string                 `json:"timeRange"`
	Team        string                 `json:"team"`
}

var (
	dashboards = []Dashboard{
		{ID: "1", Name: "CTO Overview", Description: "Executive summary", Widgets: []string{"dora-overview", "health-score"}, WidgetSizes: map[string]string{"dora-overview": "lg"}, TimeRange: "30d", Team: "All teams"},
		{ID: "2", Name: "Sprint Dashboard", Description: "Current sprint metrics", Widgets: []string{"velocity", "burndown"}, WidgetSizes: map[string]string{}, TimeRange: "14d", Team: "All teams"},
	}
	dashboardsMu sync.Mutex
)

func GetDashboardsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dashboards)
}

func PostDashboardHandler(w http.ResponseWriter, r *http.Request) {
	var dash Dashboard
	if err := json.NewDecoder(r.Body).Decode(&dash); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	dashboardsMu.Lock()
	dash.ID = string(rune(len(dashboards) + 1))
	dashboards = append(dashboards, dash)
	dashboardsMu.Unlock()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dash)
}
```

- [ ] **Step 6: Modify main.go to wire handlers**

```go
package main

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/metraly/cmd/api/handlers"
)

func main() {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Existing endpoints
	r.Get("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"status":"ok"}`))
	})

	// New stub endpoints
	r.Get("/api/v1/dora", handlers.DORAHandler)
	r.Get("/api/v1/metrics", handlers.MetricsHandler)
	r.Get("/api/v1/role/{role}", handlers.RoleHandler)
	r.Get("/api/v1/insights", handlers.InsightsHandler)
	r.Get("/api/v1/dashboards", handlers.GetDashboardsHandler)
	r.Post("/api/v1/dashboards", handlers.PostDashboardHandler)

	http.ListenAndServe(":8080", r)
}
```

- [ ] **Step 7: Verify Go compiles**

Run: `go build ./cmd/api/... 2>&1`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add cmd/api/handlers/ cmd/api/main.go
git commit -m "feat: add 5 new Go stub handlers (dora, metrics, role, insights, dashboards)"
```

---

## Phase 5: API Client

### Task 14: API Client TypeScript

**Files:**
- Create: `ui/src/api/metrics.ts`

- [ ] **Step 1: Create metrics.ts**

```typescript
import axios from './client';

export const getDORA = () => axios.get('/api/v1/dora').then(r => r.data);
export const getMetrics = (metric: string, range = '30d', team = '', repo = '') =>
  axios.get('/api/v1/metrics', { params: { metric, range, team, repo } }).then(r => r.data);
export const getRole = (role: string) => axios.get(`/api/v1/role/${role}`).then(r => r.data);
export const getInsights = () => axios.get('/api/v1/insights').then(r => r.data);
export const getDashboards = () => axios.get('/api/v1/dashboards').then(r => r.data);
export const createDashboard = (data: any) => axios.post('/api/v1/dashboards', data).then(r => r.data);
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd ui && npx tsc --noEmit 2>&1 | grep -i metrics`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add ui/src/api/metrics.ts
git commit -m "feat: add typed API client functions for new endpoints"
```

---

## Phase 6: Screens

### Task 15: Dashboard Screen

**Files:**
- Create: `ui/src/screens/DashboardScreen.tsx`

- [ ] **Step 1: Create DashboardScreen.tsx**

```tsx
import React, { useEffect, useState } from 'react';
import { getInsights } from '../api/metrics';
import { MetricCard } from '../components/ui/MetricCard';
import { AIInsightCard } from '../components/ui/AIInsightCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Widget } from '../components/ui/Widget';
import { makeTimeSeries } from '../components/charts/utils';

interface Insight { title: string; body: string; action?: string }

export const DashboardScreen: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    getInsights().then((r: any) => setInsights(r.insights)).catch(() => {});
  }, []);

  const cards = [
    { label: 'Deploy Frequency', value: '4.2/day', delta: '+0.8', trend: 'up' as const, sparkline: makeTimeSeries(1, 10, 4, 1) },
    { label: 'Lead Time', value: '2.1 hrs', delta: '-0.3', trend: 'up' as const, sparkline: makeTimeSeries(2, 10, 2.5, 0.5) },
    { label: 'MTTR', value: '12 min', delta: '-5 min', trend: 'up' as const, sparkline: makeTimeSeries(3, 10, 15, 3) },
    { label: 'Change Failure', value: '4%', delta: '-2%', trend: 'up' as const, sparkline: makeTimeSeries(4, 10, 5, 1) },
  ];

  return (
    <div className="fade-up-1" style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Engineering Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {cards.map((c, i) => <MetricCard key={i} {...c} />)}
      </div>

      <SectionHeader title="AI Insights" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}>
        {insights.slice(0, 2).map((ins, i) => (
          <AIInsightCard key={i} title={ins.title} body={ins.body} action={ins.action} />
        ))}
      </div>

      <Widget>
        <SectionHeader title="Recent Activity" />
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>
          <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>Platform team deployed v2.4.0 to production</div>
          <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>Frontend team merged 3 PRs</div>
          <div style={{ padding: '12px 0' }}>DevOps resolved incident in #incidents channel</div>
        </div>
      </Widget>
    </div>
  );
};
```

- [ ] **Step 2: Verify compiles**

Run: `cd ui && npx tsc --noEmit 2>&1 | grep -i DashboardScreen`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add ui/src/screens/DashboardScreen.tsx
git commit -m "feat: add DashboardScreen with metric cards and AI insights"
```

---

### Task 16: Role Dashboards (CTO, VP, TL, DevOps, IC)

**Files:**
- Create: `ui/src/screens/CTODashboard.tsx`
- Create: `ui/src/screens/VPDashboard.tsx`
- Create: `ui/src/screens/TLDashboard.tsx`
- Create: `ui/src/screens/DevOpsDashboard.tsx`
- Create: `ui/src/screens/ICDashboard.tsx`
- Create: `ui/src/screens/RoleDashboardScreen.tsx` (tab wrapper)

- [ ] **Step 1: Create CTODashboard.tsx**

```tsx
import React, { useEffect, useState } from 'react';
import { getRole } from '../api/metrics';
import { StatCard } from '../components/ui/StatCard';
import { Gauge } from '../components/charts/Gauge';
import { AreaChart } from '../components/charts/AreaChart';
import { Widget } from '../components/ui/Widget';

export const CTODashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => { getRole('cto').then(setData).catch(() => {}); }, []);

  if (!data) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div className="fade-up-2" style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>CTO Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {data.stats.map((s: any, i: number) => (
          <StatCard key={i} label={s.label} value={s.value} trend={s.trend} trendDir={s.trendDir as any} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Widget>
          <h3 style={{ marginBottom: 16 }}>Engineering Health</h3>
          <Gauge value={data.payload.healthScore} label="Score" />
        </Widget>
        <Widget>
          <h3 style={{ marginBottom: 16 }}>Deploy Trend</h3>
          <AreaChart data={data.payload.deployTrend} width={350} height={150} />
        </Widget>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Create VPDashboard.tsx**

```tsx
import React, { useEffect, useState } from 'react';
import { getRole } from '../api/metrics';
import { StatCard } from '../components/ui/StatCard';
import { Heatmap } from '../components/charts/Heatmap';
import { AreaChart } from '../components/charts/AreaChart';
import { Widget } from '../components/ui/Widget';

export const VPDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => { getRole('vp').then(setData).catch(() => {}); }, []);

  if (!data) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div className="fade-up-2" style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>VP Engineering Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {data.stats.map((s: any, i: number) => (
          <StatCard key={i} label={s.label} value={s.value} trend={s.trend} trendDir={s.trendDir as any} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Widget>
          <h3 style={{ marginBottom: 16 }}>PR Cycle Time</h3>
          <AreaChart data={data.payload.prCycleTime} width={350} height={150} />
        </Widget>
        <Widget>
          <h3 style={{ marginBottom: 16 }}>Activity Heatmap</h3>
          <Heatmap data={data.payload.heatmap} width={350} height={120} />
        </Widget>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Create TLDashboard.tsx**

```tsx
import React, { useEffect, useState } from 'react';
import { getRole } from '../api/metrics';
import { StatCard } from '../components/ui/StatCard';
import { BarChart } from '../components/charts/BarChart';
import { Widget } from '../components/ui/Widget';

export const TLDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => { getRole('tl').then(setData).catch(() => {}); }, []);

  if (!data) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div className="fade-up-2" style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Team Lead Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {data.stats.map((s: any, i: number) => (
          <StatCard key={i} label={s.label} value={s.value} trend={s.trend} trendDir={s.trendDir as any} />
        ))}
      </div>

      <Widget>
        <h3 style={{ marginBottom: 16 }}>Sprint Burndown</h3>
        <BarChart data={data.payload.burndown.map((v: number, i: number) => ({ label: `Day ${i+1}`, value: v }))} width={600} height={200} />
      </Widget>
    </div>
  );
};
```

- [ ] **Step 4: Create DevOpsDashboard.tsx**

```tsx
import React, { useEffect, useState } from 'react';
import { getRole } from '../api/metrics';
import { StatCard } from '../components/ui/StatCard';
import { Heatmap } from '../components/charts/Heatmap';
import { AreaChart } from '../components/charts/AreaChart';
import { Widget } from '../components/ui/Widget';

export const DevOpsDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => { getRole('devops').then(setData).catch(() => {}); }, []);

  if (!data) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div className="fade-up-2" style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>DevOps Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {data.stats.map((s: any, i: number) => (
          <StatCard key={i} label={s.label} value={s.value} trend={s.trend} trendDir={s.trendDir as any} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Widget>
          <h3 style={{ marginBottom: 16 }}>MTTR Trend</h3>
          <AreaChart data={data.payload.mttrTrend} width={350} height={150} />
        </Widget>
        <Widget>
          <h3 style={{ marginBottom: 16 }}>Deploy Heatmap</h3>
          <Heatmap data={data.payload.deployHeatData} width={350} height={120} />
        </Widget>
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Create ICDashboard.tsx**

```tsx
import React, { useEffect, useState } from 'react';
import { getRole } from '../api/metrics';
import { StatCard } from '../components/ui/StatCard';
import { Widget } from '../components/ui/Widget';

export const ICDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => { getRole('ic').then(setData).catch(() => {}); }, []);

  if (!data) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div className="fade-up-2" style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Individual Contributor Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {data.stats.map((s: any, i: number) => (
          <StatCard key={i} label={s.label} value={s.value} trend={s.trend} trendDir={s.trendDir as any} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Widget>
          <h3 style={{ marginBottom: 16 }}>My PRs</h3>
          <div style={{ color: 'var(--muted)' }}>{data.payload.myPRs} open PRs</div>
        </Widget>
        <Widget>
          <h3 style={{ marginBottom: 16 }}>Review Queue</h3>
          <div style={{ color: 'var(--muted)' }}>{data.payload.reviewQueue} PRs waiting for review</div>
        </Widget>
      </div>
    </div>
  );
};
```

- [ ] **Step 6: Create RoleDashboardScreen.tsx (tab wrapper)**

```tsx
import React, { useState } from 'react';
import { CTODashboard } from './CTODashboard';
import { VPDashboard } from './VPDashboard';
import { TLDashboard } from './TLDashboard';
import { DevOpsDashboard } from './DevOpsDashboard';
import { ICDashboard } from './ICDashboard';

const tabs = [
  { id: 'cto', label: 'CTO', component: CTODashboard },
  { id: 'vp', label: 'VP Engineering', component: VPDashboard },
  { id: 'tl', label: 'Team Lead', component: TLDashboard },
  { id: 'devops', label: 'DevOps', component: DevOpsDashboard },
  { id: 'ic', label: 'Individual', component: ICDashboard },
];

export const RoleDashboardScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cto');
  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || CTODashboard;

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: activeTab === t.id ? 'var(--cyan)20' : 'transparent',
            color: activeTab === t.id ? 'var(--cyan)' : 'var(--muted)',
            fontSize: 14, fontWeight: 500
          }}>
            {t.label}
          </button>
        ))}
      </div>
      <ActiveComponent />
    </div>
  );
};
```

- [ ] **Step 7: Verify all compile**

Run: `cd ui && npx tsc --noEmit 2>&1 | grep -E "(CTO|VP|TL|DevOps|IC|RoleDashboard)Screen"`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add ui/src/screens/CTODashboard.tsx ui/src/screens/VPDashboard.tsx ui/src/screens/TLDashboard.tsx ui/src/screens/DevOpsDashboard.tsx ui/src/screens/ICDashboard.tsx ui/src/screens/RoleDashboardScreen.tsx
git commit -m "feat: add all 5 role dashboards and tab wrapper"
```

---

### Task 17: Metrics Explorer & Other Screens

**Files:**
- Create: `ui/src/screens/MetricsScreen.tsx`
- Create: `ui/src/screens/DashboardWizardScreen.tsx`
- Create: `ui/src/screens/AIScreen.tsx`
- Create: `ui/src/screens/PluginScreen.tsx`
- Create: `ui/src/screens/WizardScreen.tsx`
- Create: `ui/src/screens/PlaceholderScreen.tsx`

- [ ] **Step 1: Create MetricsScreen.tsx (Grafana-style)**

```tsx
import React, { useEffect, useState } from 'react';
import { getDORA, getMetrics } from '../api/metrics';
import { AreaChart } from '../components/charts/AreaChart';
import { FilterPill } from '../components/ui/FilterPill';
import { Widget } from '../components/ui/Widget';

export const MetricsScreen: React.FC = () => {
  const [dora, setDora] = useState<any>(null);
  const [selectedMetric, setSelectedMetric] = useState('deploy-freq');
  const [metricData, setMetricData] = useState<any>(null);
  const [range, setRange] = useState('30d');

  useEffect(() => { getDORA().then(setDora).catch(() => {}); }, []);
  useEffect(() => { getMetrics(selectedMetric, range).then(setMetricData).catch(() => {}); }, [selectedMetric, range]);

  return (
    <div className="fade-up-3" style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Metrics Explorer</h1>
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <FilterPill label="Metric" options={['deploy-freq', 'lead-time', 'mttr', 'change-fail']} value={selectedMetric} onChange={setSelectedMetric} />
        <FilterPill label="Range" options={['7d', '14d', '30d', '90d']} value={range} onChange={setRange} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {dora?.metrics?.map((m: any) => (
          <Widget key={m.id} style={{ cursor: 'pointer', borderColor: selectedMetric === m.id ? m.color : 'var(--border)' }} onClick={() => setSelectedMetric(m.id)}>
            <div style={{ color: m.color, fontSize: 12, marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{m.value}</div>
            <div style={{ color: m.good ? '#00C853' : '#FF1744', fontSize: 12 }}>{m.level}</div>
          </Widget>
        ))}
      </div>

      {metricData && (
        <Widget>
          <h3 style={{ marginBottom: 16 }}>{metricData.label}</h3>
          <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
            <div><span style={{ color: 'var(--muted)' }}>Current: </span><strong>{metricData.current}</strong></div>
            <div><span style={{ color: 'var(--muted)' }}>Delta: </span><strong style={{ color: metricData.delta > 0 ? '#00C853' : '#FF1744' }}>{metricData.delta > 0 ? '+' : ''}{metricData.delta}</strong></div>
          </div>
          <AreaChart data={metricData.series} compare={metricData.compare} width={800} height={250} />
        </Widget>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Create DashboardWizardScreen.tsx**

```tsx
import React, { useState } from 'react';
import { Widget } from '../components/ui/Widget';
import { AreaChart } from '../components/charts/AreaChart';
import { createDashboard } from '../api/metrics';
import { makeTimeSeries } from '../components/charts/utils';

const steps = ['Choose Widgets', 'Configure Layout', 'Save Dashboard'];

export const DashboardWizardScreen: React.FC = () => {
  const [step, setStep] = useState(0);
  const [widgets, setWidgets] = useState<string[]>([]);
  const [name, setName] = useState('');

  const availableWidgets = ['dora-overview', 'ci-pass-rate', 'velocity-chart', 'heatmap', 'deploy-trend', 'pr-queue'];

  const toggleWidget = (w: string) => setWidgets(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]);

  const handleSave = async () => {
    await createDashboard({ name, widgets, widgetSizes: {}, timeRange: '30d', team: 'All teams' });
    alert('Dashboard saved!');
  };

  return (
    <div className="fade-up-3" style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Dashboard Builder</h1>
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            padding: '8px 16px', borderRadius: 20, fontSize: 13,
            background: i <= step ? 'var(--cyan)20' : 'var(--glass)',
            color: i <= step ? 'var(--cyan)' : 'var(--muted)'
          }}>{i + 1}. {s}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <Widget>
          {step === 0 && (
            <>
              <h3 style={{ marginBottom: 16 }}>Select Widgets</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {availableWidgets.map(w => (
                  <button key={w} onClick={() => toggleWidget(w)} style={{
                    padding: '8px 16px', borderRadius: 8, border: '1px solid',
                    borderColor: widgets.includes(w) ? 'var(--cyan)' : 'var(--border)',
                    background: widgets.includes(w) ? 'var(--cyan)20' : 'transparent',
                    color: 'var(--text)', cursor: 'pointer', fontSize: 13
                  }}>{w}</button>
                ))}
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h3 style={{ marginBottom: 16 }}>Configure Dashboard</h3>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Dashboard name" style={{
                width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg)', color: 'var(--text)', fontSize: 14, marginBottom: 16
              }} />
            </>
          )}
          {step === 2 && (
            <>
              <h3 style={{ marginBottom: 16 }}>Preview</h3>
              <div style={{ color: 'var(--muted)' }}>Dashboard: {name}</div>
              <div style={{ color: 'var(--muted)' }}>Widgets: {widgets.join(', ')}</div>
            </>
          )}
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text)', cursor: 'pointer' }}>Back</button>}
            {step < 2 && <button onClick={() => setStep(s => s + 1)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--grad)', color: '#fff', cursor: 'pointer' }}>Next</button>}
            {step === 2 && <button onClick={handleSave} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--grad)', color: '#fff', cursor: 'pointer' }}>Save Dashboard</button>}
          </div>
        </Widget>

        <Widget>
          <h3 style={{ marginBottom: 16 }}>Live Preview</h3>
          <AreaChart data={makeTimeSeries(1, 20, 50, 20)} width={280} height={140} />
        </Widget>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Create AIScreen.tsx**

```tsx
import React, { useState } from 'react';
import { Widget } from '../components/ui/Widget';

export const AIScreen: React.FC = () => {
  const [messages, setMessages] = useState<{role: string; content: string}[]>([
    { role: 'assistant', content: 'Hi! I\'m your AI engineering assistant. Ask me about your team\'s metrics, trends, or insights.' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input }]);
    setTimeout(() => setMessages(ms => [...ms, { role: 'assistant', content: 'I\'m a UI prototype - real AI integration coming soon!' }]), 500);
    setInput('');
  };

  return (
    <div className="fade-up-4" style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>AI Assistant</h1>
      
      <Widget style={{ minHeight: 400, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              padding: 12, borderRadius: 8, background: m.role === 'user' ? 'var(--cyan)20' : 'var(--bg)',
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%'
            }}>
              {m.content}
            </div>
          ))}
        </div>
      </Widget>

      <div style={{ display: 'flex', gap: 12 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask about your metrics..." style={{
          flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text)', fontSize: 14
        }} />
        <button onClick={handleSend} style={{ padding: '12px 24px', borderRadius: 8, border: 'none', background: 'var(--grad)', color: '#fff', cursor: 'pointer' }}>Send</button>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Create PluginScreen.tsx**

```tsx
import React from 'react';
import { Widget } from '../components/ui/Widget';

const plugins = [
  { name: 'Slack Integration', desc: 'Send alerts to Slack channels', installed: true },
  { name: 'Jira Connector', desc: 'Sync issues and sprints', installed: false },
  { name: 'GitHub Webhooks', desc: 'Real-time event ingestion', installed: true },
  { name: 'Datadog Export', desc: 'Push metrics to Datadog', installed: false },
];

export const PluginScreen: React.FC = () => (
  <div className="fade-up-4" style={{ padding: 24 }}>
    <h1 style={{ fontSize: 28, marginBottom: 24 }}>Plugin Marketplace</h1>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
      {plugins.map(p => (
        <Widget key={p.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ marginBottom: 4 }}>{p.name}</h4>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>{p.desc}</p>
            </div>
            <button style={{
              padding: '8px 16px', borderRadius: 6, border: 'none',
              background: p.installed ? '#00C85320' : 'var(--grad)', color: p.installed ? '#00C853' : '#fff',
              cursor: 'pointer', fontSize: 13
            }}>{p.installed ? 'Installed' : 'Install'}</button>
          </div>
        </Widget>
      ))}
    </div>
  </div>
);
```

- [ ] **Step 5: Create WizardScreen.tsx**

```tsx
import React, { useState } from 'react';
import { Widget } from '../components/ui/Widget';

const wizardSteps = ['Connect', 'Configure', 'Validate', 'Done'];

export const WizardScreen: React.FC = () => {
  const [step, setStep] = useState(0);
  return (
    <div className="fade-up-4" style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, marginBottom: 24, textAlign: 'center' }}>Connect Data Sources</h1>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
        {wizardSteps.map((s, i) => (
          <div key={i} style={{
            padding: '6px 12px', borderRadius: 4, fontSize: 12,
            background: i <= step ? 'var(--cyan)20' : 'var(--glass)',
            color: i <= step ? 'var(--cyan)' : 'var(--muted)'
          }}>{s}</div>
        ))}
      </div>
      <Widget>
        <h3 style={{ marginBottom: 16 }}>Step {step + 1}: {wizardSteps[step]}</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>This is a UI prototype. Real data source configuration coming soon.</p>
        <div style={{ display: 'flex', gap: 12 }}>
          {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text)', cursor: 'pointer' }}>Back</button>}
          {step < 3 && <button onClick={() => setStep(s => s + 1)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--grad)', color: '#fff', cursor: 'pointer' }}>Next</button>}
        </div>
      </Widget>
    </div>
  );
};
```

- [ ] **Step 6: Create PlaceholderScreen.tsx**

```tsx
import React from 'react';
import { Widget } from '../components/ui/Widget';

export const PlaceholderScreen: React.FC = () => (
  <div className="fade-up-5" style={{ padding: 24 }}>
    <h1 style={{ fontSize: 28, marginBottom: 24 }}>Settings</h1>
    <Widget>
      <p style={{ color: 'var(--muted)' }}>Settings panel coming soon.</p>
    </Widget>
  </div>
);
```

- [ ] **Step 7: Verify all compile**

Run: `cd ui && npx tsc --noEmit 2>&1 | grep -E "Screen"`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add ui/src/screens/MetricsScreen.tsx ui/src/screens/DashboardWizardScreen.tsx ui/src/screens/AIScreen.tsx ui/src/screens/PluginScreen.tsx ui/src/screens/WizardScreen.tsx ui/src/screens/PlaceholderScreen.tsx
git commit -m "feat: add Metrics Explorer, Dashboard Wizard, AI, Plugin, Wizard, and Placeholder screens"
```

---

## Phase 7: App Shell & Integration

### Task 18: App.tsx Router Integration

**Files:**
- Modify: `ui/src/App.tsx`

- [ ] **Step 1: Rewrite App.tsx with router**

```tsx
import React, { useState } from 'react';
import { Sidebar } from './components/ui/Sidebar';
import { Topbar } from './components/ui/Topbar';
import { DashboardScreen } from './screens/DashboardScreen';
import { RoleDashboardScreen } from './screens/RoleDashboardScreen';
import { MetricsScreen } from './screens/MetricsScreen';
import { DashboardWizardScreen } from './screens/DashboardWizardScreen';
import { AIScreen } from './screens/AIScreen';
import { PluginScreen } from './screens/PluginScreen';
import { WizardScreen } from './screens/WizardScreen';
import { PlaceholderScreen } from './screens/PlaceholderScreen';

const screens: Record<string, React.FC> = {
  dashboard: DashboardScreen,
  cto: RoleDashboardScreen,
  vp: RoleDashboardScreen,
  tl: RoleDashboardScreen,
  devops: RoleDashboardScreen,
  ic: RoleDashboardScreen,
  metrics: MetricsScreen,
  wizard: DashboardWizardScreen,
  ai: AIScreen,
  plugins: PluginScreen,
  sources: WizardScreen,
  settings: PlaceholderScreen,
};

export const App: React.FC = () => {
  const [active, setActive] = useState('dashboard');

  const Screen = screens[active] || DashboardScreen;

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
      <Sidebar active={active} onNavigate={setActive} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <main style={{ flex: 1, overflow: 'auto' }}>
          <Screen />
        </main>
      </div>
    </div>
  );
};

export default App;
```

- [ ] **Step 2: Verify compiles**

Run: `cd ui && npm run build 2>&1 | tail -20`
Expected: Build completes successfully

- [ ] **Step 3: Commit**

```bash
git add ui/src/App.tsx
git commit -m "feat: integrate all screens with sidebar router"
```

---

### Task 19: Verify Full Application

**Files:**
- Verify: All files

- [ ] **Step 1: Start Go API**

Run: `go run cmd/api/main.go &` (background)
Expected: Server starts on port 8080

- [ ] **Step 2: Start frontend**

Run: `cd ui && npm run dev &` (background)
Expected: Vite dev server starts

- [ ] **Step 3: Run integration test**

Run: `curl -s http://localhost:8080/api/v1/dora | head -c 200`
Expected: JSON with dora metrics

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "feat: complete UI redesign - 11 screens, 5 API endpoints, custom SVG charts"
```

---

## Plan Summary

This plan implements the complete UI redesign in 19 tasks across 7 phases:

1. **Design System** - CSS variables, fonts, animations
2. **Chart Components** - 7 SVG chart types
3. **UI Components** - 10 reusable components
4. **Backend Stubs** - 5 Go handlers with seeded data
5. **API Client** - TypeScript fetch functions
6. **Screens** - 11 screen components
7. **Integration** - App shell with router

Total: ~50 individual steps with complete code for each.

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-01-metraly-ui-redesign-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**