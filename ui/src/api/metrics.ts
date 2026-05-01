const API = 'http://localhost:8000/api/v1';

export const getMetrics = async (_?: unknown, _2?: unknown) => ({
  label: 'Deployment Frequency',
  current: '4.2/day',
  delta: 12,
  series: [
    { date: '2026-04-25', value: 3 },
    { date: '2026-04-26', value: 5 },
    { date: '2026-04-27', value: 4 },
    { date: '2026-04-28', value: 6 },
    { date: '2026-04-29', value: 4 },
    { date: '2026-04-30', value: 5 },
    { date: '2026-05-01', value: 4 },
  ],
});

export const getDORA = async () => ({
  metrics: [
    { id: 'deploy-freq', label: 'Deploy Frequency', value: '4.2/day', color: 'var(--cyan)', good: true, level: 'Elite' },
    { id: 'lead-time', label: 'Lead Time', value: '2.1h', color: 'var(--purple)', good: true, level: 'High' },
    { id: 'mttr', label: 'MTTR', value: '18min', color: 'var(--warning)', good: true, level: 'Medium' },
    { id: 'change-fail', label: 'Change Fail Rate', value: '8%', color: 'var(--error)', good: false, level: 'Low' },
  ],
});

export const getRole = async (role: string) => {
  const roleData: Record<string, any> = {
    cto: {
      stats: [
        { label: 'Engineering Health', value: '84%', trend: '+2%', trendDir: 'up' },
        { label: 'Deploy Frequency', value: '4.2/day', trend: '+0.5', trendDir: 'up' },
        { label: 'Lead Time', value: '2.1h', trend: '-15min', trendDir: 'up' },
      ],
      payload: {
        healthScore: 84,
        deployTrend: [
          { date: '2026-04-25', value: 3 },
          { date: '2026-04-26', value: 5 },
          { date: '2026-04-27', value: 4 },
          { date: '2026-04-28', value: 6 },
          { date: '2026-04-29', value: 4 },
          { date: '2026-04-30', value: 5 },
          { date: '2026-05-01', value: 4 },
        ],
      },
    },
    vp: {
      stats: [
        { label: 'Sprint Velocity', value: '42 pts', trend: '+8', trendDir: 'up' },
        { label: 'PR Cycle Time', value: '4.2h', trend: '-0.5h', trendDir: 'up' },
        { label: 'At-Risk Items', value: '3', trend: '+1', trendDir: 'down' },
      ],
      payload: {
        prCycleTime: [
          { date: '2026-04-25', value: 5 },
          { date: '2026-04-26', value: 4 },
          { date: '2026-04-27', value: 3 },
          { date: '2026-04-28', value: 4 },
          { date: '2026-04-29', value: 2 },
          { date: '2026-04-30', value: 3 },
          { date: '2026-05-01', value: 2 },
        ],
        heatmap: [],
      },
    },
    tl: {
      stats: [
        { label: 'CI Pass Rate', value: '94%', trend: '+2%', trendDir: 'up' },
        { label: 'PR Queue', value: '12', trend: '+3', trendDir: 'neutral' },
        { label: 'Burndown', value: 'On track', trend: '', trendDir: 'neutral' },
      ],
      payload: {
        burndown: [100, 85, 70, 55, 40, 30, 20, 10, 0],
      },
    },
    devops: {
      stats: [
        { label: 'Deploy Frequency', value: '12/day', trend: '+2', trendDir: 'up' },
        { label: 'MTTR', value: '18min', trend: '-5min', trendDir: 'up' },
        { label: 'Active Incidents', value: '0', trend: 'No change', trendDir: 'neutral' },
      ],
      payload: {
        mttrTrend: [
          { date: '2026-04-25', value: 25 },
          { date: '2026-04-26', value: 20 },
          { date: '2026-04-27', value: 18 },
          { date: '2026-04-28', value: 22 },
          { date: '2026-04-29', value: 15 },
          { date: '2026-04-30', value: 18 },
          { date: '2026-05-01', value: 18 },
        ],
        deployHeatData: [],
      },
    },
    ic: {
      stats: [
        { label: 'My PRs', value: '5', trend: '+2', trendDir: 'neutral' },
        { label: 'CI Runs', value: '23', trend: '+5', trendDir: 'up' },
        { label: 'Review Queue', value: '8', trend: '+3', trendDir: 'neutral' },
      ],
      payload: {
        myPRs: 5,
        reviewQueue: 8,
      },
    },
  };
  return roleData[role] || roleData.cto;
};

export const getInsights = async () => {
  const res = await fetch(`${API}/insights`);
  return res.json();
};

export const createDashboard = async (data: unknown) => {
  const res = await fetch(`${API}/dashboards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};