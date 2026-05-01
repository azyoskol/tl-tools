import React from 'react';
import { useTweaks } from '../../context/TweaksContext';
export const TweaksPanel = () => {
  const { tweaks, setTweak } = useTweaks();
  const [open, setOpen] = React.useState(false);
  if (!open) return <button onClick={()=>setOpen(true)} style={{ position:'fixed', bottom:16, right:16, zIndex:1000, background:'var(--glass)', border:'1px solid var(--border)', borderRadius:20, padding:'6px 12px', color:'var(--cyan)', fontSize:12, cursor:'pointer' }}>⚙️ Tweaks</button>;
  return (
    <div style={{ position:'fixed', bottom:16, right:16, width:260, background:'var(--glass2)', border:'1px solid var(--border2)', borderRadius:12, padding:12, zIndex:1001, backdropFilter:'blur(8px)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}><span style={{ fontWeight:600 }}>Tweaks</span><button onClick={()=>setOpen(false)} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer' }}>✕</button></div>
      <div style={{ marginBottom:8 }}><label style={{ fontSize:12, color:'var(--muted)' }}>Accent color</label><input type="color" value={tweaks.accentColor} onChange={e=>setTweak('accentColor',e.target.value)} style={{ width:'100%', marginTop:4, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:6, padding:4, color:'var(--text)' }} /></div>
      <div><label style={{ fontSize:12, color:'var(--muted)' }}>Density</label><select value={tweaks.density} onChange={e=>setTweak('density',e.target.value)} style={{ width:'100%', marginTop:4, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:6, padding:6, color:'var(--text)' }}><option>compact</option><option>comfortable</option><option>spacious</option></select></div>
    </div>
  );
};