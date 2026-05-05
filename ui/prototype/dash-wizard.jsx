// dash-wizard.jsx — Custom dashboard builder wizard
// Panel + Preview layout: left steps, right live preview
// Requires: charts.jsx, dashboard-roles.jsx exported to window

const { useState, useMemo } = React;

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: 'cto',    label: 'CTO',              icon: 'trendingUp', color: '#00E5FF', desc: 'Health score, DORA overview, team velocity trends' },
  { id: 'vp',     label: 'VP Engineering',   icon: 'users',      color: '#B44CFF', desc: 'Sprint velocity, team load, delivery risk heatmap' },
  { id: 'tl',     label: 'Tech Lead',        icon: 'gitPR',      color: '#00C853', desc: 'CI health, PR queue, sprint burndown' },
  { id: 'devops', label: 'DevOps / SRE',     icon: 'cpu',        color: '#FF9100', desc: 'Deploy frequency, MTTR, incident tracking' },
  { id: 'ic',     label: 'My Dashboard',     icon: 'activity',   color: '#B44CFF', desc: 'My PRs, CI runs, review queue, sprint tasks' },
  { id: 'blank',  label: 'Blank Canvas',     icon: 'plus',       color: '#6B7A9A', desc: 'Start from scratch and add widgets one by one' },
];

// ─── Widget library ───────────────────────────────────────────────────────────
const WIDGET_LIBRARY = [
  { cat: 'DORA',   id: 'dora-overview',   icon: 'zap',       label: 'DORA Overview',       desc: '4 key metrics at a glance' },
  { cat: 'DORA',   id: 'deploy-freq',     icon: 'zap',       label: 'Deploy Frequency',    desc: 'Chart + current value' },
  { cat: 'DORA',   id: 'lead-time',       icon: 'clock',     label: 'Lead Time',           desc: 'Time from commit → production' },
  { cat: 'DORA',   id: 'mttr-trend',      icon: 'activity',  label: 'MTTR Trend',          desc: 'Mean time to restore incidents' },
  { cat: 'CI/CD',  id: 'ci-pass-rate',    icon: 'activity',  label: 'CI Pass Rate',        desc: 'Build success trend' },
  { cat: 'CI/CD',  id: 'build-duration',  icon: 'clock',     label: 'Build Duration',      desc: 'Median & p95 over time' },
  { cat: 'CI/CD',  id: 'failing-builds',  icon: 'xCircle',   label: 'Failing Builds',      desc: 'Recent failures list' },
  { cat: 'PR',     id: 'pr-queue',        icon: 'gitPR',     label: 'PR Review Queue',     desc: 'Open PRs awaiting review' },
  { cat: 'PR',     id: 'pr-cycle',        icon: 'gitPR',     label: 'PR Cycle Time',       desc: 'Time to merge by author/team' },
  { cat: 'Sprint', id: 'burndown',        icon: 'chart',     label: 'Sprint Burndown',     desc: 'Points remaining vs ideal' },
  { cat: 'Sprint', id: 'velocity',        icon: 'trendingUp',label: 'Sprint Velocity',     desc: 'Historical velocity trend' },
  { cat: 'Sprint', id: 'blocked-tasks',   icon: 'alertTri',  label: 'Blocked Tasks',       desc: 'Items blocked this sprint' },
  { cat: 'Team',   id: 'team-heatmap',    icon: 'layers',    label: 'Team Activity Map',   desc: 'Commit heatmap per team' },
  { cat: 'Team',   id: 'leaderboard',     icon: 'star',      label: 'Contributor Ranking', desc: 'Activity leaderboard' },
  { cat: 'AI',     id: 'ai-summary',      icon: 'sparkles',  label: 'AI Summary',          desc: 'Auto-generated insights' },
  { cat: 'AI',     id: 'anomaly',         icon: 'brain',     label: 'Anomaly Detector',    desc: 'ML-flagged metric changes' },
];

const CATS = ['All', 'DORA', 'CI/CD', 'PR', 'Sprint', 'Team', 'AI'];

