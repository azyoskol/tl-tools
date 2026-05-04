// src/features/dashboardWizard/components/SelectedWidgetsList.tsx
import React from 'react';
import { useWizardStore } from '../store/wizardStore';
import { MiniWidget } from './MiniWidget';

export const SelectedWidgetsList: React.FC = () => {
  const { widgets, removeWidget } = useWizardStore();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const widgetId = e.dataTransfer.getData('widgetId');
    if (widgetId) {
      useWizardStore.getState().addWidget(widgetId);
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{
        minHeight: 200,
        background: 'rgba(0,0,0,0.15)',
        border: '2px dashed var(--border)',
        borderRadius: 12,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'border-color 0.15s',
      }}
      onDragEnter={(e) => e.currentTarget.style.borderColor = 'var(--cyan)'}
      onDragLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {widgets.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Drop widgets here</div>
      ) : (
        widgets.map(w => (
          <MiniWidget key={w.instanceId} widget={w} onRemove={() => removeWidget(w.instanceId)} />
        ))
      )}
    </div>
  );
};
