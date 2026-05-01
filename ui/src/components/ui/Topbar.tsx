import React, { useState } from 'react';

interface TopbarProps { onSearch?: (q: string) => void }

export const Topbar: React.FC<TopbarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  return (
    <header style={{ height: 60, background: 'var(--glass)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', borderRadius: 8, padding: '8px 16px', width: 400 }}>
        <span style={{ color: 'var(--muted)' }}>🔍</span>
        <input value={query} onChange={e => { setQuery(e.target.value); onSearch?.(e.target.value); }} placeholder="Search metrics, teams..." style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '14px', width: '100%', outline: 'none' }} />
      </div>
      <button style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', position: 'relative' }}>
        <span style={{ fontSize: 20 }}>🔔</span>
        <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'var(--error)', borderRadius: '50%' }} />
      </button>
    </header>
  );
};