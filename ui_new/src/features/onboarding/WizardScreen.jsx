// src/features/onboarding/WizardScreen.jsx
import React, { useState } from 'react';
import { Icon } from '../../components/shared/Icon';

const sources = [
  { id: 'github', icon: 'github', name: 'GitHub', desc: 'Repos, PRs, CI workflows', color: '#E8EDF5', cli: 'github --org my-org' },
  { id: 'jira',   icon: 'jira',   name: 'Jira',   desc: 'Issues, sprints, backlogs', color: '#2684FF', cli: 'jira --url https://your-domain.atlassian.net' },
  { id: 'gitlab', icon: 'gitlab', name: 'GitLab', desc: 'Merge requests & pipelines', color: '#FC6D26', cli: 'gitlab --host https://gitlab.com' },
  { id: 'linear', icon: 'linear', name: 'Linear', desc: 'Projects, cycles & issues', color: '#5E6AD2', cli: 'linear --api-key' },
  { id: 'slack',  icon: 'slack',  name: 'Slack',  desc: 'Team communications', color: '#4A154B', cli: 'slack --token' },
  { id: 'pagerduty', icon: 'pagerduty', name: 'PagerDuty', desc: 'Incidents & on-call', color: '#06AC38', cli: 'pagerduty --integration-key' },
];

