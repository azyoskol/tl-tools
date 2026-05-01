import React from 'react';
import { Icon } from '../shared/Icon';
export const InlineInsight = ({ text, action }) => (
  <div style={{ background: 'rgba(180,76,255,0.06)', border: '1px solid rgba(180,76,255,0.18)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10 }}>
    <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(180,76,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="sparkles" size={12} color="var(--purple)" /></div>
    <div style={{ flex: 1 }}><p style={{ fontSize: 12.5, color: 'var(--muted2)', lineHeight: 1.55, margin: 0 }}>{text}</p>{action && <button style={{ marginTop: 8, fontSize: 11.5, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}>{action} <Icon name="arrowRight" size={11} color="var(--cyan)" /></button>}</div>
  </div>
);