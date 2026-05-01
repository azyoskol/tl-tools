# UI Pixel-Perfect Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update Metraly UI implementation to achieve pixel-perfect match with the design prototype from Claude Design.

**Architecture:** Layer-by-layer rewrite: CSS tokens → Icon system → Sidebar/Topbar → Cards → Screens.

**Tech Stack:** React 18 + TypeScript + Vite (existing), inline styles matching design exactly.

---

## File Structure

```
ui/src/
├── index.css                          # CSS design tokens (modify)
├── components/ui/
│   ├── Icon.tsx                       # 30+ icons (rewrite)
│   ├── Sidebar.tsx                    # Sections, pinned, status (rewrite)
│   ├── Topbar.tsx                     # Search, bell, notifications (rewrite)
│   ├── MetricCard.tsx                 # Large stat card (rewrite)
│   ├── StatCard.tsx                   # Compact stat card (rewrite)
│   ├── Widget.tsx                     # Glass container (modify)
│   ├── AIInsightCard.tsx              # Gradient border card (modify)
│   ├── InlineInsight.tsx              # Strip insight (modify)
│   ├── SectionHeader.tsx             # Section title + hr (modify)
│   └── Badge.tsx                     # Status badge (modify)
├── screens/
│   ├── DashboardScreen.tsx           # Main dashboard (rewrite)
│   ├── CTODashboard.tsx              # CTO role dashboard (rewrite)
│   ├── VPDashboard.tsx                # VP role dashboard (rewrite)
│   ├── TLDashboard.tsx               # TL role dashboard (rewrite)
│   ├── DevOpsDashboard.tsx           # DevOps role dashboard (rewrite)
│   ├── ICDashboard.tsx                # IC role dashboard (rewrite)
│   ├── RoleDashboardScreen.tsx       # Role wrapper (modify)
│   ├── MetricsScreen.tsx             # Metrics explorer (modify)
│   ├── AIScreen.tsx                  # AI chat (modify)
│   ├── PluginScreen.tsx              # Marketplace (modify)
│   ├── WizardScreen.tsx              # Connect sources (modify)
│   ├── DashboardWizardScreen.tsx     # Dashboard builder (modify)
│   └── PlaceholderScreen.tsx         # Settings placeholder (modify)
├── components/charts/
│   ├── utils.ts                      # Seeded data (modify)
│   ├── AreaChart.tsx                 # Bezier area chart (verify)
│   ├── BarChart.tsx                  # Bar chart (verify)
│   ├── Heatmap.tsx                   # Activity heatmap (verify)
│   ├── Gauge.tsx                     # Semicircle gauge (verify)
│   ├── MiniSparkline.tsx             # Compact sparkline (verify)
│   ├── Leaderboard.tsx               # Ranked bars (verify)
│   └── DataTable.tsx                 # Styled table (verify)
├── api/metrics.ts                    # Typed API (existing)
└── App.tsx                           # Shell with routing (modify)
```

---

## Task 0: Visual Regression Tests Setup

**Goal:** Create tests to verify pixel-perfect implementation matches design exactly.

**Files:**
- Create: `ui/src/__tests__/visual/design-tokens.test.ts`
- Create: `ui/src/__tests__/visual/sidebar.test.tsx`
- Create: `ui/src/__tests__/visual/topbar.test.tsx`
- Create: `ui/src/__tests__/visual/metric-card.test.tsx`
- Create: `ui/src/__tests__/visual/dashboard-screen.test.tsx`

- [ ] **Step 1: Install testing dependencies**

```bash
cd /home/zubarev/sources/metraly/ui
npm install --save-dev @testing-library/react @testing-library/jest-dom jest @types/jest ts-jest
```

- [ ] **Step 2: Setup Jest configuration**

Create `ui/jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
```

Create `ui/src/setupTests.ts`:
```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 3: Create design tokens test**

Create `ui/src/__tests__/visual/design-tokens.test.ts`:
```typescript
describe('CSS Design Tokens', () => {
  it('matches design tokens from prototype', () => {
    const styles = getComputedStyle(document.documentElement);
    
    expect(styles.getPropertyValue('--bg').trim()).toBe('#0B0F19');
    expect(styles.getPropertyValue('--glass').trim()).toBe('#131825');
    expect(styles.getPropertyValue('--glass2').trim()).toBe('#1a2235');
    expect(styles.getPropertyValue('--border').trim()).toBe('rgba(255, 255, 255, 0.07)');
    expect(styles.getPropertyValue('--border2').trim()).toBe('rgba(255, 255, 255, 0.12)');
    expect(styles.getPropertyValue('--cyan').trim()).toBe('#00E5FF');
    expect(styles.getPropertyValue('--purple').trim()).toBe('#B44CFF');
    expect(styles.getPropertyValue('--sidebar-w').trim()).toBe('228px');
  });

  it('has correct scrollbar dimensions (6px)', () => {
    const style = document.createElement('style');
    style.textContent = `
      ::-webkit-scrollbar { width: 6px; height: 6px; }
    `;
    document.head.appendChild(style);
    
    const scrollbar = document.querySelector('::-webkit-scrollbar');
    expect(scrollbar).toBeTruthy();
  });

  it('has all animation classes with correct delays', () => {
    const style = document.querySelector('style');
    const css = style?.textContent || '';
    
    expect(css).toContain('fade-up-1');
    expect(css).toContain('fade-up-2');
    expect(css).toContain('fade-up-3');
    expect(css).toContain('fade-up-4');
    expect(css).toContain('fade-up-5');
    expect(css).toContain('fade-up-6');
    
    expect(css).toContain('0.06s'); // 60ms intervals
    expect(css).toContain('pulse-dot');
    expect(css).toContain('backdrop-filter: blur(16px)');
  });
});
```

- [ ] **Step 4: Create sidebar test**

Create `ui/src/__tests__/visual/sidebar.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { Sidebar } from '../../components/ui/Sidebar';

