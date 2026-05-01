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