import React from 'react';

export const Leaderboard = ({ items, color = '#00E5FF', unit = '', title }) => {
  const max = Math.max(...items.map(i => i.value));
  return (
    <div style={{ width: '100%' }}>
      {title && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-head)', marginBottom: 10 }}>{title}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 18, fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text)', width: 90, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, width: `${(item.value / max) * 100}%`, background: i === 0 ? `linear-gradient(90deg, ${color}, #B44CFF)` : color, opacity: 0.7 + (1 - i / items.length) * 0.3, transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: i === 0 ? color : 'var(--muted2)', width: 48, textAlign: 'right', flexShrink: 0 }}>{item.value}{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
};