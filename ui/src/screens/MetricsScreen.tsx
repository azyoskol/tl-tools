import React, { useState } from 'react';
import { Widget } from '../components/ui/Widget';
import { AreaChart } from '../components/charts/AreaChart';
import { Icon } from '../components/ui/Icon';

type TreeIcon = 'zap' | 'activity' | 'gitPR' | 'users' | 'layers';

interface MetricChild { id: string; label: string; unit: string; color: string; }
interface MetricGroup { id: string; label: string; icon: TreeIcon; expanded?: boolean; children: MetricChild[]; }

const METRIC_TREE: MetricGroup[] = [
  {
    id: 'dora', label: 'DORA Metrics', icon: 'zap', expanded: true,
    children: [
      { id: 'deploy-freq', label: 'Deployment Frequency', unit: 'deploys/day', color: '#00E5FF' },
      { id: 'lead-time', label: 'Lead Time for Changes', unit: 'hours', color: '#B44CFF' },
      { id: 'cfr', label: 'Change Failure Rate', unit: '%', color: '#FF9100' },
      { id: 'mttr', label: 'MTTR', unit: 'minutes', color: '#00C853' },
    ],
  },
  {
    id: 'ci', label: 'CI / CD', icon: 'activity',
    children: [
      { id: 'ci-pass', label: 'Build Success Rate', unit: '%', color: '#00C853' },
      { id: 'ci-duration', label: 'Build Duration', unit: 'min', color: '#00E5FF' },
      { id: 'ci-queue', label: 'Pipeline Queue Time', unit: 'sec', color: '#FF9100' },
    ],
  },
  {
    id: 'pr', label: 'Pull Requests', icon: 'gitPR',
    children: [
      { id: 'pr-cycle', label: 'PR Cycle Time', unit: 'hours', color: '#B44CFF' },
      { id: 'pr-review', label: 'Review Time', unit: 'hours', color: '#00E5FF' },
      { id: 'pr-merge', label: 'Merge Rate', unit: '%', color: '#00C853' },
    ],
  },
  {
    id: 'teams', label: 'Teams', icon: 'users',
    children: [
      { id: 'velocity', label: 'Sprint Velocity', unit: 'pts', color: '#00E5FF' },
      { id: 'throughput', label: 'Throughput', unit: 'PRs/wk', color: '#B44CFF' },
    ],
  },
];

const METRIC_DATA: Record<string, number[]> = {
  'deploy-freq': [3.5, 4.2, 3.8, 4.5, 4.0, 4.8, 4.2, 3.9, 4.5, 5.0, 4.3, 4.1, 4.6, 4.2, 3.8, 4.4, 4.7, 4.3, 4.0, 4.5, 4.8, 4.2, 4.6, 4.4, 4.1, 4.3, 4.7, 4.5, 4.2, 4.4],
  'lead-time': [42, 38, 35, 40, 36, 32, 38, 35, 30, 28, 32, 35, 38, 36, 34, 30, 28, 32, 35, 38, 40, 36, 34, 32, 30, 35, 38, 40, 36, 34],
  'cfr': [5, 4.5, 4, 3.5, 4, 3.2, 3, 3.5, 3.2, 3, 2.8, 3, 3.2, 3.5, 3, 2.8, 3.2, 3, 2.8, 3, 3.2, 3.5, 3, 2.8, 3.2, 3, 2.8, 3, 3.2, 3],
  'mttr': [25, 22, 20, 18, 20, 18, 16, 18, 20, 18, 16, 15, 18, 20, 18, 16, 15, 18, 20, 18, 16, 15, 18, 20, 18, 16, 15, 18, 20, 18],
  'ci-pass': [85, 87, 88, 86, 89, 90, 88, 87, 89, 91, 90, 89, 88, 90, 92, 91, 90, 89, 91, 92, 90, 89, 91, 92, 90, 89, 91, 92, 90, 89],
  'ci-duration': [5.5, 5.2, 5, 4.8, 5, 4.8, 4.5, 4.8, 5, 4.8, 4.5, 4.6, 4.8, 5, 4.8, 4.5, 4.6, 4.8, 5, 4.8, 4.5, 4.6, 4.8, 5, 4.8, 4.5, 4.6, 4.8, 5, 4.8],
  'ci-queue': [40, 38, 35, 32, 35, 30, 28, 30, 32, 28, 25, 28, 30, 28, 25, 28, 30, 28, 25, 28, 30, 28, 25, 28, 30, 28, 25, 28, 30, 28],
  'pr-cycle': [24, 22, 20, 22, 20, 18, 20, 22, 20, 18, 16, 18, 20, 22, 20, 18, 16, 18, 20, 22, 20, 18, 16, 18, 20, 22, 20, 18, 16, 18],
  'pr-review': [16, 14, 12, 14, 12, 10, 12, 14, 12, 10, 8, 10, 12, 14, 12, 10, 8, 10, 12, 14, 12, 10, 8, 10, 12, 14, 12, 10, 8, 10],
  'pr-merge': [80, 82, 84, 82, 84, 86, 84, 82, 84, 86, 88, 86, 84, 86, 88, 86, 84, 86, 88, 86, 84, 86, 88, 86, 84, 86, 88, 86, 84, 86],
  'velocity': [65, 68, 70, 72, 70, 68, 72, 75, 72, 70, 75, 78, 75, 72, 78, 80, 78, 75, 72, 75, 78, 80, 78, 75, 72, 75, 78, 80, 78, 75],
  'throughput': [7, 7.5, 8, 7.5, 8, 8.5, 8, 7.5, 8, 8.5, 9, 8.5, 8, 8.5, 9, 8.5, 8, 8.5, 9, 8.5, 8, 8.5, 9, 8.5, 8, 8.5, 9, 8.5, 8, 8.5],
};