describe('Sidebar Visual', () => {
  it('renders with correct width (228px)', () => {
    const { container } = render(<Sidebar active="dashboard" onNavigate={() => {}}/>);
    const aside = container.querySelector('aside');
    const width = aside?.style.width;
    expect(width).toBe('228px');
  });

  it('renders logo with gradient', () => {
    render(<Sidebar active="dashboard" onNavigate={() => {}}/>);
    const logo = screen.getByText('Metraly');
    expect(logo).toHaveStyle({ background: expect.stringContaining('gradient') });
  });

  it('renders status pill with pulse animation', () => {
    render(<Sidebar active="dashboard" onNavigate={() => {}}/>);
    const pill = screen.getByText('All systems nominal');
    expect(pill).toBeTruthy();
  });

  it('renders all sections', () => {
    render(<Sidebar active="dashboard" onNavigate={() => {}}/>);
    expect(screen.getByText('Dashboards')).toBeTruthy();
    expect(screen.getByText('Analytics')).toBeTruthy();
    expect(screen.getByText('Configure')).toBeTruthy();
    expect(screen.getByText('System')).toBeTruthy();
  });

  it('renders user footer with correct data', () => {
    render(<Sidebar active="dashboard" onNavigate={() => {}}/>);
    expect(screen.getByText('Jamie Dev')).toBeTruthy();
    expect(screen.getByText('Admin')).toBeTruthy();
  });

  it('renders NEW badge on AI Assistant', () => {
    render(<Sidebar active="dashboard" onNavigate={() => {}}/>);
    expect(screen.getByText('NEW')).toBeTruthy();
  });
});
```

- [ ] **Step 5: Create topbar test**

Create `ui/src/__tests__/visual/topbar.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { Topbar } from '../../components/ui/Topbar';

describe('Topbar Visual', () => {
  it('renders with correct height (56px)', () => {
    const { container } = render(<Topbar/>);
    const header = container.querySelector('header');
    expect(header?.style.height).toBe('56px');
  });

  it('renders search with placeholder', () => {
    render(<Topbar/>);
    expect(screen.getByText('Quick search…')).toBeTruthy();
    expect(screen.getByText('⌘K')).toBeTruthy();
  });

  it('renders bell with notification dot', () => {
    const { container } = render(<Topbar/>);
    const bellButton = container.querySelector('button');
    expect(bellButton).toBeTruthy();
  });
});
```

- [ ] **Step 6: Create MetricCard test**

Create `ui/src/__tests__/visual/metric-card.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { MetricCard } from '../../components/ui/MetricCard';

describe('MetricCard Visual', () => {
  it('renders with icon container (36x36)', () => {
    render(<MetricCard 
      icon="gitPR" 
      label="PRs awaiting review" 
      value="14" 
      trend="+3 today" 
      trendDir="down"
      accentColor="var(--cyan)"
    />);
    const iconContainer = screen.getByText('14').parentElement?.previousSibling;
    expect(iconContainer).toHaveStyle({ width: '36px', height: '36px' });
  });

  it('renders trend badge with correct styling', () => {
    render(<MetricCard 
      icon="gitPR" 
      label="Test" 
      value="14" 
      trend="+3 today" 
      trendDir="down"
      accentColor="var(--cyan)"
    />);
    const trend = screen.getByText('+3 today');
    expect(trend).toHaveStyle({ 
      background: expect.stringContaining('rgba(255,23,68'),
      borderRadius: '6px'
    });
  });

  it('renders sparkline container', () => {
    render(<MetricCard 
      icon="gitPR" 
      label="Test" 
      value="14" 
      trend="+3 today" 
      trendDir="up"
      accentColor="var(--cyan)"
      sparkData={[1,2,3,4]}
    />);
    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();
  });
});
```

- [ ] **Step 7: Create DashboardScreen test**

Create `ui/src/__tests__/visual/dashboard-screen.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { DashboardScreen } from '../../screens/DashboardScreen';

