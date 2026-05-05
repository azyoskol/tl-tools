// charts.jsx — Shared SVG chart primitives for Metraly
// Exports: AreaChart, BarChart, Heatmap, Gauge, Leaderboard, MiniSparkline

const { useState, useRef, useEffect } = React;

// ─── Seed-based pseudo-random (deterministic, no flickering) ─────────────────
const seededRand = (seed) => {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
};

const makeTimeSeries = (n, base, variance, trend = 0, seed = 42) => {
  const r = seededRand(seed);
  return Array.from({ length: n }, (_, i) =>
    Math.max(0, base + trend * i + (r() - 0.5) * variance * 2)
  );
};

const makeHeatData = (rows, cols, density = 0.4, seed = 77) => {
  const r = seededRand(seed);
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => r() < density ? Math.floor(r() * 5) + 1 : 0)
  );
};

// ─── Smooth bezier path ──────────────────────────────────────────────────────
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

const scalePoints = (data, w, h, pl = 8, pr = 8, pt = 8, pb = 8) => {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  return data.map((v, i) => [
    pl + (i / (data.length - 1)) * (w - pl - pr),
    pt + (1 - (v - min) / range) * (h - pt - pb),
  ]);
};

// ─── AreaChart ───────────────────────────────────────────────────────────────
const AreaChart = ({
  data, compare, labels, color = '#00E5FF', compareColor = '#B44CFF',
  height = 160, showGrid = true, showAxis = true, title, subtitle,
}) => {
  const VW = 480, VH = height;
  const pl = showAxis ? 42 : 10, pr = 10, pt = 10, pb = showAxis ? 28 : 10;
  const cw = VW - pl - pr, ch = VH - pt - pb;
  const uid = color.replace('#', '');

  const pts = scalePoints(data, cw, ch, 0, 0, 0, 0).map(([x, y]) => [x + pl, y + pt]);
  const cpts = compare ? scalePoints(compare, cw, ch, 0, 0, 0, 0).map(([x, y]) => [x + pl, y + pt]) : null;

  const linePath = (ps) => bezierPath(ps);
  const areaPath = (ps) => linePath(ps) + ` L${ps[ps.length-1][0].toFixed(1)},${(pt+ch).toFixed(1)} L${ps[0][0].toFixed(1)},${(pt+ch).toFixed(1)} Z`;

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

        {/* Grid lines */}
        {showGrid && Array.from({ length: gridCount }, (_, i) => {
          const y = pt + (i / (gridCount - 1)) * ch;
          return <line key={i} x1={pl} y1={y} x2={pl + cw} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
        })}

        {/* Y axis */}
        {showAxis && [0, 0.5, 1].map((t, i) => {
          const v = yMin + t * (yMax - yMin);
          const y = pt + (1 - t) * ch;
          return (
            <text key={i} x={pl - 5} y={y + 3.5} textAnchor="end"
              fontSize="9.5" fill="rgba(255,255,255,0.3)" fontFamily="var(--font-mono)">
              {fmtY(v)}
            </text>
          );
        })}

        {/* Compare area + line */}
        {cpts && <>
          <path d={areaPath(cpts)} fill={`url(#ag-c-${uid})`} />
          <path d={linePath(cpts)} fill="none" stroke={compareColor} strokeWidth="1.5" strokeDasharray="5 3" opacity="0.75" />
        </>}

        {/* Main area + line */}
        <path d={areaPath(pts)} fill={`url(#ag-${uid})`} />
        <path d={linePath(pts)} fill="none" stroke={color} strokeWidth="2" />

        {/* Dot at last point */}
        <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3.5" fill={color} />
        <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3.5" fill={color} opacity="0.3">
          <animate attributeName="r" values="3.5;7;3.5" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="2.5s" repeatCount="indefinite" />
        </circle>

        {/* X axis labels */}
        {showAxis && labels && labels.map((l, i) => {
          const step = Math.ceil(labels.length / 7);
          if (i % step !== 0 && i !== labels.length - 1) return null;
          const x = pl + (i / (labels.length - 1)) * cw;
          return (
            <text key={i} x={x} y={VH - 6} textAnchor="middle"
              fontSize="9.5" fill="rgba(255,255,255,0.3)" fontFamily="var(--font-mono)">{l}</text>
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

// ─── BarChart ────────────────────────────────────────────────────────────────
const BarChart = ({
  labels, values, compare, color = '#00E5FF', compareColor = '#B44CFF',
  height = 140, horizontal = false, title,
}) => {
  const VW = 480, VH = height;
  const pl = horizontal ? 80 : 42, pr = 10, pt = 10, pb = horizontal ? 10 : 28;
  const cw = VW - pl - pr, ch = VH - pt - pb;
  const maxVal = Math.max(...values, ...(compare || []));
  const barW = horizontal ? ch / labels.length * 0.55 : cw / labels.length * 0.55;
  const gap = horizontal ? ch / labels.length : cw / labels.length;

  return (
    <div style={{ width: '100%' }}>
      {title && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-head)', marginBottom: 8 }}>{title}</div>}
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: VH, display: 'block' }}>
        {/* Grid */}
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
            return (
              <g key={i}>
                <rect x={pl} y={y} width={bw} height={barW} rx="3"
                  fill={color} opacity="0.85" />
                <text x={pl - 6} y={y + barW / 2 + 3.5} textAnchor="end"
                  fontSize="10" fill="rgba(255,255,255,0.55)" fontFamily="var(--font-body)">{label}</text>
                <text x={pl + bw + 5} y={y + barW / 2 + 3.5}
                  fontSize="10" fill={color} fontFamily="var(--font-mono)">{Math.round(v)}</text>
              </g>
            );
          }

          const x = pl + i * gap + (gap - barW) / 2 - (cv ? barW * 0.6 : 0);
          const bh = ratio * ch;
          const y = pt + ch - bh;

          return (
            <g key={i}>
              <rect x={x} y={y} width={cv ? barW * 0.8 : barW} height={bh} rx="3"
                fill={color} opacity="0.85" />
              {cv && (() => {
                const cr = cv / maxVal;
                const cbh = cr * ch;
                return <rect x={x + barW * 0.9} y={pt + ch - cbh} width={barW * 0.8} height={cbh} rx="3" fill={compareColor} opacity="0.6" />;
              })()}
              <text x={x + (cv ? barW * 0.85 : barW / 2)} y={VH - 7} textAnchor="middle"
                fontSize="9.5" fill="rgba(255,255,255,0.4)" fontFamily="var(--font-mono)">{label}</text>
            </g>
          );
        })}

        {/* Y-axis label */}
        {!horizontal && (() => {
          const maxV = maxVal;
          return (
            <text x={pl - 5} y={pt + 4} textAnchor="end" fontSize="9.5"
              fill="rgba(255,255,255,0.3)" fontFamily="var(--font-mono)">
              {maxV >= 1000 ? `${(maxV/1000).toFixed(0)}k` : Math.round(maxV)}
            </text>
          );
        })()}
      </svg>
    </div>
  );
};

