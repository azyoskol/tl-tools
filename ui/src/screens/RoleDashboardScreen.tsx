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

interface RoleDashboardScreenProps {
  initialRole?: string;
  onNewDashboard?: () => void;
}

export const RoleDashboardScreen: React.FC<RoleDashboardScreenProps> = ({ initialRole }) => {
  const [activeTab, setActiveTab] = useState(initialRole || 'cto');
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