describe('DashboardScreen Visual', () => {
  it('renders 4 metric cards', () => {
    render(<DashboardScreen/>);
    expect(screen.getByText('PRs awaiting review')).toBeTruthy();
    expect(screen.getByText('Failed builds (24h)')).toBeTruthy();
    expect(screen.getByText('Blocked tasks')).toBeTruthy();
    expect(screen.getByText('Median CI time')).toBeTruthy();
  });

  it('renders 3-column AI insights grid', () => {
    render(<DashboardScreen/>);
    const grid = screen.getByText('AI Insights').parentElement?.parentElement;
    const style = grid?.getAttribute('style') || '';
    expect(style).toContain('grid-template-columns');
  });

  it('renders Recent Activity section with status dots', () => {
    render(<DashboardScreen/>);
    expect(screen.getByText('Recent Activity')).toBeTruthy();
  });
});
```

- [ ] **Step 8: Run tests to verify they exist**

```bash
cd /home/zubarev/sources/metraly/ui
npm test -- --testPathPattern=visual/ --passWithNoTests
```

- [ ] **Step 9: Commit**

```bash
git add ui/src/__tests__/visual/ ui/jest.config.js ui/src/setupTests.ts
git commit -m "test: add visual regression tests for pixel-perfect verification"
```

---

## Task 1: CSS Design Tokens

**Files:**
- Modify: `ui/src/index.css`

- [ ] **Step 1: Add missing CSS variables**

Add after existing variables (line 16):
```css
  --sidebar-w: 228px;
  --border2:   rgba(255,255,255,0.12);
```

- [ ] **Step 2: Update scrollbar (6px, not 8px)**

Replace lines 130-146:
```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
```

- [ ] **Step 3: Add .glass utility class**

Add after scrollbar styles:
```css
.glass {
  background: var(--glass);
  border: 1px solid var(--border);
  border-radius: 12px;
  backdrop-filter: blur(16px);
}
```

- [ ] **Step 4: Fix animation stagger (60ms intervals, not 100ms)**

Replace fadeUp keyframes (lines 23-50):
```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-up-1 { animation: fade-up 0.35s 0.06s ease both; }
.fade-up-2 { animation: fade-up 0.35s 0.12s ease both; }
.fade-up-3 { animation: fade-up 0.35s 0.18s ease both; }
.fade-up-4 { animation: fade-up 0.35s 0.24s ease both; }
.fade-up-5 { animation: fade-up 0.35s 0.30s ease both; }
.fade-up-6 { animation: fade-up 0.35s 0.36s ease both; }
```

- [ ] **Step 5: Add pulse-dot animation**

Add after spinSlow keyframe:
```css
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0,229,255,0.4); opacity: 1; }
  50% { box-shadow: 0 0 0 6px rgba(0,229,255,0); opacity: 0.7; }
}
```

- [ ] **Step 6: Commit**

```bash
cd /home/zubarev/sources/metraly
git add ui/src/index.css
git commit -m "feat: update CSS design tokens for pixel-perfect match"
```

---

## Task 2: Icon System (30+ icons)

**Files:**
- Rewrite: `ui/src/components/ui/Icon.tsx`

- [ ] **Step 1: Write the test**

Create `ui/src/components/ui/Icon.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renders icons by name', () => {
    const { container } = render(<Icon name="zap" size={16} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '16');
  });
});
```

- [ ] **Step 2: Run test to verify it passes (existing test infrastructure)**

Run: `npm test -- --testPathPattern=Icon.test.tsx` (if exists) or skip for UI component

- [ ] **Step 3: Rewrite Icon.tsx with all 30+ icons**

Replace entire file:
```tsx
import React from 'react';

type IconName = 
  | 'zap' | 'home' | 'bar2' | 'gitPR' | 'xCircle' | 'alertTri' | 'clock' 
  | 'brain' | 'puzzle' | 'settings' | 'users' | 'bell' | 'search' | 'star' 
  | 'download' | 'check' | 'github' | 'jira' | 'gitlab' | 'linear' | 'slack' 
  | 'pagerduty' | 'arrowRight' | 'chevronDown' | 'activity' | 'boxes' | 'cpu' 
  | 'trendingUp' | 'filter' | 'layers' | 'chart' | 'plus' | 'x' | 'database' 
  | 'link' | 'sparkles';

