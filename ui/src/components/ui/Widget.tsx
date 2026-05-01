import React from 'react';

interface WidgetProps { children: React.ReactNode; className?: string }

export const Widget: React.FC<WidgetProps> = ({ children, className }) => (
  <div style={{
    background: 'var(--glass)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '20px'
  }} className={className}>
    {children}
  </div>
);