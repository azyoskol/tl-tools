import React, { useState, useEffect } from 'react';
import { Icon } from '../../components/shared/Icon';
import { DashboardRenderer } from '../../components/dashboard/DashboardRenderer';
import { createMockCTODashboard } from '../../types/mocks/dashboards';
import { createMockVPDashboard } from '../../types/mocks/dashboards';
import { createMockTLDashboard } from '../../types/mocks/dashboards';
import { createMockDevOpsDashboard } from '../../types/mocks/dashboards';
import { createMockICDashboard } from '../../types/mocks/dashboards';

const ROLES = [
  { id: 'overview', label: 'Overview', icon: 'home', navId: 'dashboard' },
  { id: 'cto',      label: 'CTO',      icon: 'trendingUp', navId: 'dash-cto' },
  { id: 'vp',       label: 'VP Eng',   icon: 'users', navId: 'dash-vp' },
  { id: 'tl',       label: 'Tech Lead',icon: 'gitPR', navId: 'dash-tl' },
  { id: 'devops',   label: 'DevOps',   icon: 'cpu', navId: 'dash-devops' },
  { id: 'ic',       label: 'My View',  icon: 'activity', navId: 'dash-ic' },
];

const mockDashboards: Record<string, ReturnType<typeof createMockCTODashboard>> = {
  cto: createMockCTODashboard(),
  vp: createMockVPDashboard(),
  tl: createMockTLDashboard(),
  devops: createMockDevOpsDashboard(),
  ic: createMockICDashboard(),
};

interface RoleDashboardScreenProps {
  initialRole?: string;
  onNewDashboard?: () => void;
  onNavigate?: (navId: string) => void;
}

export const RoleDashboardScreen: React.FC<RoleDashboardScreenProps> = ({ initialRole = 'cto', onNewDashboard, onNavigate }) => {
  const [role, setRole] = useState(initialRole);

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    const selected = ROLES.find(r => r.id === newRole);
    if (selected && onNavigate) {
      onNavigate(selected.navId);
    }
  };

  const renderRole = () => {
    const dashboard = mockDashboards[role];
    if (!dashboard) return null;
    return <DashboardRenderer dashboard={dashboard} />;
  };

  const TabBar = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '10px 24px 0',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      {ROLES.map(r => (
        <button
          key={r.id}
          onClick={() => handleRoleChange(r.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderBottom: role === r.id ? '2px solid var(--cyan)' : '2px solid transparent',
            color: role === r.id ? 'var(--cyan)' : 'var(--muted2)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: role === r.id ? 600 : 400,
            transition: 'all 0.15s',
            marginBottom: -1,
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { if (role !== r.id) e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { if (role !== r.id) e.currentTarget.style.color = 'var(--muted2)'; }}
        >
          <Icon name={r.icon} size={13} color="currentColor" />
          {r.label}
        </button>
      ))}
      <div style={{ flex: 1 }} />
      {onNewDashboard && (
        <button
          onClick={onNewDashboard}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 8,
            cursor: 'pointer',
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.2)',
            color: 'var(--cyan)',
            fontSize: 12.5,
            fontWeight: 500,
            marginBottom: 6,
          }}
        >
          <Icon name="plus" size={13} /> New Dashboard
        </button>
      )}
    </div>
  );

  if (role === 'overview') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TabBar />
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          <div style={{ color: 'var(--muted)', textAlign: 'center', marginTop: 40 }}>
            Switch to a role tab to see your dashboard
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TabBar />
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        {renderRole()}
      </div>
    </div>
  );
};