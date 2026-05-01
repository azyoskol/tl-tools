import React from 'react';

interface HeatmapProps {
  data?: number[][];
  rows?: number;
  cols?: number;
  labelRows?: string[];
  labelCols?: string[];
  color?: string;
  cellSize?: number;
  gap?: number;
}

export const Heatmap: React.FC<HeatmapProps> = ({ 
  data = [], 
  rows = 5, 
  cols = 14, 
  labelRows = [], 
  labelCols = [],
  color = '#00E5FF',
  cellSize = 18,
  gap = 4
}) => {
  const max = data.flat ? Math.max(...data.flat()) : 0;
  
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap, marginTop: 20 }}>
        {labelRows.slice(0, rows).map((label, i) => (
          <span key={i} style={{ fontSize: 10, color: 'var(--muted)', height: cellSize, lineHeight: `${cellSize}px` }}>{label}</span>
        ))}
      </div>
      <div>
        <div style={{ display: 'flex', gap: gap, marginBottom: 4 }}>
          {labelCols.slice(0, cols).map((label, i) => (
            <span key={i} style={{ fontSize: 10, color: 'var(--muted)', width: cellSize, textAlign: 'center' }}>{label}</span>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap }}>
          {(data.slice(0, rows) || []).map((row, i) => (
            <div key={i} style={{ display: 'flex', gap }}>
              {(row.slice(0, cols) || []).map((val, j) => {
                const intensity = max > 0 ? val / max : 0;
                return (
                  <div key={j} style={{
                    width: cellSize,
                    height: cellSize,
                    borderRadius: 3,
                    background: `${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`,
                  }} />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};