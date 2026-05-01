import React, { useState, useRef, useEffect } from 'react';

interface FilterPillProps { label: string; options: string[]; value: string; onChange: (v: string) => void }

export const FilterPill: React.FC<FilterPillProps> = ({ label, options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) return; const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener('click', onClick); return () => document.removeEventListener('click', onClick); }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        background: value !== 'All' ? 'var(--cyan)20' : 'var(--glass)',
        border: '1px solid var(--border)', borderRadius: '20px', padding: '6px 14px',
        color: 'var(--text)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
      }}>
        {label}: {value}
        <span style={{ fontSize: '10px' }}>▼</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'var(--glass2)', border: '1px solid var(--border)', borderRadius: 8, padding: 4, minWidth: 120, zIndex: 10 }}>
          {options.map(o => (
            <div key={o} onClick={() => { onChange(o); setOpen(false); }} style={{ padding: '8px 12px', borderRadius: 4, cursor: 'pointer', fontSize: '13px' }}>{o}</div>
          ))}
        </div>
      )}
    </div>
  );
};