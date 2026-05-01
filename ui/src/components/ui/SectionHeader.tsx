import React from 'react';

interface SectionHeaderProps { title: string; action?: React.ReactNode }

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action }) => (
  <div style={{ marginBottom: '20px' }}>
    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{title}</h3>
    <div style={{ height: '1px', background: 'var(--border)' }} />
  </div>
);