import React from 'react';
export const Widget = ({ children, style = {}, className = '' }) => (
  <div className={className} style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', ...style }}>{children}</div>
);