export const WizardScreen = () => {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(['github']);
  const [connected, setConnected] = useState({}); // track which sources are connected
  const steps = ['Select Sources', 'Authenticate', 'Configure', 'Review'];

  const StepIndicator = () => (
    <div style={{ width: '100%', maxWidth: 680, marginBottom: 40, display: 'flex', alignItems: 'center' }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: i < step ? 'var(--cyan)' : i === step ? 'rgba(0,229,255,0.15)' : 'var(--glass)',
              border: i <= step ? '2px solid var(--cyan)' : '2px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: i === step ? '0 0 12px rgba(0,229,255,0.3)' : 'none',
              transition: 'all 0.3s ease',
            }}>
              {i < step ? (
                <Icon name="check" size={14} color="#0B0F19" />
              ) : (
                <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: i === step ? 'var(--cyan)' : 'var(--muted)' }}>
                  {i + 1}
                </span>
              )}
            </div>
            <span style={{ fontSize: 11, color: i <= step ? 'var(--text)' : 'var(--muted)', fontWeight: i === step ? 600 : 400, whiteSpace: 'nowrap' }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < step ? 'var(--cyan)' : 'var(--border)', margin: '0 8px', marginBottom: 22, transition: 'background 0.4s ease' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Step 0: source selection (unchanged but with better styling)
  if (step === 0) {
    return (
      <div style={{ flex: 1, overflow: 'auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <StepIndicator />
        <div className="fade-up-1" style={{ width: '100%', maxWidth: 680, background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>Choose your data sources</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Select the tools your team uses. You can add more later.</div>
          </div>
          <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {sources.map(src => {
                const sel = selected.includes(src.id);
                return (
                  <button
                    key={src.id}
                    onClick={() => setSelected(prev => sel ? prev.filter(x => x !== src.id) : [...prev, src.id])}
                    style={{
                      padding: '16px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                      border: sel ? '2px solid var(--cyan)' : '1px solid var(--border)',
                      background: sel ? 'rgba(0,229,255,0.06)' : 'transparent',
                      transition: 'all 0.15s ease',
                      boxShadow: sel ? '0 0 0 1px rgba(0,229,255,0.2)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: `${src.color}15`, border: `1px solid ${src.color}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon name={src.icon} size={16} color={src.color} />
                      </div>
                      {sel && (
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', background: 'var(--cyan)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon name="check" size={12} color="#0B0F19" />
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-head)', color: 'var(--text)', marginBottom: 3 }}>{src.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{src.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <button disabled style={{ padding: '8px 18px', borderRadius: 9, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', opacity: 0.4 }}>Back</button>
            <button onClick={() => setStep(1)} style={{ padding: '8px 22px', borderRadius: 9, background: 'var(--grad)', border: 'none', color: '#fff', fontWeight: 600, boxShadow: '0 0 16px rgba(0,229,255,0.2)', cursor: 'pointer' }}>Continue →</button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: authenticate each selected source
  if (step === 1) {
    const selectedSources = sources.filter(s => selected.includes(s.id));
    const firstSource = selectedSources[0] || sources[0];
    const allConnected = selectedSources.every(s => connected[s.id]);

    return (
      <div style={{ flex: 1, overflow: 'auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <StepIndicator />
        <div className="fade-up-1" style={{ width: '100%', maxWidth: 680, background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>Authenticate</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Grant read-only access to your selected tools.</div>
          </div>
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {selectedSources.map(src => (
              <div key={src.id} style={{
                background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)',
                borderRadius: 12, padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'center',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${src.color}15`, border: `1px solid ${src.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={src.icon} size={20} color={src.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-head)' }}>{src.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{src.desc}</div>
                </div>
                <button
                  onClick={() => setConnected(prev => ({ ...prev, [src.id]: true }))}
                  disabled={connected[src.id]}
                  style={{
                    padding: '6px 16px', borderRadius: 8, cursor: connected[src.id] ? 'default' : 'pointer',
                    background: connected[src.id] ? 'rgba(0,200,83,0.1)' : 'var(--text)',
                    border: 'none', color: connected[src.id] ? 'var(--success)' : 'var(--bg)',
                    fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                  }}
                >
                  {connected[src.id] ? 'Connected ✓' : 'Connect →'}
                </button>
              </div>
            ))}

            {/* CLI command block (restored) */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--muted)', background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: 10, marginTop: 8, border: '1px solid var(--border)' }}>
              <div>$ metraly auth {firstSource.cli}</div>
              <div style={{ color: 'var(--success)' }}>✓ Waiting for OAuth callback on localhost:7842…</div>
            </div>
          </div>
          <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(0)} style={{ padding: '8px 18px', borderRadius: 9, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer' }}>Back</button>
            <button
              onClick={() => allConnected ? setStep(2) : null}
              disabled={!allConnected}
              style={{
                padding: '8px 22px', borderRadius: 9, background: allConnected ? 'var(--grad)' : 'rgba(255,255,255,0.1)',
                border: 'none', color: allConnected ? '#fff' : 'var(--muted)', fontWeight: 600,
                cursor: allConnected ? 'pointer' : 'not-allowed', boxShadow: allConnected ? '0 0 16px rgba(0,229,255,0.2)' : 'none',
              }}
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: configure (same as before)
  if (step === 2) {
    return (
      <div style={{ flex: 1, overflow: 'auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <StepIndicator />
        <div className="fade-up-1" style={{ width: '100%', maxWidth: 680, background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>Configure sync settings</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Set refresh intervals and which repos to include.</div>
          </div>
          <div style={{ padding: '24px 28px' }}>
            {[
              { label: 'Sync interval', value: 'Every 5 minutes' },
              { label: 'Repositories', value: 'All repos in org' },
              { label: 'Include archived repos', value: false },
              { label: 'Historical backfill', value: '90 days' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 13.5, color: 'var(--text)' }}>{row.label}</span>
                {typeof row.value === 'boolean' ? (
                  <div style={{ width: 38, height: 21, borderRadius: 12, background: 'var(--border)', padding: 2, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 17, height: 17, borderRadius: '50%', background: 'var(--muted)' }} />
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--cyan)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                    {row.value} <Icon name="chevronDown" size={12} color="var(--cyan)" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(1)} style={{ padding: '8px 18px', borderRadius: 9, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer' }}>Back</button>
            <button onClick={() => setStep(3)} style={{ padding: '8px 22px', borderRadius: 9, background: 'var(--grad)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 16px rgba(0,229,255,0.2)' }}>Continue →</button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: review (unchanged)
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <StepIndicator />
      <div className="fade-up-1" style={{ width: '100%', maxWidth: 680, background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>Review & activate</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Everything looks good. Metraly will begin indexing shortly.</div>
        </div>
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(0,200,83,0.12)', border: '1px solid rgba(0,200,83,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={28} color="var(--success)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 6 }}>You're all set</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 380 }}>Metraly will begin indexing your repositories. First metrics appear in ~2 minutes.</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 340 }}>
            {selected.map(id => {
              const src = sources.find(s => s.id === id);
              return src ? (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(0,200,83,0.06)', border: '1px solid rgba(0,200,83,0.15)', borderRadius: 10 }}>
                  <Icon name={src.icon} size={15} color={src.color} />
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>{src.name}</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse-dot 2s infinite' }} />
                    <span style={{ fontSize: 11, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>Connecting</span>
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </div>
        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => setStep(2)} style={{ padding: '8px 18px', borderRadius: 9, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer' }}>Back</button>
          <button onClick={() => window.location.href = '/'} style={{ padding: '8px 22px', borderRadius: 9, background: 'var(--success)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 16px rgba(0,200,83,0.3)' }}>Go to Dashboard</button>
        </div>
      </div>
    </div>
  );
};