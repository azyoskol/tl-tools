import React, { useState } from 'react';
import { Widget } from '../components/ui/Widget';
import { AreaChart } from '../components/charts/AreaChart';
import { createDashboard } from '../api/metrics';
import { makeTimeSeries } from '../components/charts/utils';

const STEPS = ['Choose Widgets', 'Configure Layout', 'Save Dashboard'];

const AVAILABLE_WIDGETS = [
  { id: 'dora-overview', label: 'DORA Overview' },
  { id: 'ci-pass-rate', label: 'CI Pass Rate' },
  { id: 'velocity-chart', label: 'Velocity Chart' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'deploy-trend', label: 'Deploy Trend' },
  { id: 'pr-queue', label: 'PR Queue' },
];

interface DashboardWizardScreenProps {
  onSave?: () => void;
  onCancel?: () => void;
}

export const DashboardWizardScreen: React.FC<DashboardWizardScreenProps> = ({ onSave }) => {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = async () => {
    await createDashboard({ name: name || 'Untitled Dashboard', widgets: selected, widgetSizes: {}, timeRange: '30d', team: 'All teams' });
    setSaved(true);
    setTimeout(() => onSave?.(), 1200);
  };

  if (saved) return (
    <div className="fade-up-2" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
      <div style={{ fontSize: 32 }}>✓</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cyan)' }}>Dashboard saved!</div>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>Redirecting…</div>
    </div>
  );

  return (
    <div className="fade-up-3" style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Dashboard Builder</h1>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 32, alignItems: 'center' }}>
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <React.Fragment key={i}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 20, fontSize: 13,
                background: active ? 'rgba(0,229,255,0.12)' : done ? 'rgba(0,229,255,0.06)' : 'var(--glass)',
                color: active ? 'var(--cyan)' : done ? 'rgba(0,229,255,0.6)' : 'var(--muted)',
                border: `1px solid ${active ? 'var(--cyan)' : 'var(--border)'}`,
                fontWeight: active ? 600 : 400,
                transition: 'all 0.2s',
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%', display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                  background: active ? 'var(--cyan)' : done ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.06)',
                  color: active ? '#0b0f19' : done ? 'var(--cyan)' : 'var(--muted)',
                  flexShrink: 0,
                }}>
                  {done ? '✓' : i + 1}
                </span>
                {s}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: i < step ? 'rgba(0,229,255,0.3)' : 'var(--border)', margin: '0 8px' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <Widget>
          {/* Step 1: Choose Widgets */}
          {step === 0 && (
            <>
              <h3 style={{ marginBottom: 8 }}>Select Widgets</h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                Choose the widgets to include in your dashboard.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {AVAILABLE_WIDGETS.map(({ id, label }) => {
                  const on = selected.includes(id);
                  return (
                    <button key={id} onClick={() => toggle(id)} style={{
                      padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                      border: `1px solid ${on ? 'var(--cyan)' : 'var(--border)'}`,
                      background: on ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.03)',
                      color: on ? 'var(--cyan)' : 'var(--text)',
                      fontWeight: on ? 600 : 400,
                      transition: 'all 0.15s',
                    }}>
                      {on && <span style={{ marginRight: 6 }}>✓</span>}{label}
                    </button>
                  );
                })}
              </div>
              {selected.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>Select at least one widget to continue.</p>
              )}
            </>
          )}

          {/* Step 2: Configure */}
          {step === 1 && (
            <>
              <h3 style={{ marginBottom: 8 }}>Configure Dashboard</h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Give your dashboard a name.</p>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Backend Team · Weekly"
                style={{
                  width: '100%', padding: '12px', borderRadius: 8, boxSizing: 'border-box',
                  border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)',
                  color: 'var(--text)', fontSize: 14, outline: 'none',
                }}
              />
              <div style={{ marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
                Widgets selected: {selected.length > 0
                  ? selected.map(id => AVAILABLE_WIDGETS.find(w => w.id === id)?.label).join(', ')
                  : <span style={{ color: 'var(--muted2)' }}>none</span>}
              </div>
            </>
          )}

          {/* Step 3: Preview & Save */}
          {step === 2 && (
            <>
              <h3 style={{ marginBottom: 16 }}>Review & Save</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Name</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: name ? 'var(--text)' : 'var(--muted2)' }}>
                    {name || 'Untitled Dashboard'}
                  </div>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Widgets ({selected.length})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selected.length > 0
                      ? selected.map(id => (
                        <span key={id} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)' }}>
                          {AVAILABLE_WIDGETS.find(w => w.id === id)?.label}
                        </span>
                      ))
                      : <span style={{ fontSize: 13, color: 'var(--muted2)' }}>No widgets selected</span>}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Nav buttons */}
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={{
                padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
                border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text)', fontSize: 13,
              }}>Back</button>
            )}
            {step < 2 && (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 0 && selected.length === 0}
                style={{
                  padding: '10px 20px', borderRadius: 8, cursor: selected.length > 0 || step > 0 ? 'pointer' : 'not-allowed',
                  border: 'none', background: step === 0 && selected.length === 0 ? 'rgba(255,255,255,0.06)' : 'var(--grad)',
                  color: step === 0 && selected.length === 0 ? 'var(--muted)' : '#fff', fontSize: 13, fontWeight: 600,
                }}>Next</button>
            )}
            {step === 2 && (
              <button onClick={handleSave} style={{
                padding: '10px 20px', borderRadius: 8, border: 'none',
                background: 'var(--grad)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>Save Dashboard</button>
            )}
          </div>
        </Widget>

        {/* Live Preview */}
        <Widget>
          <h3 style={{ marginBottom: 12 }}>Live Preview</h3>
          {selected.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selected.slice(0, 3).map(id => (
                <div key={id}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                    {AVAILABLE_WIDGETS.find(w => w.id === id)?.label}
                  </div>
                  <AreaChart data={makeTimeSeries(1, 20, 50, 20)} width={260} height={70} />
                </div>
              ))}
              {selected.length > 3 && (
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>+{selected.length - 3} more widget{selected.length - 3 > 1 ? 's' : ''}</div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140, fontSize: 13, color: 'var(--muted2)', textAlign: 'center', lineHeight: 1.5 }}>
              Select widgets<br />to preview
            </div>
          )}
        </Widget>
      </div>
    </div>
  );
};
