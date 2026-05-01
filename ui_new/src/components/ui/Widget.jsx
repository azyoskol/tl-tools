import React from 'react';
import { useTweaks } from '../../context/TweaksContext';

export const Widget = ({ children, style = {}, className = '' }) => {
  const { tweaks } = useTweaks();
  const density = tweaks.density;
  const padding = {
    compact: '8px 12px',
    comfortable: '16px 18px',
    spacious: '24px 28px',
  }[density] || '16px 18px';

  return (
    <div className={className} style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 12, padding, ...style }}>
      {children}
    </div>
  );
};