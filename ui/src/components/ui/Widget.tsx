import React, { CSSProperties } from 'react';

interface WidgetProps {
  title?: string;
  children?: React.ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
}

export const Widget: React.FC<WidgetProps> = ({ title, children, style, onClick }) => {
  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', ...style }} onClick={onClick}>
      {title && <h3 style={{ margin: '0 0 12px' }}>{title}</h3>}
      {children}
    </div>
  );
};