// src/features/dashboardWizard/components/WidgetPalette.tsx
import React from 'react';
import { Icon } from '../../../components/shared/Icon';
import { WIDGET_LIBRARY } from '../store/wizardStore';
import { useWizardStore } from '../store/wizardStore';

export const WidgetPalette: React.FC = () => {
  const addWidget = useWizardStore(s => s.addWidget);

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    e.dataTransfer.setData('widgetId', widgetId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const catColors: Record<string, string> = { DORA: '#00E5FF', 'CI/CD': '#00C853', PR: '#B44CFF', Sprint: '#FF9100', Team: '#00E5FF', AI: '#B44CFF' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {WIDGET_LIBRARY.map(w => {
        const c = catColors[w.cat] || '#00E5FF';
        return (
          <div
            key={w.id}
            draggable
            onDragStart={(e) => handleDragStart(e, w.id)}
            onClick={() => addWidget(w.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9,
              cursor: 'pointer', border: '1px solid var(--border)',
              background: 'transparent',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 28, height: 28, borderRadius: 7, background: `${c}18`, border: `1px solid ${c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={w.icon} size={13} color={c} />
            </div>
            <div style={{ flex: 1, fontSize: 12.5, fontWeight: 500 }}>{w.label}</div>
            <Icon name="grip-vertical" size={12} color="var(--muted)" />
          </div>
        );
      })}
    </div>
  );
};