// Pre-selected widgets per template
const TEMPLATE_WIDGETS = {
  cto:    ['dora-overview', 'deploy-freq', 'velocity', 'ai-summary'],
  vp:     ['velocity', 'pr-cycle', 'team-heatmap', 'blocked-tasks', 'ai-summary'],
  tl:     ['ci-pass-rate', 'pr-queue', 'burndown', 'failing-builds', 'ai-summary'],
  devops: ['deploy-freq', 'mttr-trend', 'failing-builds', 'anomaly'],
  ic:     ['pr-queue', 'ci-pass-rate', 'burndown', 'blocked-tasks'],
  blank:  [],
};

// ─── Step indicator ───────────────────────────────────────────────────────────
const StepDot = ({ n, label, active, done }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 60 }}>
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: done ? 'var(--cyan)' : active ? 'rgba(0,229,255,0.15)' : 'transparent',
      border: done ? '2px solid var(--cyan)' : active ? '2px solid var(--cyan)' : '2px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: active ? '0 0 12px rgba(0,229,255,0.3)' : 'none',
      transition: 'all 0.25s',
    }}>
      {done
        ? <Icon name="check" size={13} color="#0B0F19" />
        : <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: active ? 'var(--cyan)' : 'var(--muted)' }}>{n}</span>
      }
    </div>
    <span style={{ fontSize: 10.5, color: active ? 'var(--text)' : 'var(--muted)', fontWeight: active ? 600 : 400, textAlign: 'center' }}>{label}</span>
  </div>
);

