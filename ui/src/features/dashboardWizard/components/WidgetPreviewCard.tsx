// src/features/dashboardWizard/components/WidgetPreviewCard.tsx
import React from 'react';
import { Icon } from '../../../components/shared/Icon';
import { useWizardStore } from '../store/wizardStore';
import { WizardWidget } from '../store/wizardStore';
import { AreaChart, BarChart, Heatmap, Sparkline, Gauge } from '../../../components/charts';
import { Leaderboard } from '../../../components/ui/Leaderboard';
import { makeTimeSeries, makeHeatData } from '../../../utils/seeds';

const sparkA = makeTimeSeries(12, 4, 1.2, 0.05, 1);
const sparkB = makeTimeSeries(12, 88, 5, 0.2, 2);
const sparkC = makeTimeSeries(12, 22, 6, -0.3, 3);
const areaData = makeTimeSeries(16, 4.2, 1.5, 0.03, 10);
const heatData = makeHeatData(3, 16, 0.4, 33);
const deployHeat = makeHeatData(7, 16, 0.45, 66);

const widgetCharts: Record<string, React.ReactNode> = {
  'dora-overview': (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: 12 }}>
      {[['4.2/day','Deploy Freq','#00E5FF'],['38h','Lead Time','#B44CFF'],['3.2%','CFR','#FF9100'],['18 min','MTTR','#00C853']].map(([v,l,c],i) => (
        <div key={i} style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-head)' }}>{v}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{l}</div>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, margin: '6px auto 0' }} />
        </div>
      ))}
    </div>
  ),
  'deploy-freq': <div style={{ padding: 12 }}><Sparkline data={sparkA} color="#00E5FF" height={60} /></div>,
  'lead-time': <div style={{ padding: 12 }}><Sparkline data={sparkC} color="#B44CFF" height={60} /></div>,
  'mttr-trend': <div style={{ padding: 12 }}><Sparkline data={makeTimeSeries(12,28,8,-0.8,55)} color="#FF9100" height={60} /></div>,
  'ci-pass-rate': <div style={{ padding: 12 }}><Sparkline data={sparkB} color="#00C853" height={60} /></div>,
  'failing-builds': (
    <div style={{ padding: 12, fontSize: 11.5 }}>
      {[ ['integration-tests','api-gateway','2h'], ['docker-build','monorepo','5h'], ['e2e-suite','frontend','9h'] ].map(([wf,repo,ago],i) => (
        <div key={i} style={{ display:'flex', gap:10, padding:'5px 0', borderBottom:'1px solid var(--border)', color:'var(--muted2)' }}>
          <span style={{ flex:1, color:'var(--text)' }}>{wf}</span>
          <span style={{ fontFamily:'var(--font-mono)' }}>{repo}</span>
          <span style={{ fontFamily:'var(--font-mono)', color: parseInt(ago)>12?'#FF9100':'var(--muted)' }}>{ago}</span>
        </div>
      ))}
    </div>
  ),
  'pr-queue': (
    <div style={{ padding: 12, fontSize: 11.5 }}>
      {[ ['feat/auth-tokens','@j.kim','3h'], ['fix/rate-limit','@s.chen','8h'], ['refactor/api','@m.patel','19h'] ].map(([pr,a,age],i) => (
        <div key={i} style={{ display:'flex', gap:10, padding:'5px 0', borderBottom:'1px solid var(--border)', color:'var(--muted2)' }}>
          <span style={{ flex:1, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pr}</span>
          <span style={{ fontFamily:'var(--font-mono)' }}>{a}</span>
          <span style={{ fontFamily:'var(--font-mono)', color: parseInt(age)>12?'#FF9100':'var(--muted)' }}>{age}</span>
        </div>
      ))}
    </div>
  ),
  'pr-cycle': <div style={{ padding: 12 }}><Sparkline data={sparkC} color="#B44CFF" height={60} /></div>,
  'burndown': <div style={{ padding: 12 }}><Sparkline data={makeTimeSeries(12,50,5,-4,88)} color="#B44CFF" height={60} /></div>,
  'velocity': <div style={{ padding: 12 }}><Sparkline data={makeTimeSeries(12,70,8,0.4,77)} color="#00E5FF" height={60} /></div>,
  'blocked-tasks': (
    <div style={{ padding: 12, fontSize: 11.5 }}>
      {[ ['Auth migration','Backend','High'], ['iOS release blocker','Mobile','Critical'], ['Data pipeline v2','Data','Med'] ].map(([t,team,pri],i) => (
        <div key={i} style={{ display:'flex', gap:8, padding:'5px 0', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background: pri==='Critical'?'#FF1744': pri==='High'?'#FF9100':'#6B7A9A', flexShrink:0 }}/>
          <span style={{ flex:1, color:'var(--text)' }}>{t}</span>
          <span style={{ color:'var(--muted)', fontSize:10.5 }}>{team}</span>
        </div>
      ))}
    </div>
  ),
  'team-heatmap': <div style={{ padding: 12 }}><Heatmap data={heatData} rows={3} cols={16} labelRows={['Platform','Backend','Mobile']} labelCols={[]} title="" color="var(--cyan)" cellSize={14} gap={3} /></div>,
  'leaderboard': (
    <div style={{ padding: 12 }}>
      <Leaderboard
        title=""
        items={[
          { name: 'Alex Kim', value: 42 },
          { name: 'Jamie Chen', value: 37 },
          { name: 'Taylor Smith', value: 29 },
          { name: 'Morgan Lee', value: 24 },
        ]}
        unit="pts"
        color="var(--cyan)"
      />
    </div>
  ),
  'ai-summary': (
    <div style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <Icon name="sparkles" size={14} color="var(--purple)" />
      <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.5 }}>
        AI insights will appear here based on your selected metrics and time range.
      </div>
    </div>
  ),
  'anomaly': (
    <div style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <Icon name="brain" size={14} color="#FF9100" />
      <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.5 }}>
        ML anomaly detector will flag metric changes outside normal variance.
      </div>
    </div>
  ),
};

export const WidgetPreviewCard: React.FC<{ widget: WizardWidget }> = ({ widget }) => {
  const { removeWidget, toggleWidgetSize } = useWizardStore();
  const isLarge = useWizardStore(state => state.layout.find(l => l.i === widget.instanceId)?.w === 12);

  return (
    <div style={{
      background: widget.id === 'ai-summary' ? 'rgba(180,76,255,0.06)' : widget.id === 'anomaly' ? 'rgba(255,145,0,0.06)' : 'var(--glass)',
      border: widget.id === 'ai-summary' ? '1px solid rgba(180,76,255,0.2)' : widget.id === 'anomaly' ? '1px solid rgba(255,145,0,0.2)' : '1px solid var(--border)',
      borderRadius: 10,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div className="widget-drag-handle" style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'grab',
        userSelect: 'none',
      }}>
        <div style={{ width: 20, height: 20, borderRadius: 5, background: `${widget.color}18`, border: `1px solid ${widget.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={widget.icon} size={11} color={widget.color} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', flex: 1 }}>{widget.label}</span>
        <button
          onClick={(e) => { e.stopPropagation(); toggleWidgetSize(widget.instanceId); }}
          title={isLarge ? 'Make half width' : 'Make full width'}
          style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', color: 'var(--muted)', fontSize: 10,
          }}
        >
          {isLarge ? '◀▶' : '▶◀'}
        </button>
        <button onClick={() => removeWidget(widget.instanceId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
          <Icon name="x" size={13} />
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {widgetCharts[widget.id] || <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>{widget.label}</div>}
      </div>
    </div>
  );
};