// ─── Heatmap ─────────────────────────────────────────────────────────────────
const Heatmap = ({ data, rows = 7, cols = 16, color = '#00E5FF', labelRows, labelCols, title, cellSize = 14, gap = 3 }) => {
  const levels = ['rgba(255,255,255,0.04)', `${color}30`, `${color}55`, `${color}88`, `${color}bb`, color];

  return (
    <div style={{ width: '100%' }}>
      {title && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-head)', marginBottom: 8 }}>{title}</div>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        {labelRows && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: gap, paddingTop: labelCols ? 20 : 0 }}>
            {labelRows.map((l, i) => (
              <div key={i} style={{ height: cellSize, display: 'flex', alignItems: 'center', fontSize: 9.5, color: 'var(--muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', paddingRight: 4 }}>{l}</div>
            ))}
          </div>
        )}
        <div>
          {labelCols && (
            <div style={{ display: 'flex', gap, marginBottom: 4 }}>
              {Array.from({ length: cols }, (_, i) => (
                <div key={i} style={{ width: cellSize, fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textAlign: 'center', overflow: 'hidden' }}>
                  {labelCols[i] || ''}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap }}>
            {Array.from({ length: rows }, (_, r) => (
              <div key={r} style={{ display: 'flex', gap }}>
                {Array.from({ length: cols }, (_, c) => {
                  const val = data && data[r] ? (data[r][c] || 0) : 0;
                  const lvl = Math.min(val, 5);
                  return (
                    <div key={c} title={`${val} events`} style={{
                      width: cellSize, height: cellSize, borderRadius: 3,
                      background: levels[lvl],
                      transition: 'background 0.15s',
                      cursor: 'default',
                      border: lvl > 0 ? `1px solid ${color}22` : '1px solid rgba(255,255,255,0.04)',
                    }} />
                  );
                })}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>Less</span>
            {levels.map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
            ))}
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Gauge ───────────────────────────────────────────────────────────────────
const Gauge = ({ value = 0.72, label = 'Score', size = 140 }) => {
  // Semi-circle: center (70,64), R=52. Endpoints at (18,64) and (122,64).
  // Top of arc centerline: y=12. strokeWidth=10 → stroke top y=7. viewBox starts at 0 → 7px margin ✓
  const R = 52, cx = 70, cy = 64;
  const angle = Math.PI + value * Math.PI;
  const x2 = cx + R * Math.cos(angle);
  const y2 = cy + R * Math.sin(angle);
  // Always 0: arc spans at most 180° so it's never a "large arc"
  const largeArc = 0;

  const trackPath = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`;
  const fillPath  = `M ${(cx - R).toFixed(1)} ${cy} A ${R} ${R} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;

  return (
    <svg viewBox="0 0 140 88" style={{ width: size, height: Math.round(size * 0.63), display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="gauge-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#B44CFF" />
        </linearGradient>
      </defs>
      <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" strokeLinecap="round" />
      <path d={fillPath}  fill="none" stroke="url(#gauge-g)"          strokeWidth="10" strokeLinecap="round" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="26" fontWeight="700"
        fill="var(--text)" fontFamily="var(--font-head)">{Math.round(value * 100)}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11"
        fill="var(--muted)" fontFamily="var(--font-body)">{label}</text>
    </svg>
  );
};

// ─── Leaderboard ─────────────────────────────────────────────────────────────
const Leaderboard = ({ items, color = '#00E5FF', unit = '', title }) => {
  const max = Math.max(...items.map(i => i.value));
  return (
    <div style={{ width: '100%' }}>
      {title && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-head)', marginBottom: 10 }}>{title}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 18, fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textAlign: 'right', flexShrink: 0 }}>
              {i + 1}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text)', width: 90, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.name}
            </div>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                width: `${(item.value / max) * 100}%`,
                background: i === 0 ? `linear-gradient(90deg, ${color}, #B44CFF)` : color,
                opacity: 0.7 + (1 - i / items.length) * 0.3,
                transition: 'width 0.6s ease',
              }} />
            </div>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: i === 0 ? color : 'var(--muted2)', width: 48, textAlign: 'right', flexShrink: 0 }}>
              {item.value}{unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── MiniSparkline (kept for compact cards) ──────────────────────────────────
const MiniSparkline = ({ data, color = '#00E5FF', height = 36 }) => {
  const VW = 200, VH = height;
  const pts = scalePoints(data, VW, VH, 2, 2, 2, 2);
  const linePts = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const areaPts = `0,${VH} ${linePts} ${VW},${VH}`;
  const uid = `sp-${color.replace('#', '')}-${Math.round(Math.random()*9999)}`;
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: VH, display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill={`url(#${uid})`} />
      <polyline points={linePts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ─── DataTable ───────────────────────────────────────────────────────────────
const DataTable = ({ columns, rows, title, maxRows = 5 }) => (
  <div style={{ width: '100%' }}>
    {title && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-head)', marginBottom: 10 }}>{title}</div>}
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th key={i} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '0 0 8px', fontSize: 11, fontWeight: 500, color: 'var(--muted)', fontFamily: 'var(--font-body)', borderBottom: '1px solid var(--border)' }}>
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, maxRows).map((row, ri) => (
          <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {row.map((cell, ci) => (
              <td key={ci} style={{ padding: '8px 0', textAlign: ci === 0 ? 'left' : 'right', color: ci === 0 ? 'var(--text)' : 'var(--muted2)', fontFamily: ci > 0 ? 'var(--font-mono)' : 'var(--font-body)', fontSize: ci > 0 ? 12 : 12.5 }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── Export ───────────────────────────────────────────────────────────────────
Object.assign(window, {
  AreaChart, BarChart, Heatmap, Gauge, Leaderboard, MiniSparkline, DataTable,
  makeTimeSeries, makeHeatData, seededRand,
});
