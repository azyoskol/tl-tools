import React, { useState } from 'react';

interface AIInsightCardProps { title: string; body: string; action?: string }

export const AIInsightCard: React.FC<AIInsightCardProps> = ({ title, body, action }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
        borderRadius: '12px',
        padding: '1px',
        position: 'relative',
        opacity: hovered ? 0.8 : 1,
        transition: 'opacity 0.2s, transform 0.2s',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <div style={{ 
        background: hovered ? 'var(--glass2)' : 'var(--glass)', 
        borderRadius: '11px', 
        padding: '20px',
        height: '100%',
        transition: 'background 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--purple)' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI INSIGHT</span>
          {hovered && (
            <span style={{ 
              marginLeft: 'auto', 
              fontSize: '10px', 
              color: 'var(--success)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px' 
            }}>
              ✓ Seen
            </span>
          )}
        </div>
        <h4 style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--text)' }}>{title}</h4>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: action ? '12px' : 0, lineHeight: 1.5 }}>{body}</p>
        {action && <button style={{ background: 'var(--grad)', border: 'none', borderRadius: '6px', padding: '8px 16px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>{action}</button>}
      </div>
    </div>
  );
};