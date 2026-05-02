import React from 'react';
import { useTweaks } from '../../context/TweaksContext';

interface WidgetProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const Widget = ({ children, style = {}, className = '' }: WidgetProps) => {
  const { tweaks } = useTweaks() as { tweaks: { density: string } };
  const density = tweaks.density;
  const padding: Record<string, string> = {
    compact: '8px 12px',
    comfortable: '16px 18px',
    spacious: '24px 28px',
  };

  return (
    <div className={className} style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 12, padding: padding[density] ?? '16px 18px', ...style }}>
      {children}
    </div>
  );
};
