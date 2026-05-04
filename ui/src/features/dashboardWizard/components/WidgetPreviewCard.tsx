import React from 'react';
import { Icon } from '../../../components/shared/Icon';
import { useWizardStore } from '../store/wizardStore';
import { WizardWidget } from '../store/wizardStore';

export const WidgetPreviewCard: React.FC<{ widget: WizardWidget }> = ({ widget }) => {
  const { removeWidget, toggleWidgetSize } = useWizardStore();
  const isLarge = useWizardStore(state => state.layout.find(l => l.i === widget.instanceId)?.w === 12);

  return (
    <div style={{
      background: 'var(--glass)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div className="widget-drag-handle" style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'grab',
        userSelect: 'none',
      }}>
        <div style={{ width: 20, height: 20, borderRadius: 5, background: `${widget.color}18`, border: `1px solid ${widget.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={widget.icon} size={11} color={widget.color} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', flex: 1 }}>{widget.label}</span>
        <button
          onClick={(e) => { e.stopPropagation(); toggleWidgetSize(widget.instanceId); }}
          title={isLarge ? 'Make half width' : 'Make full width'}
          style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', color: 'var(--muted)', fontSize: 10,
          }}
        >
          {isLarge ? '◀▶' : '▶◀'}
        </button>
        <button onClick={() => removeWidget(widget.instanceId)} aria-label="Remove widget" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
          <Icon name="x" size={13} />
        </button>
      </div>
      <div style={{ flex: 1, padding: 8, overflow: 'hidden' }}>
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>{widget.label}</div>
      </div>
    </div>
  );
};