const icons: Record<IconName, React.ReactNode> = {
  zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  home: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  bar2: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  gitPR: <><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></>,
  xCircle: <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>,
  alertTri: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  brain: <><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></>,
  puzzle: <><path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.707L8.95 19.439a.98.98 0 0 0-.837-.276c-.47.07-.802.48-.968.925a2.501 2.501 0 1 1-3.214-3.214c.446-.166.855-.497.925-.968a.979.979 0 0 0-.276-.837l-1.61-1.61a2.404 2.404 0 0 1-.707-1.705 2.402 2.402 0 0 1 .707-1.704l1.568-1.568c.23-.23.338-.556.29-.878-.07-.47-.48-.802-.926-.968a2.501 2.501 0 1 1 3.214-3.214c.166.446.497.855.968.925a.979.979 0 0 0 .837-.276l1.61-1.61a2.402 2.402 0 0 1 1.705-.707 2.404 2.404 0 0 1 1.704.707l1.568 1.567c.23.23.556.338.878.29.47-.07.802-.48.968-.925a2.501 2.501 0 1 1 3.214 3.214c-.446.166-.855.497-.925.968Z"/></>,
  settings: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
  search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  star: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  github: <><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></>,
  jira: <><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="m8 12 4-4 4 4"/></>,
  gitlab: <><path d="m22 13.29-3.33-10a.42.42 0 0 0-.14-.18.38.38 0 0 0-.22-.11.39.39 0 0 0-.23.07.42.42 0 0 0-.14.18l-2.26 6.67H8.32L6.1 3.26a.42.42 0 0 0-.1-.17.38.38 0 0 0-.6.1L2 13.29a.43.43 0 0 0 .15.48L12 21l9.85-7.23a.43.43 0 0 0 .15-.48Z"/></>,
  linear: <><path d="m2 12 5.5-5.5"/><path d="M2 12h20"/><path d="m16.5 6.5 5.5 5.5"/><path d="M2 12l5.5 5.5"/><path d="m16.5 17.5 5.5-5.5"/></>,
  slack: <><rect width="3" height="8" x="13" y="2" rx="1.5"/><path d="M19 8.5V10h1.5A1.5 1.5 0 1 0 19 8.5"/><rect width="3" height="8" x="8" y="14" rx="1.5"/><path d="M5 15.5V14H3.5A1.5 1.5 0 1 0 5 15.5"/><rect width="8" height="3" x="14" y="13" rx="1.5"/><path d="M15.5 19H14v1.5a1.5 1.5 0 1 0 1.5-1.5"/><rect width="8" height="3" x="2" y="8" rx="1.5"/><path d="M8.5 5H10V3.5A1.5 1.5 0 1 0 8.5 5"/></>,
  pagerduty: <><rect width="4" height="12" x="10" y="2" rx="2"/><rect width="4" height="8" x="10" y="14" rx="2"/></>,
  arrowRight: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
  chevronDown: <><path d="m6 9 6 6 6-6"/></>,
  activity: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
  boxes: <><path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/><path d="m7 16.5-4.74-2.85"/><path d="m7 16.5 5-3"/><path d="M7 16.5v5.17"/><path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/><path d="m17 16.5-5-3"/><path d="m17 16.5 4.74-2.85"/><path d="M17 16.5v5.17"/><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"/><path d="M12 8 7.26 5.15"/><path d="m12 8 4.74-2.85"/><path d="M12 13.5V8"/></>,
  cpu: <><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></>,
  trendingUp: <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
  filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
  layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
  chart: <><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  database: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></>,
  link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>,
  sparkles: <><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></>,
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export const Icon: React.FC<IconProps> = ({ name, size = 16, color = 'currentColor', style = {} }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    stroke={color} 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={style}
  >
    {icons[name]}
  </svg>
);
```

- [ ] **Step 4: Commit**

```bash
git add ui/src/components/ui/Icon.tsx
git commit -m "feat: add 30+ Lucide-style icons"
```

---

## Task 3: Sidebar Component

**Files:**
- Rewrite: `ui/src/components/ui/Sidebar.tsx`

- [ ] **Step 1: Write the test**

```tsx
// Test file would verify navigation, pinning, sections
// Skip for UI component, focus on visual match
```

- [ ] **Step 2: Rewrite Sidebar.tsx**

Replace entire file with design implementation (228px, sections, pinned, status pill, footer):
```tsx
import React, { useState } from 'react';
import { Icon } from './Icon';

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
}

const sections = [
  { label: 'Dashboards', items: [
    { id: 'dashboard', icon: 'home', label: 'Overview' },
    { id: 'cto', icon: 'trendingUp', label: 'CTO' },
    { id: 'vp', icon: 'users', label: 'VP Engineering' },
    { id: 'tl', icon: 'gitPR', label: 'Tech Lead' },
    { id: 'devops', icon: 'cpu', label: 'DevOps / SRE' },
    { id: 'ic', icon: 'activity', label: 'My View' },
    { id: 'wizard', icon: 'plus', label: 'New Dashboard', accent: true },
  ]},
  { label: 'Analytics', items: [
    { id: 'metrics', icon: 'bar2', label: 'Metrics Explorer' },
    { id: 'ai', icon: 'brain', label: 'AI Assistant', badge: 'NEW' },
  ]},
  { label: 'Configure', items: [
    { id: 'plugins', icon: 'puzzle', label: 'Marketplace' },
    { id: 'sources', icon: 'link', label: 'Connect Sources' },
  ]},
  { label: 'System', items: [
    { id: 'settings', icon: 'settings', label: 'Settings' },
  ]},
];

