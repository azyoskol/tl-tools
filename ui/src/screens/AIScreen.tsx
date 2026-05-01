import React, { useState } from 'react';
import { Widget } from '../components/ui/Widget';

export const AIScreen: React.FC = () => {
  const [messages, setMessages] = useState<{role: string; content: string}[]>([{ role: 'assistant', content: "Hi! I'm your AI engineering assistant. Ask me about your team's metrics, trends, or insights." }]);
  const [input, setInput] = useState('');
  const handleSend = () => { if (!input.trim()) return; setMessages([...messages, { role: 'user', content: input }]); setTimeout(() => setMessages(ms => [...ms, { role: 'assistant', content: "I'm a UI prototype - real AI integration coming soon!" }]), 500); setInput(''); };

  return (
    <div className="fade-up-4" style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>AI Assistant</h1>
      <Widget style={{ minHeight: 400, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{messages.map((m, i) => (<div key={i} style={{ padding: 12, borderRadius: 8, background: m.role === 'user' ? 'var(--cyan)20' : 'var(--bg)', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>{m.content}</div>))}</div>
      </Widget>
      <div style={{ display: 'flex', gap: 12 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask about your metrics..." style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text)', fontSize: 14 }} />
        <button onClick={handleSend} style={{ padding: '12px 24px', borderRadius: 8, border: 'none', background: 'var(--grad)', color: '#fff', cursor: 'pointer' }}>Send</button>
      </div>
    </div>
  );
};