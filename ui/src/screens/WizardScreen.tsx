import React, { useState } from 'react';
import { Widget } from '../components/ui/Widget';
const wizardSteps = ['Connect', 'Configure', 'Validate', 'Done'];

export const WizardScreen: React.FC = () => {
  const [step, setStep] = useState(0);
  return (
    <div className="fade-up-4" style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, marginBottom: 24, textAlign: 'center' }}>Connect Data Sources</h1>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>{wizardSteps.map((s, i) => (<div key={i} style={{ padding: '6px 12px', borderRadius: 4, fontSize: 12, background: i <= step ? 'var(--cyan)20' : 'var(--glass)', color: i <= step ? 'var(--cyan)' : 'var(--muted)' }}>{s}</div>))}</div>
      <Widget>
        <h3 style={{ marginBottom: 16 }}>Step {step + 1}: {wizardSteps[step]}</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>This is a UI prototype. Real data source configuration coming soon.</p>
        <div style={{ display: 'flex', gap: 12 }}>
          {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text)', cursor: 'pointer' }}>Back</button>}
          {step < 3 && <button onClick={() => setStep(s => s + 1)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--grad)', color: '#fff', cursor: 'pointer' }}>Next</button>}
        </div>
      </Widget>
    </div>
  );
};