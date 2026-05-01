import React from 'react';
export const BarChart = ({ labels, values, compare, color = '#00E5FF', compareColor = '#B44CFF', height = 140, horizontal = false, title }) => {
  const VW = 480, VH = height;
  const pl = horizontal ? 80 : 42, pr = 10, pt = 10, pb = horizontal ? 10 : 28;
  const cw = VW - pl - pr, ch = VH - pt - pb;
  const maxVal = Math.max(...values, ...(compare || []));
  const barW = horizontal ? ch / labels.length * 0.55 : cw / labels.length * 0.55;
  const gap = horizontal ? ch / labels.length : cw / labels.length;
  return (
    <div style={{ width: '100%' }}>
      {title && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{title}</div>}
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: VH, display: 'block' }}>
        {!horizontal && Array.from({ length: 4 }, (_, i) => {
          const y = pt + (i / 3) * ch;
          return <line key={i} x1={pl} y1={y} x2={pl+cw} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
        })}
        {labels.map((label, i) => {
          const v = values[i], cv = compare ? compare[i] : null;
          const ratio = v / maxVal;
          if (horizontal) {
            const y = pt + i * gap + (gap - barW) / 2;
            const bw = ratio * cw;
            return <g key={i}><rect x={pl} y={y} width={bw} height={barW} rx="3" fill={color} opacity="0.85" /><text x={pl-6} y={y+barW/2+3.5} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.55)">{label}</text><text x={pl+bw+5} y={y+barW/2+3.5} fontSize="10" fill={color}>{Math.round(v)}</text></g>;
          }
          const x = pl + i * gap + (gap - barW) / 2 - (cv ? barW * 0.6 : 0);
          const bh = ratio * ch;
          const y = pt + ch - bh;
          return <g key={i}><rect x={x} y={y} width={cv ? barW * 0.8 : barW} height={bh} rx="3" fill={color} opacity="0.85" />{cv && (<rect x={x + barW * 0.9} y={pt + ch - (cv/maxVal)*ch} width={barW * 0.8} height={(cv/maxVal)*ch} rx="3" fill={compareColor} opacity="0.6" />)}<text x={x + (cv ? barW * 0.85 : barW/2)} y={VH-7} textAnchor="middle" fontSize="9.5" fill="rgba(255,255,255,0.4)">{label}</text></g>;
        })}
        {!horizontal && <text x={pl-5} y={pt+4} textAnchor="end" fontSize="9.5" fill="rgba(255,255,255,0.3)">{maxVal >= 1000 ? `${(maxVal/1000).toFixed(0)}k` : Math.round(maxVal)}</text>}
      </svg>
    </div>
  );
};