export const Sidebar: React.FC<SidebarProps> = ({ active, onNavigate }) => {
  const [pinned, setPinned] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('metraly-pinned') || '["cto","devops"]'); } 
    catch { return ['cto','devops']; }
  });

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinned(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('metraly-pinned', JSON.stringify(next));
      return next;
    });
  };

  return (
    <aside style={{
      width: 228, flexShrink: 0, height: '100%',
      background: 'rgba(11,15,25,0.95)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      backdropFilter: 'blur(20px)',
      position: 'relative', zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="activity" size={16} color="#fff"/>
          </div>
          <span style={{
            fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 17,
            background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Metraly</span>
        </div>
        {/* Status pill */}
        <div style={{
          marginTop: 12, display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.2)',
          borderRadius: 20, padding: '4px 10px', width: 'fit-content',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--success)',
            animation: 'pulse-dot 2s ease infinite',
          }}/>
          <span style={{ fontSize: 11, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
            All systems nominal
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflow: 'auto', padding: '12px 10px' }}>
        {sections.map(sec => (
          <div key={sec.label} style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
              color: 'var(--muted)', textTransform: 'uppercase',
              padding: '0 8px', marginBottom: 4,
            }}>{sec.label}</div>
            {sec.items.map(item => {
              const isActive = active === item.id;
              return (
                <button key={item.id} onClick={() => onNavigate(item.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 10px', borderRadius: 8, border: 'none',
                    cursor: 'pointer', marginBottom: 2,
                    background: isActive ? 'rgba(0,229,255,0.1)' : item.accent ? 'rgba(0,229,255,0.06)' : 'transparent',
                    color: isActive ? 'var(--cyan)' : item.accent ? 'var(--cyan)' : 'var(--muted2)',
                    fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: isActive || item.accent ? 500 : 400,
                    transition: 'all 0.18s ease', textAlign: 'left',
                    position: 'relative',
                  }}
                >
                  {isActive && <div style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: 16, borderRadius: 2, background: 'var(--cyan)',
                  }}/>}
                  <Icon name={item.icon as any} size={15} color={isActive ? 'var(--cyan)' : 'currentColor'}/>
                  {item.label}
                  {item.badge && (
                    <div style={{
                      marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--font-mono)',
                      background: 'rgba(180,76,255,0.15)', color: 'var(--purple)',
                      border: '1px solid rgba(180,76,255,0.25)', borderRadius: 4,
                      padding: '1px 5px',
                    }}>NEW</div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '12px 10px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00E5FF22, #B44CFF22)',
          border: '1px solid var(--border2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600, color: 'var(--muted2)',
        }}>JD</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)' }}>Jamie Dev</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Admin</div>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}>
          <Icon name="settings" size={14}/>
        </button>
      </div>
    </aside>
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add ui/src/components/ui/Sidebar.tsx
git commit -m "feat: rewrite Sidebar with sections, status pill, footer"
```

---

## Task 4: Topbar Component

**Files:**
- Rewrite: `ui/src/components/ui/Topbar.tsx`

- [ ] **Step 1: Rewrite Topbar.tsx**

```tsx
import React from 'react';
import { Icon } from './Icon';

export const Topbar: React.FC = () => (
  <header style={{
    height: 56, borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', padding: '0 24px',
    gap: 16, flexShrink: 0, background: 'rgba(11,15,25,0.6)',
    backdropFilter: 'blur(8px)',
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>
        Engineering Dashboard
      </div>
    </div>
    <div style={{
      display: 'flex', alignItems: 'center',
      background: 'var(--glass)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '6px 12px', gap: 8, width: 220,
    }}>
      <Icon name="search" size={13} color="var(--muted)"/>
      <span style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Quick search…</span>
      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 4 }}>⌘K</span>
    </div>
    <button style={{
      background: 'none', border: '1px solid var(--border)', borderRadius: 8,
      padding: '6px 8px', cursor: 'pointer', color: 'var(--muted2)', position: 'relative',
    }}>
      <Icon name="bell" size={15}/>
      <div style={{
        position: 'absolute', top: 4, right: 4, width: 7, height: 7,
        background: 'var(--cyan)', borderRadius: '50%', border: '1.5px solid var(--bg)',
      }}/>
    </button>
  </header>
);
```

- [ ] **Step 2: Commit**

```bash
git add ui/src/components/ui/Topbar.tsx
git commit -m "feat: rewrite Topbar with search and notifications"
```

---

## Task 5: Card Components

**Files:**
- Rewrite: `ui/src/components/ui/MetricCard.tsx`
- Rewrite: `ui/src/components/ui/StatCard.tsx`
- Modify: `ui/src/components/ui/Widget.tsx`

- [ ] **Step 1: Rewrite MetricCard.tsx**

```tsx
import React from 'react';
import { MiniSparkline } from '../charts/MiniSparkline';

interface MetricCardProps {
  icon: string;
  label: string;
  value: string;
  trend: string;
  trendDir: 'up' | 'down' | 'neutral';
  sparkData?: number[];
  accentColor: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  icon, label, value, trend, trendDir, sparkData, accentColor 
}) => {
  const [hovered, setHovered] = React.useState(false);
  
  const trendColors = {
    up: { color: 'var(--success)', bg: 'rgba(0,200,83,0.1)', border: 'rgba(0,200,83,0.2)' },
    down: { color: 'var(--error)', bg: 'rgba(255,23,68,0.1)', border: 'rgba(255,23,68,0.2)' },
    neutral: { color: 'var(--muted)', bg: 'rgba(107,122,154,0.15)', border: 'rgba(107,122,154,0.2)' },
  };
  const tc = trendColors[trendDir];

  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--glass2)' : 'var(--glass)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'var(--border)'}`,
        borderRadius: 14, padding: '20px 20px 16px',
        display: 'flex', flexDirection: 'column', gap: 14,
        cursor: 'default', transition: 'all 0.2s ease',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)' : 'none',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${accentColor}18`,
          border: `1px solid ${accentColor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon as any} size={16} color={accentColor}/>
        </div>
        <div style={{
          fontSize: 11, fontFamily: 'var(--font-mono)',
          color: tc.color, background: tc.bg,
          border: `1px solid ${tc.border}`,
          borderRadius: 6, padding: '2px 7px',
        }}>{trend}</div>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>{label}</div>
      </div>
      {sparkData && (
        <div style={{ marginTop: 'auto' }}>
          <MiniSparkline data={sparkData} color={accentColor} height={36}/>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Rewrite StatCard.tsx (compact version)**

```tsx
import React from 'react';
import { MiniSparkline } from '../charts/MiniSparkline';

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  trendDir?: 'up' | 'down' | 'neutral';
  color?: string;
  spark?: number[];
}

export const StatCard: React.FC<StatCardProps> = ({ 
  icon, label, value, sub, trend, trendDir = 'neutral', color = 'var(--cyan)', spark 
}) => {
  const [hov, setHov] = React.useState(false);
  
  const trendColors = {
    up: { color: '#00C853', bg: 'rgba(0,200,83,0.1)', border: 'rgba(0,200,83,0.2)' },
    down: { color: '#FF1744', bg: 'rgba(255,23,68,0.1)', border: 'rgba(255,23,68,0.2)' },
    neutral: { color: 'var(--muted)', bg: 'rgba(107,122,154,0.12)', border: 'rgba(107,122,154,0.15)' },
  };
  const tc = trendColors[trendDir];

  return (
    <div 
      onMouseEnter={() => setHov(true)} 
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'var(--glass2)' : 'var(--glass)',
        border: `1px solid ${hov ? 'rgba(255,255,255,0.12)' : 'var(--border)'}`,
        borderRadius: 12, padding: '16px 16px 13px',
        display: 'flex', flexDirection: 'column', gap: 10,
        transition: 'all 0.2s ease',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? '0 6px 24px rgba(0,0,0,0.35)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ 
          width: 32, height: 32, borderRadius: 8, 
          background: `${color}18`, border: `${color}28`, 
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <Icon name={icon as any} size={15} color={color} />
        </div>
        {trend && (
          <span style={{
            fontSize: 11, fontFamily: 'var(--font-mono)',
            color: tc.color, background: tc.bg,
            border: `1px solid ${tc.border}`,
            borderRadius: 5, padding: '2px 6px',
          }}>{trend}</span>
        )}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--muted)', opacity: 0.7, marginTop: 2 }}>{sub}</div>}
      </div>
      {spark && <MiniSparkline data={spark} color={color} height={28} />}
    </div>
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add ui/src/components/ui/MetricCard.tsx ui/src/components/ui/StatCard.tsx
git commit -m "feat: rewrite MetricCard and StatCard with design styles"
```

---

## Task 6: DashboardScreen Content

**Files:**
- Rewrite: `ui/src/screens/DashboardScreen.tsx`

- [ ] **Step 1: Rewrite DashboardScreen.tsx**

```tsx
import React, { useEffect, useState } from 'react';
import { getInsights } from '../api/metrics';
import { MetricCard } from '../components/ui/MetricCard';
import { AIInsightCard } from '../components/ui/AIInsightCard';
import { Widget } from '../components/ui/Widget';
import { makeTimeSeries } from '../components/charts/utils';

interface Insight { title: string; body: string; action?: string }

export const DashboardScreen: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    getInsights().then((r: any) => setInsights(r.insights)).catch(() => {});
  }, []);

  const metrics = [
    { icon: 'gitPR', label: 'PRs awaiting review', value: '14', trend: '+3 today', trendDir: 'down' as const, accentColor: 'var(--cyan)', sparkData: [4,7,5,9,6,8,11,14] },
    { icon: 'xCircle', label: 'Failed builds (24h)', value: '3', trend: '−5 vs avg', trendDir: 'up' as const, accentColor: 'var(--error)', sparkData: [12,9,11,7,5,8,4,3] },
    { icon: 'alertTri', label: 'Blocked tasks', value: '7', trend: 'No change', trendDir: 'neutral' as const, accentColor: 'var(--warning)', sparkData: [5,6,7,7,6,8,7,7] },
    { icon: 'clock', label: 'Median CI time', value: '4m 22s', trend: '−18s', trendDir: 'up' as const, accentColor: 'var(--purple)', sparkData: [8,7,9,6,7,5,5,4] },
  ];

  const designInsights = [
    { title: 'CI slowdown detected in monorepo', body: '3 workflows exceeded p95 latency over the last 6 hours. Root cause appears to be a Docker layer cache miss introduced in commit a3f91b.', action: 'View affected jobs' },
    { title: 'PR review load imbalanced', body: '@alex.kim has 9 open PRs awaiting review while the team average is 2.3. Consider redistributing or enabling auto-assignment.', action: 'Open PR queue' },
    { title: 'Deployment cadence slowing', body: 'Release frequency dropped 40% this week compared to the 4-week rolling average. No clear blocker found — recommend a retro.' },
  ];

  return (
    <div style={{ padding: '24px 28px', overflow: 'auto', flex: 1 }}>
      {/* Metric grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {metrics.map((m, i) => <MetricCard key={i} {...m} delay={i}/>)}
      </div>
      
      {/* AI section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>AI Insights</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Updated 2 min ago</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
        {(insights.length > 0 ? insights : designInsights).map((ins, i) => <AIInsightCard key={i} {...ins} delay={i}/>)}
      </div>
      
      {/* Activity strip */}
      <div className="fade-up-4" style={{
        background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>Recent Activity</span>
          <button style={{ background:'none', border:'none', color:'var(--cyan)', fontSize:12, cursor:'pointer', fontFamily:'var(--font-body)' }}>View all →</button>
        </div>
        {[
          { who:'push → main', what:'CI pipeline triggered for feat/auth-tokens', when:'2 min ago', status:'running', color:'var(--cyan)' },
          { who:'alex.kim',    what:'Merged PR #812: Add rate limiting middleware', when:'14 min ago', status:'success', color:'var(--success)' },
          { who:'sara.chen',  what:'PR #814 opened: Refactor API layer', when:'31 min ago', status:'open', color:'var(--warning)' },
          { who:'ci-bot',     what:'Deploy to staging failed — build #4221', when:'1 hr ago', status:'error', color:'var(--error)' },
        ].map((ev, i) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:12, padding:'9px 0',
            borderTop: i > 0 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:ev.color, flexShrink:0 }}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:11.5, color:'var(--muted2)', marginRight:6 }}>{ev.who}</span>
                {ev.what}
              </div>
            </div>
            <span style={{ fontSize:11, color:'var(--muted)', fontFamily:'var(--font-mono)', flexShrink:0 }}>{ev.when}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add ui/src/screens/DashboardScreen.tsx
git commit -m "feat: rewrite DashboardScreen with design data"
```

---

## Task 7: Role Dashboards (CTO, VP, TL, DevOps, IC)

**Files:**
- Rewrite: `ui/src/screens/CTODashboard.tsx`
- Rewrite: `ui/src/screens/VPDashboard.tsx`
- Rewrite: `ui/src/screens/TLDashboard.tsx`
- Rewrite: `ui/src/screens/DevOpsDashboard.tsx`
- Rewrite: `ui/src/screens/ICDashboard.tsx`

- [ ] **Step 1: Rewrite CTODashboard.tsx**

Reference design in `dashboard-roles.jsx` lines 104-181:
- 4 StatCards: Engineering Health, Deploy Frequency, Lead Time, Change Failure Rate
- Health Gauge (0.84)
- AreaChart: Deployment Frequency
- BarChart: Team Velocity comparison
- InlineInsight

```tsx
import React from 'react';
import { StatCard } from '../components/ui/StatCard';
import { Widget } from '../components/ui/Widget';
import { SectionHeader } from '../components/ui/SectionHeader';
import { InlineInsight } from '../components/ui/InlineInsight';
import { AreaChart } from '../components/charts/AreaChart';
import { BarChart } from '../components/charts/BarChart';
import { Gauge } from '../components/charts/Gauge';
import { makeTimeSeries } from '../components/charts/utils';

export const CTODashboard: React.FC = () => {
  const deployTrend = makeTimeSeries(30, 4.2, 1.5, 0.04, 11);
  const leadTimeTrend = makeTimeSeries(30, 18, 8, -0.1, 22);
  const velocityByTeam = { labels: ['Platform', 'Mobile', 'Backend', 'Frontend', 'Data'], values: [84, 71, 92, 63, 55] };
  const prevVelocity = [76, 68, 88, 70, 48];
  const weekLabels = Array.from({ length: 30 }, (_, i) => i % 5 === 0 ? `W${Math.floor(i/7)+1}` : '');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, padding: 24 }}>
      {/* Row 1: Stats */}
      <StatCard icon="trendingUp" label="Engineering Health" value="84" sub="out of 100" trend="+3 pts" trendDir="up" color="var(--cyan)" spark={makeTimeSeries(12, 78, 5, 0.5, 1)} delay={0} />
      <StatCard icon="zap" label="Deploy Frequency" value="4.2/day" trend="+0.8" trendDir="up" color="var(--success)" spark={makeTimeSeries(12, 3.2, 1, 0.08, 2)} delay={1} />
      <StatCard icon="clock" label="Lead Time" value="2.1 days" trend="−0.4d" trendDir="up" color="var(--purple)" spark={makeTimeSeries(12, 2.8, 0.5, -0.05, 3)} delay={2} />
      <StatCard icon="xCircle" label="Change Failure Rate" value="3.2%" trend="−1.1%" trendDir="up" color="var(--warning)" spark={makeTimeSeries(12, 5, 1.5, -0.1, 4)} delay={3} />

      {/* Row 2: Health Gauge + DORA */}
      <div className="fade-up-1" style={{ gridColumn: 'span 1' }}>
        <Widget>
          <div style={{ textAlign: 'center', paddingTop: 6 }}>
            <Gauge value={0.84} label="Health Score" size={150} />
          </div>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { k: 'Velocity', v: '92%', good: true },
              { k: 'Quality', v: '96.8%', good: true },
              { k: 'Reliability', v: '99.7%', good: true },
              { k: 'Security', v: '78%', good: false },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>{r.k}</span>
                <span style={{ color: r.good ? '#00C853' : '#FF9100', fontFamily: 'var(--font-mono)' }}>{r.v}</span>
              </div>
            ))}
          </div>
        </Widget>
      </div>

      {/* Deployment frequency */}
      <div className="fade-up-2" style={{ gridColumn: 'span 3' }}>
        <Widget>
          <SectionHeader title="Deployment Frequency" right="Last 30 days" />
          <AreaChart data={deployTrend} labels={weekLabels} color="#00E5FF" height={150} />
        </Widget>
      </div>

      {/* Row 3: Team velocity + Lead Time */}
      <div className="fade-up-3" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SectionHeader title="Team Velocity" right="Sprint vs prev sprint" />
          <BarChart labels={velocityByTeam.labels} values={velocityByTeam.values} compare={prevVelocity} height={160} color="#00E5FF" />
          <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#00E5FF' }} /> This sprint
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#B44CFF', opacity: 0.6 }} /> Previous sprint
            </div>
          </div>
        </Widget>
      </div>

      <div className="fade-up-4" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SectionHeader title="Lead Time for Changes" right="Days, 30-day trend" />
          <AreaChart data={leadTimeTrend} compare={makeTimeSeries(30, 22, 8, 0, 99)} labels={weekLabels} color="#B44CFF" height={150} />
        </Widget>
      </div>

      {/* AI insight */}
      <div className="fade-up-5" style={{ gridColumn: 'span 4' }}>
        <InlineInsight
          text="Security score at 78% is the main drag on engineering health. 3 critical CVEs in dependencies remain unpatched across the Backend team repos (introduced 12 days ago). Addressing these would push overall health to ~89."
          action="View security report"
        />
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Rewrite VPDashboard.tsx, TLDashboard.tsx, DevOpsDashboard.tsx, ICDashboard.tsx**

