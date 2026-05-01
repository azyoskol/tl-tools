import React from 'react';

interface InlineInsightProps { text: string }

export const InlineInsight: React.FC<InlineInsightProps> = ({ text }) => (
  <div style={{
    background: 'linear-gradient(90deg, rgba(180,76,255,0.1), rgba(0,229,255,0.1))',
    borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px'
  }}>
    <span style={{ width: 4, height: '100%', minHeight: 24, borderRadius: 2, background: 'var(--grad)' }} />
    <span style={{ color: 'var(--text)', fontSize: '14px' }}>{text}</span>
  </div>
);