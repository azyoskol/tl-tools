import React from 'react';

interface DataTableProps {
  columns: string[];
  rows: React.ReactNode[][];
  title?: string;
  maxRows?: number;
}

export const DataTable = ({ columns, rows, title, maxRows = 5 }: DataTableProps) => (
  <div style={{ width: '100%' }}>
    {title && <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{title}</div>}
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
      <thead><tr>{columns.map((col, i) => <th key={i} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '0 0 8px', fontSize: 11, fontWeight: 500, color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>{col}</th>)}</tr></thead>
      <tbody>{rows.slice(0, maxRows).map((row, ri) => <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.map((cell, ci) => <td key={ci} style={{ padding: '8px 0', textAlign: ci === 0 ? 'left' : 'right', color: ci === 0 ? 'var(--text)' : 'var(--muted2)', fontFamily: ci > 0 ? 'var(--font-mono)' : 'var(--font-body)' }}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>
);
