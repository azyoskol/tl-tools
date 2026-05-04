// src/features/dashboardWizard/components/WizardSettings.tsx
import React from 'react';
import { Icon } from '../../../components/shared/Icon';

export interface WizardSettingsProps {
  name: string;
  desc: string;
  timeRange: string;
  team: string;
  onNameChange: (name: string) => void;
  onDescChange: (desc: string) => void;
  onTimeRangeChange: (range: string) => void;
  onTeamChange: (team: string) => void;
  onDelete: () => void;
}

export const WizardSettings: React.FC<WizardSettingsProps> = ({
  name,
  desc,
  timeRange,
  team,
  onNameChange,
  onDescChange,
  onTimeRangeChange,
  onTeamChange,
  onDelete,
}) => {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Dashboard settings</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Name it, configure defaults, and arrange widgets.</div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Dashboard name *</label>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Backend Team Overview"
          style={{
            width: '100%',
            background: 'var(--glass)',
            border: '1px solid var(--border)',
            borderRadius: 9,
            padding: '9px 12px',
            color: 'var(--text)',
            fontSize: 13.5,
            outline: 'none',
          }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Description</label>
        <input
          value={desc}
          onChange={(e) => onDescChange(e.target.value)}
          placeholder="Optional — visible to teammates"
          style={{
            width: '100%',
            background: 'var(--glass)',
            border: '1px solid var(--border)',
            borderRadius: 9,
            padding: '9px 12px',
            color: 'var(--text)',
            fontSize: 13.5,
            outline: 'none',
          }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Default time range</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {['7d', '14d', '30d', '90d'].map((t) => (
            <button
              key={t}
              onClick={() => onTimeRangeChange(t)}
              style={{
                padding: '6px 14px',
                borderRadius: 7,
                cursor: 'pointer',
                fontSize: 13,
                border: timeRange === t ? '1px solid rgba(0,229,255,0.4)' : '1px solid var(--border)',
                background: timeRange === t ? 'rgba(0,229,255,0.1)' : 'transparent',
                color: timeRange === t ? 'var(--cyan)' : 'var(--muted2)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Team scope</label>
        <select
          value={team}
          onChange={(e) => onTeamChange(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--glass)',
            border: '1px solid var(--border)',
            borderRadius: 9,
            padding: '9px 12px',
            color: 'var(--text)',
            fontSize: 13.5,
            cursor: 'pointer',
          }}
        >
          {['All teams', 'Platform', 'Backend', 'Frontend', 'Mobile', 'Data'].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,82,82,0.9)', marginBottom: 8, fontWeight: 600 }}>Danger Zone</div>
        <button
          onClick={onDelete}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            border: '1px solid rgba(255,82,82,0.3)',
            background: 'rgba(255,82,82,0.1)',
            color: '#FF5252',
          }}
        >
          <Icon name="trash" size={14} />
          Delete Dashboard
        </button>
      </div>
    </div>
  );
};