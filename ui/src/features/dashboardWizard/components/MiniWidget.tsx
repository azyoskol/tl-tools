// src/features/dashboardWizard/components/MiniWidget.tsx
import React from 'react';
import { Icon } from '../../../components/shared/Icon';

interface WidgetMeta {
  icon: string;
  label: string;
  color: string;
}

interface MiniWidgetProps {
  id: string;
  onRemove: (id: string) => void;
}

const widgetMeta: Record<string, WidgetMeta> = {
  'dora-overview': { icon: 'zap', label: 'DORA Overview', color: '#00E5FF' },
  'deploy-freq':   { icon: 'zap', label: 'Deploy Frequency', color: '#00E5FF' },
  'lead-time':     { icon: 'clock', label: 'Lead Time', color: '#B44CFF' },
  'mttr-trend':    { icon: 'activity', label: 'MTTR Trend', color: '#FF9100' },
  'ci-pass-rate':  { icon: 'activity', label: 'CI Pass Rate', color: '#00C853' },
  'failing-builds':{ icon: 'xCircle', label: 'Failing Builds', color: '#FF1744' },
  'pr-queue':      { icon: 'gitPR', label: 'PR Queue', color: '#B44CFF' },
  'pr-cycle':      { icon: 'gitPR', label: 'PR Cycle Time', color: '#B44CFF' },
  'burndown':      { icon: 'chart', label: 'Sprint Burndown', color: '#FF9100' },
  'velocity':      { icon: 'trendingUp', label: 'Velocity', color: '#00E5FF' },
  'blocked-tasks': { icon: 'alertTri', label: 'Blocked Tasks', color: '#FF9100' },
  'team-heatmap':  { icon: 'layers', label: 'Team Heatmap', color: '#00E5FF' },
  'ai-summary':    { icon: 'sparkles', label: 'AI Summary', color: '#B44CFF' },
  'anomaly':       { icon: 'brain', label: 'Anomaly Detector', color: '#FF9100' },
};

export const MiniWidget: React.FC<MiniWidgetProps> = ({ id, onRemove }) => {
  const meta = widgetMeta[id] || { icon: 'layers', label: id, color: '#6B7A9A' };
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
      borderRadius: 9, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 9,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 7, background: `${meta.color}18`,
        border: `1px solid ${meta.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={meta.icon} size={13} color={meta.color} />
      </div>
      <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{meta.label}</div>
      <button onClick={() => onRemove(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
        <Icon name="x" size={13} />
      </button>
    </div>
  );
};