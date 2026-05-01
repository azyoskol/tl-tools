import React from 'react';

interface LeaderboardProps {
  data: { rank: number; name: string; value: string; trend?: string }[];
  color?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ data, color = '#00E5FF' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {data.map((d) => (
        <div key={d.rank} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            width: '24px', height: '24px', borderRadius: '50%',
            background: d.rank <= 3 ? color : 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 600
          }}>{d.rank}</span>
          <span style={{ flex: 1, color: '#E8EDF5' }}>{d.name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: '#6B7A9A' }}>{d.value}</span>
          {d.trend && <span style={{ color: '#00C853', fontSize: '12px' }}>{d.trend}</span>}
        </div>
      ))}
    </div>
  );
};