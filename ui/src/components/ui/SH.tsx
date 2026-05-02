import React from 'react';

interface SHProps {
  title: string;
  right?: React.ReactNode;
}

export const SH = ({ title, right }: SHProps) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: 4 }}>
    <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{title}</span>
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    {right && <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{right}</span>}
  </div>
);
