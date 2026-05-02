import React from 'react';
interface HeatmapProps {
  data?: number[][];
  rows?: number;
  cols?: number;
  color?: string;
  labelRows?: string[];
  labelCols?: string[];
  title?: string;
  cellSize?: number;
  gap?: number;
}
export const Heatmap: React.FC<HeatmapProps> = ({ data, rows = 7, cols = 16, color = '#00E5FF', labelRows, labelCols, title, cellSize = 14, gap = 3 }) => {
  const levels = ['rgba(255,255,255,0.04)', `${color}30`, `${color}55`, `${color}88`, `${color}bb`, color];
  return (
    <div style={{ width: '100%' }}>
      {title && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{title}</div>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        {labelRows && (
          <div style={{ display: 'flex', flexDirection: 'column', gap, paddingTop: labelCols ? 20 : 0 }}>
            {labelRows?.map((l: string, i: number) => <div key={i} style={{ height: cellSize, display: 'flex', alignItems: 'center', fontSize: 9.5, color: 'var(--muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', paddingRight: 4 }}>{l}</div>)}
          </div>
        )}
        <div>
          {labelCols && (
            <div style={{ display: 'flex', gap, marginBottom: 4 }}>
              {Array.from({ length: cols }, (_,i) => <div key={i} style={{ width: cellSize, fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textAlign: 'center', overflow: 'hidden' }}>{labelCols[i] || ''}</div>)}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap }}>
            {Array.from({ length: rows }, (_, r) => (
              <div key={r} style={{ display: 'flex', gap }}>
                {Array.from({ length: cols }, (_, c) => {
                  const val = data && data[r] ? (data[r][c] || 0) : 0;
                  const lvl = Math.min(val, 5);
                  return <div key={c} title={`${val} events`} style={{ width: cellSize, height: cellSize, borderRadius: 3, background: levels[lvl], transition: 'background 0.15s', cursor: 'default', border: lvl > 0 ? `1px solid ${color}22` : '1px solid rgba(255,255,255,0.04)' }} />;
                })}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}><span style={{ fontSize: 10, color: 'var(--muted)' }}>Less</span>{levels.map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />)}<span style={{ fontSize: 10, color: 'var(--muted)' }}>More</span></div>
        </div>
      </div>
    </div>
  );
};