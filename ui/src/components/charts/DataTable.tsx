import React from 'react';

interface Column<T> { key: keyof T; header: string; render?: (v: T[keyof T], row: T) => React.ReactNode }
interface DataTableProps<T> { columns: Column<T>[]; data: T[] }

export function DataTable<T extends Record<string, any>>({ columns, data }: DataTableProps<T>) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {columns.map(col => (
            <th key={String(col.key)} style={{
              textAlign: 'left', padding: '12px 8px', color: '#6B7A9A',
              fontWeight: 500, fontSize: '12px', textTransform: 'uppercase'
            }}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            {columns.map(col => (
              <td key={String(col.key)} style={{ padding: '12px 8px', color: '#E8EDF5' }}>
                {col.render ? col.render(row[col.key], row) : String(row[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}