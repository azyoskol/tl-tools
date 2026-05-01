import React from 'react';
import { Widget } from '../components/ui/Widget';

export const PlaceholderScreen: React.FC<{ name?: string }> = ({ name = 'Settings' }) => (
  <div className="fade-up-5" style={{ padding: 24 }}>
    <h1 style={{ fontSize: 28, marginBottom: 24 }}>{name}</h1>
    <Widget><p style={{ color: 'var(--muted)' }}>Settings panel coming soon.</p></Widget>
  </div>
);