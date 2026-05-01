import React, { useState } from 'react';
import { Widget } from '../components/ui/Widget';
import { AreaChart } from '../components/charts/AreaChart';
import { createDashboard } from '../api/metrics';
import { makeTimeSeries } from '../components/charts/utils';

const steps = ['Choose Widgets', 'Configure Layout', 'Save Dashboard'];

export const DashboardWizardScreen: React.FC = () => {
  const [step, setStep] = useState(0);
  const [widgets, setWidgets] = useState<string[]>([]);
  const [name, setName] = useState('');

  const availableWidgets = ['dora-overview', 'ci-pass-rate', 'velocity-chart', 'heatmap', 'deploy-trend', 'pr-queue'];
  const toggleWidget = (w: string) => setWidgets(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]);
  const handleSave = async () => { await createDashboard({ name, widgets, widgetSizes: {}, timeRange: '30d', team: 'All teams' }); alert('Dashboard saved!'); };

  return (
    <div className="fade-up-3" style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Dashboard Builder</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ padding: '8px 16px', borderRadius: 20, fontSize: 13, background: i <= step ? 'var(--cyan)20' : 'var(--glass)', color: i <= step ? 'var(--cyan)' : 'var(--muted)' }}>{i + 1}. {s}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <Widget>
          {step === 0 && (<><h3 style={{ marginBottom: 16 }}>Select Widgets</h3><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{availableWidgets.map(w => (<button key={w} onClick={() => toggleWidget(w)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid', borderColor: widgets.includes(w) ? 'var(--cyan)' : 'var(--border)', background: widgets.includes(w) ? 'var(--cyan)20' : 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>{w}</button>))}</div></>)}
          {step === 1 && (<><h3 style={{ marginBottom: 16 }}>Configure Dashboard</h3><input value={name} onChange={e => setName(e.target.value)} placeholder="Dashboard name" style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, marginBottom: 16 }} /></>)}
          {step === 2 && (<><h3 style={{ marginBottom: 16 }}>Preview</h3><div style={{ color: 'var(--muted)' }}>Dashboard: {name}</div><div style={{ color: 'var(--muted)' }}>Widgets: {widgets.join(', ')}</div></>)}
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text)', cursor: 'pointer' }}>Back</button>}
            {step < 2 && <button onClick={() => setStep(s => s + 1)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--grad)', color: '#fff', cursor: 'pointer' }}>Next</button>}
            {step === 2 && <button onClick={handleSave} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--grad)', color: '#fff', cursor: 'pointer' }}>Save Dashboard</button>}
          </div>
        </Widget>
        <Widget><h3 style={{ marginBottom: 16 }}>Live Preview</h3><AreaChart data={makeTimeSeries(1, 20, 50, 20)} width={280} height={140} /></Widget>
      </div>
    </div>
  );
};