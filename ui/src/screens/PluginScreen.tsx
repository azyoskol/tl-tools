import React from 'react';
import { Widget } from '../components/ui/Widget';

const plugins = [{ name: 'Slack Integration', desc: 'Send alerts to Slack channels', installed: true }, { name: 'Jira Connector', desc: 'Sync issues and sprints', installed: false }, { name: 'GitHub Webhooks', desc: 'Real-time event ingestion', installed: true }, { name: 'Datadog Export', desc: 'Push metrics to Datadog', installed: false }];

export const PluginScreen: React.FC = () => (
  <div className="fade-up-4" style={{ padding: 24 }}>
    <h1 style={{ fontSize: 28, marginBottom: 24 }}>Plugin Marketplace</h1>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
      {plugins.map(p => (
        <Widget key={p.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><h4 style={{ marginBottom: 4 }}>{p.name}</h4><p style={{ color: 'var(--muted)', fontSize: 13 }}>{p.desc}</p></div>
            <button style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: p.installed ? '#00C85320' : 'var(--grad)', color: p.installed ? '#00C853' : '#fff', cursor: 'pointer', fontSize: 13 }}>{p.installed ? 'Installed' : 'Install'}</button>
          </div>
        </Widget>
      ))}
    </div>
  </div>
);