import React from 'react';

const navItems = [
  { id: 'dashboard', label: 'Overview', icon: 'home' },
  { id: 'cto', label: 'CTO Dashboard', icon: 'activity' },
  { id: 'vp', label: 'VP Dashboard', icon: 'trendingUp' },
  { id: 'tl', label: 'Team Lead', icon: 'users' },
  { id: 'devops', label: 'DevOps', icon: 'monitor' },
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
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  </nav>
);