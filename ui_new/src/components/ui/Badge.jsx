import React from 'react';
export const Badge = ({ status }) => {
  const map = {
    'On track': ['#00C853', 'rgba(0,200,83,0.12)'],
    'At risk': ['#FF9100', 'rgba(255,145,0,0.12)'],
    'Blocked': ['#FF1744', 'rgba(255,23,68,0.12)'],
    'Done': ['#00C853', 'rgba(0,200,83,0.1)'],
    'Open': ['#00E5FF', 'rgba(0,229,255,0.1)'],
  };
  const [c, bg] = map[status] || ['var(--muted)', 'rgba(107,122,154,0.1)'];
  return <span style={{ fontSize: 10.5, color: c, background: bg, border: `1px solid ${c}30`, borderRadius: 4, padding: '2px 7px', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{status}</span>;
};