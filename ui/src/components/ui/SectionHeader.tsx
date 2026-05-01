import React from 'react';

interface SectionHeaderProps { title: string; action?: React.ReactNode }

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action }) => (
  <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{title}</h3>
    {action}
  </div>
);