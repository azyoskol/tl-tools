import React, { CSSProperties } from 'react';

interface WidgetProps {
  title?: string;
  children?: React.ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
}

export const Widget: React.FC<WidgetProps> = ({ title, children, style, onClick }) => {
  return (
    <div style={{
      padding: '20px',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      background: 'var(--glass)',
      backdropFilter: 'blur(16px)',
      ...style
    }} onClick={onClick}>
      {title && <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>{title}</h3>}
      {children}
    </div>
  );
};