// ─── Mini widget preview card ─────────────────────────────────────────────────
const MiniWidget = ({ id, onRemove }) => {
  const w = WIDGET_LIBRARY.find(x => x.id === id);
  if (!w) return null;
  const colors = { DORA: '#00E5FF', 'CI/CD': '#00C853', PR: '#B44CFF', Sprint: '#FF9100', Team: '#00E5FF', AI: '#B44CFF' };
  const c = colors[w.cat] || '#00E5FF';
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
      borderRadius: 9, padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 9,
      position: 'relative',
    }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, background: `${c}18`, border: `1px solid ${c}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={w.icon} size={13} color={c} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.label}</div>
        <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{w.cat}</div>
      </div>
      <button onClick={() => onRemove(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 2, display: 'flex', flexShrink: 0 }}>
        <Icon name="x" size={13} />
      </button>
    </div>
  );
};

// ─── Preview panel ────────────────────────────────────────────────────────────
const PreviewPanel = ({ template, widgets, widgetSizes = {}, name }) => {
  const sparkA = makeTimeSeries(12, 4, 1.2, 0.05, 1);
  const sparkB = makeTimeSeries(12, 88, 5, 0.2, 2);
  const sparkC = makeTimeSeries(12, 22, 6, -0.3, 3);
  const areaData = makeTimeSeries(16, 4.2, 1.5, 0.03, 10);

  const hasWidget = (id) => widgets.includes(id);
  const widgetCount = widgets.length;

  return (
    <div style={{
      flex: 1, background: 'rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* Preview header */}
      <div style={{
        padding: '12px 18px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(11,15,25,0.6)',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan)', animation: 'pulse-dot 2s infinite' }} />
        <span style={{ fontSize: 12.5, fontFamily: 'var(--font-head)', fontWeight: 600, color: 'var(--text)' }}>
          {name || 'My Dashboard'} — Preview
        </span>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
          {widgetCount} widget{widgetCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {widgetCount === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: 0.5 }}>
            <Icon name="layers" size={32} color="var(--muted)" />
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Add widgets to see a preview</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

            {/* DORA Overview */}
            {widgets.includes('dora-overview') && (
              <div style={{ gridColumn: widgetSizes['dora-overview'] !== 'sm' ? 'span 2' : 'span 1', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>DORA Overview</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[['4.2/day','Deploy Freq','#00E5FF'],['38h','Lead Time','#B44CFF'],['3.2%','CFR','#FF9100'],['18 min','MTTR','#00C853']].map(([v,l,c],i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '8px 0' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-head)' }}>{v}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{l}</div>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, margin: '6px auto 0' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stat cards — render in widget order */}
            {widgets.filter(id => ['deploy-freq','ci-pass-rate','pr-cycle','mttr-trend','velocity','burndown'].includes(id)).map(id => {
              const cfgs = {
                'deploy-freq':  { icon:'zap',       color:'#00E5FF', label:'Deploy Frequency', val:'4.2', unit:'/day', spark: makeTimeSeries(12,4,1.2,0.05,1) },
                'ci-pass-rate': { icon:'activity',  color:'#00C853', label:'CI Pass Rate',     val:'92',  unit:'%',   spark: makeTimeSeries(12,88,5,0.2,2) },
                'pr-cycle':     { icon:'gitPR',     color:'#B44CFF', label:'PR Cycle Time',   val:'22',  unit:'hrs', spark: makeTimeSeries(12,22,6,-0.3,3) },
                'mttr-trend':   { icon:'activity',  color:'#FF9100', label:'MTTR',             val:'18',  unit:'min', spark: makeTimeSeries(12,28,8,-0.8,55) },
                'velocity':     { icon:'trendingUp',color:'#00E5FF', label:'Sprint Velocity',  val:'76',  unit:'pts', spark: makeTimeSeries(12,70,8,0.4,77) },
                'burndown':     { icon:'chart',     color:'#B44CFF', label:'Remaining',        val:'8',   unit:'pts', spark: makeTimeSeries(12,50,5,-4,88) },
              };
              const cfg = cfgs[id]; if (!cfg) return null;
              const isLg = widgetSizes[id] === 'lg';
              return (
                <div key={id} style={{ gridColumn: isLg ? 'span 2' : 'span 1', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <Icon name={cfg.icon} size={13} color={cfg.color} />
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{cfg.label}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-head)', color: 'var(--text)' }}>
                    {cfg.val}<span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400 }}>{cfg.unit}</span>
                  </div>
                  <MiniSparkline data={cfg.spark} color={cfg.color} height={24} />
                </div>
              );
            })}

            {/* Team heatmap */}
            {widgets.includes('team-heatmap') && (
              <div style={{ gridColumn: widgetSizes['team-heatmap'] !== 'sm' ? 'span 2' : 'span 1', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Team Activity Heatmap</div>
                <Heatmap data={makeHeatData(3, 16, 0.4, 33)} rows={3} cols={16} labelRows={['Platform','Backend','Mobile']} color="#00E5FF" cellSize={14} gap={3} />
              </div>
            )}

            {/* PR queue */}
            {widgets.includes('pr-queue') && (
              <div style={{ gridColumn: widgetSizes['pr-queue'] !== 'sm' ? 'span 2' : 'span 1', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>PR Review Queue</div>
                {[['feat/auth-tokens','@j.kim','3h'],['fix/rate-limit','@s.chen','8h'],['refactor/api','@m.patel','19h']].map(([pr,a,age],i)=>(
                  <div key={i} style={{ display:'flex', gap:10, fontSize:11.5, padding:'5px 0', borderBottom:'1px solid var(--border)', color:'var(--muted2)' }}>
                    <span style={{ flex:1, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pr}</span>
                    <span style={{ fontFamily:'var(--font-mono)' }}>{a}</span>
                    <span style={{ fontFamily:'var(--font-mono)', color: parseInt(age)>12?'#FF9100':'var(--muted)' }}>{age}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Failing builds */}
            {widgets.includes('failing-builds') && (
              <div style={{ gridColumn: widgetSizes['failing-builds'] !== 'sm' ? 'span 2' : 'span 1', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Recent Build Failures</div>
                {[['integration-tests','api-gateway','2h'],['docker-build','monorepo','5h'],['e2e-suite','frontend','9h']].map(([wf,repo,ago],i)=>(
                  <div key={i} style={{ display:'flex', gap:10, fontSize:11.5, padding:'5px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:'#FF1744',flexShrink:0,marginTop:4}}/>
                    <span style={{flex:1,color:'var(--text)'}}>{wf}</span>
                    <span style={{color:'var(--muted)',fontFamily:'var(--font-mono)'}}>{repo}</span>
                    <span style={{color:'var(--muted)',opacity:0.6}}>{ago}</span>
                  </div>
                ))}
              </div>
            )}

            {/* AI summary */}
            {widgets.includes('ai-summary') && (
              <div style={{ gridColumn: widgetSizes['ai-summary'] !== 'sm' ? 'span 2' : 'span 1', background: 'rgba(180,76,255,0.06)', border: '1px solid rgba(180,76,255,0.2)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10 }}>
                <Icon name="sparkles" size={14} color="#B44CFF" />
                <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.5 }}>
                  AI insights will appear here based on your selected metrics and time range.
                </div>
              </div>
            )}

            {/* Anomaly widget */}
            {widgets.includes('anomaly') && (
              <div style={{ gridColumn: widgetSizes['anomaly'] !== 'sm' ? 'span 2' : 'span 1', background: 'rgba(255,145,0,0.06)', border: '1px solid rgba(255,145,0,0.2)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10 }}>
                <Icon name="brain" size={14} color="#FF9100" />
                <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.5 }}>
                  ML anomaly detector will flag metric changes outside normal variance.
                </div>
              </div>
            )}

            {/* blocked-tasks */}
            {widgets.includes('blocked-tasks') && (
              <div style={{ gridColumn: widgetSizes['blocked-tasks'] !== 'sm' ? 'span 2' : 'span 1', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Blocked Tasks</div>
                {[['Auth migration','Backend','High'],['iOS release blocker','Mobile','Critical'],['Data pipeline v2','Data','Med']].map(([t,team,pri],i)=>(
                  <div key={i} style={{ display:'flex', gap:8, fontSize:11.5, padding:'5px 0', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:pri==='Critical'?'#FF1744':pri==='High'?'#FF9100':'#6B7A9A',flexShrink:0}}/>
                    <span style={{flex:1,color:'var(--text)'}}>{t}</span>
                    <span style={{color:'var(--muted)',fontSize:10.5}}>{team}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── DashboardWizardScreen ────────────────────────────────────────────────────
const DashboardWizardScreen = ({ onSave, onCancel }) => {
  const [step, setStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [widgetSizes, setWidgetSizes] = useState({}); // id → 'sm'|'lg'
  const [widgetCat, setWidgetCat] = useState('All');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [timeRange, setTimeRange] = useState('30d');
  const [team, setTeam] = useState('All teams');

  const steps = ['Template', 'Widgets', 'Settings'];

  const chooseTemplate = (tmpl) => {
    setSelectedTemplate(tmpl);
    const ws = TEMPLATE_WIDGETS[tmpl.id] || [];
    setWidgets(ws);
    // default sizes: first widget lg if it's a summary type
    const sizes = {};
    ws.forEach((id, i) => { sizes[id] = (id === 'dora-overview' || id === 'team-heatmap' || id === 'pr-queue' || id === 'failing-builds' || id === 'ai-summary') ? 'lg' : 'sm'; });
    setWidgetSizes(sizes);
    if (!name) setName(tmpl.id === 'blank' ? 'My Dashboard' : `${tmpl.label} Dashboard`);
  };

  const toggleWidget = (id) => {
    setWidgets(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      const next = [...prev, id];
      setWidgetSizes(s => ({ ...s, [id]: 'sm' }));
      return next;
    });
  };

  const moveWidget = (idx, dir) => {
    setWidgets(prev => {
      const arr = [...prev];
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= arr.length) return arr;
      [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
      return arr;
    });
  };

  const toggleSize = (id) => {
    setWidgetSizes(prev => ({ ...prev, [id]: prev[id] === 'lg' ? 'sm' : 'lg' }));
  };

  const filteredWidgets = widgetCat === 'All' ? WIDGET_LIBRARY : WIDGET_LIBRARY.filter(w => w.cat === widgetCat);

  const canContinue = [
    !!selectedTemplate,
    widgets.length > 0,
    name.trim().length > 0,
  ][step];

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>

      {/* Left panel */}
      <div style={{
        width: 400, flexShrink: 0, display: 'flex', flexDirection: 'column',
        borderRight: '1px solid var(--border)', overflow: 'hidden',
      }}>
        {/* Steps */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
            {steps.map((s, i) => (
              <React.Fragment key={i}>
                <StepDot n={i + 1} label={s} active={step === i} done={step > i} />
                {i < steps.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: step > i ? 'var(--cyan)' : 'var(--border)', marginTop: 13, transition: 'background 0.3s' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '18px 20px' }}>

          {/* Step 0: Template */}
          {step === 0 && (
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 4 }}>Start from a template</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>Choose a pre-built layout for your role, or start blank.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TEMPLATES.map(tmpl => {
                  const isSelected = selectedTemplate?.id === tmpl.id;
                  return (
                    <button key={tmpl.id} onClick={() => chooseTemplate(tmpl)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                        borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                        border: isSelected ? `1px solid ${tmpl.color}55` : '1px solid var(--border)',
                        background: isSelected ? `${tmpl.color}0a` : 'transparent',
                        boxShadow: isSelected ? `0 0 12px ${tmpl.color}12` : 'none',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border2)'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${tmpl.color}18`, border: `1px solid ${tmpl.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name={tmpl.icon} size={16} color={tmpl.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-head)', marginBottom: 2 }}>{tmpl.label}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.4 }}>{tmpl.desc}</div>
                      </div>
                      {isSelected && <Icon name="check" size={16} color={tmpl.color} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Widgets */}
          {step === 1 && (
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 4 }}>Customize widgets</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>Add or remove widgets. Selected: {widgets.length}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {CATS.map(c => (
                  <button key={c} onClick={() => setWidgetCat(c)} style={{
                    padding: '4px 11px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                    border: widgetCat === c ? '1px solid rgba(0,229,255,0.4)' : '1px solid var(--border)',
                    background: widgetCat === c ? 'rgba(0,229,255,0.1)' : 'transparent',
                    color: widgetCat === c ? 'var(--cyan)' : 'var(--muted2)',
                    fontFamily: 'var(--font-body)', transition: 'all 0.12s',
                  }}>{c}</button>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredWidgets.map(w => {
                  const sel = widgets.includes(w.id);
                  const catColors = { DORA: '#00E5FF', 'CI/CD': '#00C853', PR: '#B44CFF', Sprint: '#FF9100', Team: '#00E5FF', AI: '#B44CFF' };
                  const c = catColors[w.cat] || '#00E5FF';
                  return (
                    <div key={w.id} onClick={() => toggleWidget(w.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                        borderRadius: 9, cursor: 'pointer', transition: 'all 0.12s',
                        border: sel ? `1px solid ${c}40` : '1px solid var(--border)',
                        background: sel ? `${c}0a` : 'transparent',
                      }}
                      onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${c}18`, border: `1px solid ${c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name={w.icon} size={13} color={c} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)' }}>{w.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{w.desc}</div>
                      </div>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        border: sel ? 'none' : '1.5px solid var(--border)',
                        background: sel ? c : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {sel && <Icon name="check" size={10} color="#0B0F19" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Settings */}
          {step === 2 && (
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 4 }}>Dashboard settings</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Name it, configure defaults, and arrange widgets.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Dashboard name *</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="e.g. Backend Team Overview"
                    style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 9, padding: '9px 12px', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Description</label>
                  <input value={desc} onChange={e => setDesc(e.target.value)}
                    placeholder="Optional — visible to teammates"
                    style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 9, padding: '9px 12px', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Default time range</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['7d', '14d', '30d', '90d'].map(t => (
                      <button key={t} onClick={() => setTimeRange(t)} style={{
                        padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 13,
                        border: timeRange === t ? '1px solid rgba(0,229,255,0.4)' : '1px solid var(--border)',
                        background: timeRange === t ? 'rgba(0,229,255,0.1)' : 'transparent',
                        color: timeRange === t ? 'var(--cyan)' : 'var(--muted2)',
                        fontFamily: 'var(--font-body)', transition: 'all 0.12s',
                      }}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Team scope</label>
                  <select value={team} onChange={e => setTeam(e.target.value)} style={{
                    background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 9,
                    padding: '9px 12px', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 13.5,
                    outline: 'none', cursor: 'pointer', width: '100%',
                  }}>
                    {['All teams', 'Platform', 'Backend', 'Frontend', 'Mobile', 'Data'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Widget order + size */}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>
                    Widget layout <span style={{ opacity: 0.6, fontWeight: 400 }}>— drag to reorder, toggle width</span>
                  </label>
                  {widgets.length === 0
                    ? <div style={{ fontSize: 12.5, color: 'var(--muted)', opacity: 0.6 }}>No widgets — go back to step 2.</div>
                    : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {widgets.map((id, idx) => {
                          const w = WIDGET_LIBRARY.find(x => x.id === id);
                          if (!w) return null;
                          const catColors = { DORA:'#00E5FF','CI/CD':'#00C853',PR:'#B44CFF',Sprint:'#FF9100',Team:'#00E5FF',AI:'#B44CFF' };
                          const c = catColors[w.cat] || '#00E5FF';
                          const isLg = widgetSizes[id] === 'lg';
                          return (
                            <div key={id} style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                              borderRadius: 9, padding: '8px 10px',
                            }}>
                              {/* Order controls */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <button onClick={() => moveWidget(idx, -1)} disabled={idx === 0}
                                  style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? 'var(--border)' : 'var(--muted)', padding: '1px 3px', fontSize: 10, lineHeight: 1 }}>▲</button>
                                <button onClick={() => moveWidget(idx, 1)} disabled={idx === widgets.length - 1}
                                  style={{ background: 'none', border: 'none', cursor: idx === widgets.length - 1 ? 'default' : 'pointer', color: idx === widgets.length - 1 ? 'var(--border)' : 'var(--muted)', padding: '1px 3px', fontSize: 10, lineHeight: 1 }}>▼</button>
                              </div>
                              {/* Icon */}
                              <div style={{ width: 24, height: 24, borderRadius: 6, background: `${c}18`, border: `1px solid ${c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon name={w.icon} size={12} color={c} />
                              </div>
                              {/* Label */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.label}</div>
                              </div>
                              {/* Size toggle */}
                              <button onClick={() => toggleSize(id)} title={isLg ? 'Full width → Half width' : 'Half width → Full width'}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontSize: 11,
                                  border: `1px solid ${isLg ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
                                  background: isLg ? 'rgba(0,229,255,0.08)' : 'transparent',
                                  color: isLg ? 'var(--cyan)' : 'var(--muted)', fontFamily: 'var(--font-mono)',
                                  transition: 'all 0.12s', flexShrink: 0,
                                }}>
                                {isLg ? '⬛ Full' : '▪ Half'}
                              </button>
                              {/* Remove */}
                              <button onClick={() => setWidgets(p => p.filter(x => x !== id))}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '2px', display: 'flex', flexShrink: 0 }}>
                                <Icon name="x" size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )
                  }
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          <button onClick={() => step === 0 ? onCancel?.() : setStep(s => s - 1)}
            style={{ padding: '8px 18px', borderRadius: 9, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted2)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={() => step === steps.length - 1 ? onSave?.({ name, widgets, widgetSizes, timeRange, team }) : setStep(s => s + 1)}
            disabled={!canContinue}
            style={{
              padding: '8px 22px', borderRadius: 9, cursor: canContinue ? 'pointer' : 'not-allowed',
              background: step === steps.length - 1 ? '#00C853' : 'var(--grad)',
              border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 600,
              fontFamily: 'var(--font-body)', opacity: canContinue ? 1 : 0.4, transition: 'all 0.15s',
              boxShadow: canContinue ? '0 0 16px rgba(0,229,255,0.2)' : 'none',
            }}>
            {step === steps.length - 1 ? '✓ Save Dashboard' : 'Continue →'}
          </button>
        </div>
      </div>

      {/* Right: live preview */}
      <PreviewPanel template={selectedTemplate} widgets={widgets} widgetSizes={widgetSizes} name={name} />
    </div>
  );
};


Object.assign(window, { DashboardWizardScreen });
