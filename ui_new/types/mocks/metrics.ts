import type { MetricId, MetricTimeSeries, DORAResponse } from '../metrics';

export const createMockMetricTimeSeries = (metricId: MetricId): MetricTimeSeries => ({
  values: [10, 12, 14, 11, 13, 15, 12],
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  unit: metricId.includes('freq') ? 'deploys/day' : 'hours',
});

export const createMockDORAResponse = (): DORAResponse => ({
  deployFrequency: {
    id: 'deploy-freq',
    label: 'Deploy Frequency',
    currentValue: '12/day',
    currentValueRaw: 12,
    delta: '+2 vs last week',
    level: 'Elite',
    benchmarkNote: 'Industry elite: >10/day',
    timeSeries: createMockMetricTimeSeries('deploy-freq'),
  },
  leadTime: {
    id: 'lead-time',
    label: 'Lead Time',
    currentValue: '2.1h',
    currentValueRaw: 2.1,
    delta: '-0.3h vs last week',
    level: 'High',
    benchmarkNote: 'Industry high: <4h',
    timeSeries: createMockMetricTimeSeries('lead-time'),
  },
  changeFailureRate: {
    id: 'cfr',
    label: 'Change Failure Rate',
    currentValue: '5%',
    currentValueRaw: 5,
    delta: '+1% vs last week',
    level: 'Med',
    benchmarkNote: 'Industry med: <10%',
    timeSeries: createMockMetricTimeSeries('cfr'),
  },
  mttr: {
    id: 'mttr',
    label: 'MTTR',
    currentValue: '45m',
    currentValueRaw: 45,
    delta: '-10m vs last week',
    level: 'High',
    benchmarkNote: 'Industry high: <1h',
    timeSeries: createMockMetricTimeSeries('mttr'),
  },
});
