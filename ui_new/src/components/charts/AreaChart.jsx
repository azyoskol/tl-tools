import React from 'react';

const bezierPath = (pts, sm = 0.16) => {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1], [cx, cy] = pts[i];
    const dx = (cx - px) * sm;
    d += ` C${(px+dx).toFixed(1)},${py.toFixed(1)} ${(cx-dx).toFixed(1)},${cy.toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)}`;
  }
  return d;
};

const scalePoints = (data, w, h, pl = 0, pr = 0, pt = 0, pb = 0) => {
  if (!data || data.length === 0) return [];
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  return data.map((v, i) => [
    pl + (i / (data.length - 1)) * (w - pl - pr),
    pt + (1 - (v - min) / range) * (h - pt - pb),
  ]);
};

export const AreaChart = ({
  data,
  compare = null,
  labels = [],
  color = 'var(--cyan)',
  compareColor = 'var(--purple)',
  height = 160,
  showGrid = true,
  showAxis = true,
  title,
  subtitle,
}) => {
  // Guard: if data is empty, show placeholder
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
        No data available
      </div>
    );
  }

  const VW = 480, VH = height;
  const pl = showAxis ? 42 : 10, pr = 10, pt = 10, pb = showAxis ? 28 : 10;
  const cw = VW - pl - pr, ch = VH - pt - pb;
  const uid = color.replace('#', '');

  const pts = scalePoints(data, cw, ch, 0, 0, 0, 0).map(([x, y]) => [x + pl, y + pt]);
  const cpts = compare
    ? scalePoints(compare, cw, ch, 0, 0, 0, 0).map(([x, y]) => [x + pl, y + pt])
    : null;

  const linePath = (ps) => bezierPath(ps);
  const areaPath = (ps) => {
    if (ps.length < 2) return '';
    return linePath(ps) + ` L${ps[ps.length-1][0].toFixed(1)},${(pt+ch).toFixed(1)} L${ps[0][0].toFixed(1)},${(pt+ch).toFixed(1)} Z`;
  };

  const yMin = Math.min(...data), yMax = Math.max(...data);
  const fmtY = (v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : Math.round(v);
  const gridCount = 4;

  return (
    <div style={{ width: '100%' }}>
      {(title || subtitle) && (
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          {title && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-head)' }}>{title}</span>}
          {subtitle && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{subtitle}</span>}
        </div>
      )}
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: VH, display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`ag-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          {cpts && (
            <linearGradient id={`ag-c-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={compareColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={compareColor} stopOpacity="0" />
            </linearGradient>
          )}
        </defs>

        {showGrid && Array.from({ length: gridCount }, (_, i) => {
          const y = pt + (i / (gridCount - 1)) * ch;
          return <line key={i} x1={pl} y1={y} x2={pl + cw} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
        })}

        {showAxis && [0,0.5,1].map((t,i) => {
          const v = yMin + t * (yMax - yMin);
          const y = pt + (1 - t) * ch;
          return (
            <text key={i} x={pl-5} y={y+3.5} textAnchor="end" fontSize="9.5" fill="rgba(255,255,255,0.3)" fontFamily="var(--font-mono)">
              {fmtY(v)}
            </text>
          );
        })}

        {cpts && pts.length >= 2 && (
          <>
            <path d={areaPath(cpts)} fill={`url(#ag-c-${uid})`} />
            <path d={linePath(cpts)} fill="none" stroke={compareColor} strokeWidth="1.5" strokeDasharray="5 3" opacity="0.75" />
          </>
        )}

        {pts.length >= 2 && (
          <>
            <path d={areaPath(pts)} fill={`url(#ag-${uid})`} />
            <path d={linePath(pts)} fill="none" stroke={color} strokeWidth="2" />
            <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3.5" fill={color} />
            <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3.5" fill={color} opacity="0.3">
              <animate attributeName="r" values="3.5;7;3.5" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="2.5s" repeatCount="indefinite" />
            </circle>
          </>
        )}

        {showAxis && labels && labels.map((l,i) => {
          const step = Math.ceil(labels.length / 7);
          if (i % step !== 0 && i !== labels.length-1) return null;
          const x = pl + (i / (labels.length-1)) * cw;
          return (
            <text key={i} x={x} y={VH-6} textAnchor="middle" fontSize="9.5" fill="rgba(255,255,255,0.3)" fontFamily="var(--font-mono)">
              {l}
            </text>
          );
        })}
      </svg>
      {cpts && (
        <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
            <div style={{ width: 18, height: 2, background: color, borderRadius: 2 }} />
            This period
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
            <div style={{ width: 18, height: 2, background: compareColor, borderRadius: 2, opacity: 0.7, borderTop: '2px dashed' }} />
            Previous
          </div>
        </div>
      )}
    </div>
  );
};