const DORA_CARDS: Array<{ id: string; label: string; value: string; delta: string; good: boolean; level: string; color: string; icon: 'zap' | 'clock' | 'alertTri' | 'activity'; note: string }> = [
  { id: 'deploy-freq', label: 'Deployment Frequency', value: '4.2/day', delta: '+0.8', good: true, level: 'Elite', color: '#00E5FF', icon: 'zap', note: 'On-demand (multiple/day)' },
  { id: 'lead-time', label: 'Lead Time for Changes', value: '38h', delta: '−6h', good: true, level: 'High', color: '#B44CFF', icon: 'clock', note: '1 day – 1 week range' },
  { id: 'cfr', label: 'Change Failure Rate', value: '3.2%', delta: '−1.1%', good: true, level: 'Elite', color: '#FF9100', icon: 'alertTri', note: '0–15% is Elite' },
  { id: 'mttr', label: 'MTTR', value: '18 min', delta: '−6 min', good: true, level: 'Elite', color: '#00C853', icon: 'activity', note: 'Less than 1 hour = Elite' },
];

const findMetric = (id: string): any => {
  for (const group of METRIC_TREE) {
    for (const child of group.children || []) {
      if (child.id === id) return child;
    }
  }
  return null;
};

const DORALevel = ({ level }: { level: string }) => {
  const map: Record<string, [string, string]> = {
    Elite: ['#00C853', 'rgba(0,200,83,0.12)'],
    High: ['#00E5FF', 'rgba(0,229,255,0.12)'],
    Med: ['#FF9100', 'rgba(255,145,0,0.12)'],
    Low: ['#FF1744', 'rgba(255,23,68,0.12)'],
  };
  const [c, bg] = map[level] || map['Med'];
  return (
    <span style={{ fontSize: 10.5, color: c, background: bg, border: `1px solid ${c}30`, borderRadius: 4, padding: '2px 8px', fontFamily: 'var(--font-mono)' }}>
      {level}
    </span>
  );
};

export const MetricsScreen: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState('deploy-freq');
  const [expandedGroups, setExpandedGroups] = useState(['dora', 'ci', 'pr', 'teams']);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const metric = findMetric(selectedMetric);
  const data = METRIC_DATA[selectedMetric] || [];

  return (
    <div className="fade-up-3" style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      {/* Left sidebar */}
      <div style={{ width: 240, borderRight: '1px solid var(--border)', padding: '16px 12px', overflow: 'auto' }}>
        {METRIC_TREE.map((group) => (
          <div key={group.id} style={{ marginBottom: 16 }}>
            <div
              onClick={() => toggleGroup(group.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px',
                cursor: 'pointer', borderRadius: 6, transition: 'background 0.12s',
                color: 'var(--muted2)', fontSize: 12.5, fontWeight: 500,
              }}
            >
              <Icon name={group.icon || 'layers'} size={13} color="var(--muted)" />
              <span style={{ flex: 1 }}>{group.label}</span>
              <div style={{ transform: expandedGroups.includes(group.id) ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>
                <Icon name="chevronDown" size={12} color="var(--muted)" />
              </div>
            </div>
            {expandedGroups.includes(group.id) && group.children.map(child => (
              <div
                key={child.id}
                onClick={() => setSelectedMetric(child.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px 6px 26px',
                  cursor: 'pointer', borderRadius: 6, transition: 'all 0.12s',
                  background: selectedMetric === child.id ? `${child.color}15` : 'transparent',
                  color: selectedMetric === child.id ? child.color : 'var(--muted2)',
                  fontSize: 12.5, borderLeft: selectedMetric === child.id ? `2px solid ${child.color}` : '2px solid transparent',
                  marginLeft: 8,
                }}
              >
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: child.color, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{child.label}</span>
                <span style={{ fontSize: 10, opacity: 0.5, fontFamily: 'var(--font-mono)' }}>{child.unit}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        <h1 style={{ fontSize: 28, marginBottom: 24 }}>Metrics Explorer</h1>

        {/* DORA Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {DORA_CARDS.map((card) => {
            const isSelected = selectedMetric === card.id;
            return (
              <div
                key={card.id}
                onClick={() => setSelectedMetric(card.id)}
                style={{
                  background: isSelected ? 'var(--glass2)' : 'var(--glass)',
                  border: isSelected ? `1px solid ${card.color}55` : '1px solid var(--border)',
                  borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                  boxShadow: isSelected ? `0 0 16px ${card.color}18` : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <Icon name={card.icon} size={14} color={card.color} />
                  <DORALevel level={card.level} />
                </div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{card.value}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>{card.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: card.good ? '#00C853' : '#FF1744', fontFamily: 'var(--font-mono)' }}>{card.delta}</span>
                  <span style={{ fontSize: 10, color: 'var(--muted)', opacity: 0.7 }}>{card.note}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart */}
        {metric && (
          <Widget>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{metric.label}</h3>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{metric.unit}</span>
            </div>
            <AreaChart data={data.map((v, i) => ({ date: `Day ${i+1}`, value: v }))} width={800} height={300} color={metric.color} />
          </Widget>
        )}
      </div>
    </div>
  );
};