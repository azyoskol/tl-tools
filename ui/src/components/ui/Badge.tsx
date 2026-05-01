import React from 'react';

type BadgeType = 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps { type: BadgeType; children: React.ReactNode }

const colors: Record<BadgeType, string> = {
  success: '#00C853', warning: '#FF9100', error: '#FF1744', neutral: '#6B7A9A'
};

export const Badge: React.FC<BadgeProps> = ({ type, children }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
    background: `${colors[type]}20`, color: colors[type]
  }}>
    {type === 'success' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors[type] }} />}
    {children}
  </span>
);