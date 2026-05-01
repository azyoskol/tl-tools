import React from 'react';
import { Icon } from './Icon';

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
}

interface NavItem {
  id: string;
  icon: string;
  label: string;
  accent?: boolean;
  badge?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const sections: NavSection[] = [
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
  const [pinned, setPinned] = React.useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('metraly-pinned') || '["cto","devops"]'); } catch { return ['cto','devops']; }
  });
  const [hoveredPin, setHoveredPin] = React.useState<string | null>(null);
  const [hoveredBadge, setHoveredBadge] = React.useState(false);

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinned(prev => {
      const next = prev.includes(id) ? prev.filter((x: string) => x !== id) : [...prev, id];
      localStorage.setItem('metraly-pinned', JSON.stringify(next));
      return next;
    });
  };

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      flexShrink: 0,
      height: '100%',
      background: 'rgba(11,15,25,0.95)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      backdropFilter: 'blur(20px)',
      position: 'relative',
      zIndex: 10,
    }}>
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--grad)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name="activity" size={16} color="#fff"/>
          </div>
          <span style={{
            fontFamily: 'var(--font-head)',
            fontWeight: 700,
            fontSize: 17,
            background: 'var(--grad)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.3px',
          }}>Metraly</span>
        </div>
        <div style={{
          marginTop: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(0,200,83,0.1)',
          border: '1px solid rgba(0,200,83,0.2)',
          borderRadius: 20,
          padding: '4px 10px',
          width: 'fit-content',
        }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--success)',
            animation: 'pulseDot 2s ease infinite',
          }}/>
          <span style={{ fontSize: 11, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>All systems nominal</span>
        </div>
      </div>

      <nav style={{ flex: 1, overflow: 'auto', padding: '12px 10px' }}>
        {pinned.length > 0 && (() => {
          const allItems = sections.flatMap(s => s.items);
          const pinnedItems = pinned.map((id: string) => allItems.find(it => it.id === id)).filter((item): item is NavItem => item !== undefined);
          return (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase', padding: '0 8px', marginBottom: 4 }}>Pinned</div>
              {pinnedItems.map(item => {
                const isActive = active === item.id;
                return (
                  <button key={item.id} onClick={() => onNavigate(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '7px 10px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      marginBottom: 2,
                      background: isActive ? 'rgba(0,229,255,0.1)' : 'transparent',
                      color: isActive ? 'var(--cyan)' : 'var(--muted2)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 13,
                      fontWeight: isActive ? 500 : 400,
                      transition: 'all 0.15s',
                      textAlign: 'left',
                      position: 'relative',
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='var(--text)'; }}}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--muted2)'; }}}
                  >
                    {isActive && <div style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:3, height:14, borderRadius:2, background:'var(--cyan)' }}/>}
                    <span style={{ fontSize: 12 }}>📌</span>
                    {item.label}
                    <button onClick={e => togglePin(item.id, e)} title="Unpin"
                      style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'rgba(0,229,255,0.5)', fontSize:12, padding:'0 2px', display:'flex', alignItems:'center' }}>
                      ×
                    </button>
                  </button>
                );
              })}
              <div style={{ height: 1, background: 'var(--border)', margin: '8px 8px 0' }}/>
            </div>
          );
        })()}

        {sections.map(sec => (
          <div key={sec.label} style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'var(--muted)',
              textTransform: 'uppercase',
              padding: '0 8px',
              marginBottom: 4,
            }}>{sec.label}</div>
            {sec.items.map(item => {
              const isActive = active === item.id;
              return (
                <button key={item.id} onClick={() => onNavigate(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '8px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    marginBottom: 2,
                    background: isActive ? 'rgba(0,229,255,0.1)' : (item.accent ? 'rgba(0,229,255,0.06)' : 'transparent'),
                    color: isActive ? 'var(--cyan)' : (item.accent ? 'var(--cyan)' : 'var(--muted2)'),
                    fontFamily: 'var(--font-body)',
                    fontSize: 13.5,
                    fontWeight: isActive || item.accent ? 500 : 400,
                    transition: 'all 0.18s ease',
                    textAlign: 'left',
                    position: 'relative',
                    border: (item.accent && !isActive) ? '1px dashed rgba(0,229,255,0.2)' : '1px solid transparent',
                  }}
                  onMouseEnter={e => { setHoveredPin(item.id); if (!isActive) { e.currentTarget.style.background='rgba(0,229,255,0.1)'; e.currentTarget.style.color='var(--cyan)'; }}}
                  onMouseLeave={e => { setHoveredPin(null); if (!isActive) { e.currentTarget.style.background=(item.accent ? 'rgba(0,229,255,0.06)' : 'transparent'); e.currentTarget.style.color=(item.accent ? 'var(--cyan)' : 'var(--muted2)'); }}}
                >
                  {isActive && <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 16,
                    borderRadius: 2,
                    background: 'var(--cyan)',
                  }}/>}
                  <Icon name={item.icon as any} size={15} color={isActive ? 'var(--cyan)' : 'currentColor'}/>
                  {item.label}
                  {sec.label === 'Dashboards' && item.id !== 'wizard' && hoveredPin === item.id && (
                    <button onClick={e => togglePin(item.id, e)} title={pinned.includes(item.id) ? 'Unpin' : 'Pin to top'}
                      style={{
                        marginLeft: 'auto',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0 2px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color 0.15s',
                      }}>
                      <Icon name={pinned.includes(item.id) ? 'star' : 'star'} size={12} color={pinned.includes(item.id) ? 'var(--cyan)' : 'var(--muted)'} />
                    </button>
                  )}
                  {item.badge && (
                    <div 
                      onMouseEnter={() => setHoveredBadge(true)}
                      onMouseLeave={() => setHoveredBadge(false)}
                      style={{
                        marginLeft: 'auto',
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        background: hoveredBadge ? 'rgba(180,76,255,0.25)' : 'rgba(180,76,255,0.15)',
                        color: hoveredBadge ? 'var(--cyan)' : 'var(--purple)',
                        border: hoveredBadge ? '1px solid var(--cyan)' : '1px solid rgba(180,76,255,0.25)',
                        borderRadius: 4,
                        padding: '1px 5px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}>{item.badge}</div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00E5FF22, #B44CFF22)',
          border: '1px solid var(--border2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--muted2)',
        }}>JD</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Jamie Dev</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Admin</div>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }} onClick={() => onNavigate('settings')}>
          <Icon name="settings" size={14}/>
        </button>
      </div>
    </aside>
  );
};