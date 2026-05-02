import React from 'react';

type DORALevel = 'Elite' | 'High' | 'Med' | 'Low';

interface DORABadgeProps {
  level: DORALevel | string;
}

export const DORABadge = ({ level }: DORABadgeProps) => {
  const map: Record<string, [string, string]> = {
    Elite: ['#00C853', 'rgba(0,200,83,0.12)'],
    High:  ['#00E5FF', 'rgba(0,229,255,0.12)'],
    Med:   ['#FF9100', 'rgba(255,145,0,0.12)'],
    Low:   ['#FF1744', 'rgba(255,23,68,0.12)'],
  };
  const [c, bg] = map[level] ?? map['Med'];
  return (
    <span style={{
      fontSize: 10.5,
      color: c,
      background: bg,
      border: `1px solid ${c}30`,
      borderRadius: 4,
      padding: '2px 8px',
      fontFamily: 'var(--font-mono)',
    }}>
      {level}
    </span>
  );
};