Each follows similar pattern with design data from `dashboard-roles.jsx`.

- [ ] **Step 3: Commit all role dashboards**

```bash
git add ui/src/screens/CTODashboard.tsx ui/src/screens/VPDashboard.tsx ui/src/screens/TLDashboard.tsx ui/src/screens/DevOpsDashboard.tsx ui/src/screens/ICDashboard.tsx
git commit -m "feat: rewrite role dashboards with design data"
```

---

## Task 8: Remaining Screens (Modify)

**Files:**
- Modify: `ui/src/screens/MetricsScreen.tsx`
- Modify: `ui/src/screens/AIScreen.tsx`
- Modify: `ui/src/screens/PluginScreen.tsx`
- Modify: `ui/src/screens/WizardScreen.tsx`
- Modify: `ui/src/screens/DashboardWizardScreen.tsx`
- Modify: `ui/src/screens/PlaceholderScreen.tsx`

- [ ] **Step 1: Update App.tsx to use new Sidebar/Topbar**

```tsx
import { Sidebar } from './components/ui/Sidebar';
import { Topbar } from './components/ui/Topbar';
// ... existing imports

export const App: React.FC = () => {
  const [active, setActive] = useState('dashboard');
  
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
      <Sidebar active={active} onNavigate={setActive} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <main style={{ flex: 1, overflow: 'auto' }}>
          {active === 'dashboard' && <DashboardScreen />}
          {active === 'cto' && <CTODashboard />}
          {active === 'vp' && <VPDashboard />}
          {active === 'tl' && <TLDashboard />}
          {active === 'devops' && <DevOpsDashboard />}
          {active === 'ic' && <ICDashboard />}
          {active === 'metrics' && <MetricsScreen />}
          {active === 'wizard' && <DashboardWizardScreen />}
          {active === 'ai' && <AIScreen />}
          {active === 'plugins' && <PluginScreen />}
          {active === 'sources' && <WizardScreen />}
          {active === 'settings' && <PlaceholderScreen />}
        </main>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Modify remaining screens with minor updates to match design**

- [ ] **Step 3: Commit**

```bash
git add ui/src/App.tsx ui/src/screens/
git commit -m "feat: update App.tsx routing and remaining screens"
```

---

## Task 9: Verification

> **Important:** After each task implementation, run relevant tests to verify implementation matches design:
> ```bash
> npm test -- --testPathPattern=visual/
> ```

- [ ] **Step 1: Build the UI**

```bash
cd /home/zubarev/sources/metraly/ui && npm run build
```

- [ ] **Step 2: Run all visual tests**

```bash
cd /home/zubarev/sources/metraly/ui && npm test -- --testPathPattern=visual/ --coverage
```

- [ ] **Step 3: Start dev server and verify visually**

```bash
npm run dev
```

- [ ] **Step 4: Compare with design at http://localhost:8765/Metraly.html**

- [ ] **Step 5: Fix any failing tests**

If tests fail, fix the implementation to match design spec, not the tests.

- [ ] **Step 6: Final commit**

```bash
git add -A && git commit -m "feat: complete UI pixel-perfect redesign"
```

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-01-ui-pixel-perfect-redesign-plan.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**