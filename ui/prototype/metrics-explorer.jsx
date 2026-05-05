// metrics-explorer.jsx — Grafana-inspired metrics explorer with DORA focus
// Requires: charts.jsx exported to window

const { useState, useMemo, useRef } = React;

// ─── Static data ──────────────────────────────────────────────────────────────
const WEEK_LABELS_30 = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 3, 1); d.setDate(d.getDate() + i);
  return i % 5 === 0 ? `${d.getMonth()+1}/${d.getDate()}` : '';
});

const METRIC_TREE = [
  {
    id: 'dora', label: 'DORA Metrics', icon: 'zap', expanded: true,
    children: [
      { id: 'deploy-freq',  label: 'Deployment Frequency', unit: 'deploys/day', color: '#00E5FF' },
      { id: 'lead-time',    label: 'Lead Time for Changes', unit: 'hours',       color: '#B44CFF' },
      { id: 'cfr',          label: 'Change Failure Rate',   unit: '%',           color: '#FF9100' },
      { id: 'mttr',         label: 'MTTR',                  unit: 'minutes',     color: '#00C853' },
    ],
  },
  {
    id: 'ci', label: 'CI / CD', icon: 'activity',
    children: [
      { id: 'ci-pass',      label: 'Build Success Rate',  unit: '%',     color: '#00C853' },
      { id: 'ci-duration',  label: 'Build Duration',      unit: 'min',   color: '#00E5FF' },
      { id: 'ci-queue',     label: 'Pipeline Queue Time', unit: 'sec',   color: '#FF9100' },
    ],
  },
  {
    id: 'pr', label: 'Pull Requests', icon: 'gitPR',
    children: [
      { id: 'pr-cycle',     label: 'PR Cycle Time',      unit: 'hours', color: '#B44CFF' },
      { id: 'pr-review',    label: 'Review Time',        unit: 'hours', color: '#00E5FF' },
      { id: 'pr-merge',     label: 'Merge Rate',         unit: '%',     color: '#00C853' },
    ],
  },
  {
    id: 'teams', label: 'Teams', icon: 'users',
    children: [
      { id: 'velocity',     label: 'Sprint Velocity',    unit: 'pts',   color: '#00E5FF' },
      { id: 'throughput',   label: 'Throughput',         unit: 'PRs/wk',color: '#B44CFF' },
    ],
  },
];

const METRIC_DATA = {
  'deploy-freq':  makeTimeSeries(30, 4.2,  1.8,  0.04, 11),
  'lead-time':    makeTimeSeries(30, 38,   15,  -0.3,  22),
  'cfr':          makeTimeSeries(30, 4.5,  1.8, -0.08, 33),
  'mttr':         makeTimeSeries(30, 44,   18,  -1.2,  44),
  'ci-pass':      makeTimeSeries(30, 88,   6,    0.2,  55),
  'ci-duration':  makeTimeSeries(30, 4.8,  1.2, -0.04, 66),
  'ci-queue':     makeTimeSeries(30, 38,   12,  -0.5,  77),
  'pr-cycle':     makeTimeSeries(30, 22,   8,    0.2,  88),
  'pr-review':    makeTimeSeries(30, 14,   5,    0.1,  99),
  'pr-merge':     makeTimeSeries(30, 84,   5,    0.1, 111),
  'velocity':     makeTimeSeries(30, 72,  12,    0.4, 122),
  'throughput':   makeTimeSeries(30, 8.4,  3,    0.1, 133),
};

const METRIC_COMPARE = Object.fromEntries(
  Object.entries(METRIC_DATA).map(([k, v]) => [k, makeTimeSeries(30, v[0] * 1.05, Math.abs(v[v.length-1] - v[0]) * 0.5, 0, parseInt(k) + 200)])
);

const TIME_RANGES = ['7d', '14d', '30d', '90d'];

const TEAMS = ['All teams', 'Platform', 'Backend', 'Frontend', 'Mobile', 'Data'];
const REPOS = ['All repos', 'monorepo', 'api-gateway', 'frontend-app', 'mobile-app', 'data-pipeline'];

// ─── DORA score badge ─────────────────────────────────────────────────────────
const DORALevel = ({ level }) => {
  const map = {
    Elite: ['#00C853', 'rgba(0,200,83,0.12)'],
    High:  ['#00E5FF', 'rgba(0,229,255,0.12)'],
    Med:   ['#FF9100', 'rgba(255,145,0,0.12)'],
    Low:   ['#FF1744', 'rgba(255,23,68,0.12)'],
  };
  const [c, bg] = map[level] || map['Med'];
  return (
    <span style={{ fontSize: 10.5, color: c, background: bg, border: `1px solid ${c}30`, borderRadius: 4, padding: '2px 8px', fontFamily: 'var(--font-mono)' }}>
      {level}
    </span>
  );
};

// ─── DORA summary panel ───────────────────────────────────────────────────────
const DORAPanel = ({ onSelect, selected }) => {
  const cards = [
    { id: 'deploy-freq', label: 'Deployment Frequency', value: '4.2/day', delta: '+0.8', good: true, level: 'Elite', color: '#00E5FF', icon: 'zap', note: 'On-demand (multiple/day)' },
    { id: 'lead-time',   label: 'Lead Time for Changes', value: '38h',    delta: '−6h',  good: true, level: 'High',  color: '#B44CFF', icon: 'clock', note: '1 day – 1 week range' },
    { id: 'cfr',         label: 'Change Failure Rate',   value: '3.2%',   delta: '−1.1%',good: true, level: 'Elite', color: '#FF9100', icon: 'alertTri', note: '0–15% is Elite' },
    { id: 'mttr',        label: 'MTTR',                  value: '18 min', delta: '−6 min',good: true, level: 'Elite', color: '#00C853', icon: 'activity', note: 'Less than 1 hour = Elite' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
      {cards.map((c, i) => {
        const isSelected = selected === c.id;
        return (
          <div key={c.id} className={`fade-up-${i+1}`}
            onClick={() => onSelect(c.id)}
            style={{
              background: isSelected ? 'var(--glass2)' : 'var(--glass)',
              border: isSelected ? `1px solid ${c.color}55` : '1px solid var(--border)',
              borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
              boxShadow: isSelected ? `0 0 16px ${c.color}18` : 'none',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border2)'; }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <Icon name={c.icon} size={14} color={c.color} />
              <DORALevel level={c.level} />
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>{c.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 11, color: c.good ? '#00C853' : '#FF1744', fontFamily: 'var(--font-mono)' }}>{c.delta}</span>
              <span style={{ fontSize: 10, color: 'var(--muted)', opacity: 0.7 }}>{c.note}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Metric tree item ─────────────────────────────────────────────────────────
const TreeItem = ({ item, depth = 0, selected, onSelect, expandedGroups, toggleGroup }) => {
  const isGroup = !!item.children;
  const isExpanded = expandedGroups.includes(item.id);

  if (isGroup) {
    return (
      <div>
        <div
          onClick={() => toggleGroup(item.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px',
            cursor: 'pointer', borderRadius: 6, transition: 'background 0.12s',
            color: 'var(--muted2)', fontSize: 12.5, fontWeight: 500,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Icon name={item.icon || 'layers'} size={13} color="var(--muted)" />
          <span style={{ flex: 1 }}>{item.label}</span>
          <div style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>
            <Icon name="chevronDown" size={12} color="var(--muted)" />
          </div>
        </div>
        {isExpanded && item.children.map(child => (
          <TreeItem key={child.id} item={child} depth={depth + 1} selected={selected} onSelect={onSelect} expandedGroups={expandedGroups} toggleGroup={toggleGroup} />
        ))}
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(item.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px 6px 26px',
        cursor: 'pointer', borderRadius: 6, transition: 'all 0.12s',
        background: selected === item.id ? `${item.color}15` : 'transparent',
        color: selected === item.id ? item.color : 'var(--muted2)',
        fontSize: 12.5, borderLeft: selected === item.id ? `2px solid ${item.color}` : '2px solid transparent',
        marginLeft: 8,
      }}
      onMouseEnter={e => { if (selected !== item.id) { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; } }}
      onMouseLeave={e => { if (selected !== item.id) { e.currentTarget.style.color = 'var(--muted2)'; e.currentTarget.style.background = 'transparent'; } }}
    >
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{item.label}</span>
      <span style={{ fontSize: 10, opacity: 0.5, fontFamily: 'var(--font-mono)' }}>{item.unit}</span>
    </div>
  );
};

// ─── Filter pill ──────────────────────────────────────────────────────────────
const FilterPill = ({ label, options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7,
        background: value !== options[0] ? 'rgba(0,229,255,0.1)' : 'var(--glass)',
        border: value !== options[0] ? '1px solid rgba(0,229,255,0.25)' : '1px solid var(--border)',
        color: value !== options[0] ? 'var(--cyan)' : 'var(--muted2)',
        fontFamily: 'var(--font-body)', fontSize: 12.5, cursor: 'pointer',
        transition: 'all 0.15s',
      }}>
        {value} <Icon name="chevronDown" size={11} color="currentColor" />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100,
          background: '#1a2235', border: '1px solid var(--border2)', borderRadius: 9,
          minWidth: 150, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}>
          {options.map(opt => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); }}
              style={{
                padding: '9px 14px', cursor: 'pointer', fontSize: 13,
                color: value === opt ? 'var(--cyan)' : 'var(--text)',
                background: value === opt ? 'rgba(0,229,255,0.08)' : 'transparent',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (value !== opt) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (value !== opt) e.currentTarget.style.background = 'transparent'; }}
            >{opt}</div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Breakdown table ──────────────────────────────────────────────────────────
const BreakdownTable = ({ metricId }) => {
  const rows = {
    'deploy-freq': [
      ['api-gateway',   'Platform', '6.2/day', 'Elite', '+1.4'],
      ['frontend-app',  'Frontend', '3.8/day', 'Elite', '+0.6'],
      ['mobile-app',    'Mobile',   '1.2/day', 'High',  '−0.3'],
      ['data-pipeline', 'Data',     '0.4/day', 'Med',   '+0.1'],
      ['auth-service',  'Backend',  '5.1/day', 'Elite', '+0.9'],
    ],
    'lead-time': [
      ['Platform', '—', '28h', 'High',  '−4h'],
      ['Backend',  '—', '22h', 'High',  '−8h'],
      ['Frontend', '—', '52h', 'Med',   '+3h'],
      ['Mobile',   '—', '61h', 'Med',   '−2h'],
      ['Data',     '—', '44h', 'High',  '−5h'],
    ],
  };
  const data = rows[metricId] || rows['deploy-freq'];
  return (
    <DataTable
      columns={['Repository / Team', 'Team', 'Value', 'DORA Level', 'vs prev']}
      rows={data.map(r => [r[0], r[1], <span style={{fontFamily:'var(--font-mono)',color:'var(--text)'}}>{r[2]}</span>, <DORALevel level={r[3]}/>, <span style={{fontFamily:'var(--font-mono)',color:r[4].startsWith('+')&&r[4]!=='+0.0'?'#00C853':'#FF9100'}}>{r[4]}</span>])}
    />
  );
};

// ─── Export bar ───────────────────────────────────────────────────────────────
const ExportBar = () => {
  const [shown, setShown] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setShown(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 7,
        background: 'var(--glass)', border: '1px solid var(--border)',
        color: 'var(--muted2)', fontFamily: 'var(--font-body)', fontSize: 12.5, cursor: 'pointer',
      }}>
        <Icon name="download" size={13} /> Export
      </button>
      {shown && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 100,
          background: '#1a2235', border: '1px solid var(--border2)', borderRadius: 9,
          minWidth: 140, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden',
        }}>
          {['CSV', 'PDF Report', 'Slack Digest'].map(opt => (
            <div key={opt} onClick={() => setShown(false)}
              style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 13, color: 'var(--text)', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >{opt}</div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── MetricsScreen ────────────────────────────────────────────────────────────
const MetricsScreen = () => {
  const [selected, setSelected] = useState('deploy-freq');
  const [timeRange, setTimeRange] = useState('30d');
  const [compareMode, setCompareMode] = useState(false);
  const [team, setTeam] = useState('All teams');
  const [repo, setRepo] = useState('All repos');
  const [expandedGroups, setExpandedGroups] = useState(['dora', 'ci']);

  const toggleGroup = (id) => setExpandedGroups(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const allMetrics = METRIC_TREE.flatMap(g => g.children || []);
  const currentMetric = allMetrics.find(m => m.id === selected) || allMetrics[0];
  const data = METRIC_DATA[selected] || [];
  const compareData = METRIC_COMPARE[selected] || [];

  const slicedData = timeRange === '7d' ? data.slice(-7) : timeRange === '14d' ? data.slice(-14) : timeRange === '90d' ? [...data, ...makeTimeSeries(60, data[data.length-1], 5, 0, parseInt(selected)+500)] : data;
  const slicedCompare = timeRange === '7d' ? compareData.slice(-7) : timeRange === '14d' ? compareData.slice(-14) : compareData;

  const currentValue = slicedData[slicedData.length - 1];
  const prevValue = slicedData[0];
  const delta = currentValue - prevValue;
  const deltaStr = (delta >= 0 ? '+' : '') + (Math.abs(delta) < 10 ? delta.toFixed(1) : Math.round(delta));

  const isDORA = ['deploy-freq','lead-time','cfr','mttr'].includes(selected);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* Left: metric tree */}
      <div style={{
        width: 220, flexShrink: 0, borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        background: 'rgba(11,15,25,0.5)',
      }}>
        <div style={{ padding: '14px 10px 8px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', color: 'var(--muted)', textTransform: 'uppercase', padding: '0 4px', marginBottom: 8 }}>Metrics</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 10px' }}>
            <Icon name="search" size={12} color="var(--muted)" />
            <input placeholder="Filter…" style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 12.5, fontFamily: 'var(--font-body)', width: '100%' }} />
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 4px' }}>
          {METRIC_TREE.map(group => (
            <TreeItem key={group.id} item={group} selected={selected} onSelect={setSelected} expandedGroups={expandedGroups} toggleGroup={toggleGroup} />
          ))}
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
          borderBottom: '1px solid var(--border)', flexShrink: 0,
          background: 'rgba(11,15,25,0.4)',
        }}>
          {/* Time range */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 8, padding: 2 }}>
            {TIME_RANGES.map(t => (
              <button key={t} onClick={() => setTimeRange(t)} style={{
                padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: timeRange === t ? 'rgba(0,229,255,0.15)' : 'transparent',
                color: timeRange === t ? 'var(--cyan)' : 'var(--muted2)',
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: timeRange === t ? 600 : 400,
                transition: 'all 0.12s',
              }}>{t}</button>
            ))}
          </div>

          <FilterPill label="Team" options={TEAMS} value={team} onChange={setTeam} />
          <FilterPill label="Repo" options={REPOS} value={repo} onChange={setRepo} />

          {/* Compare toggle */}
          <button onClick={() => setCompareMode(c => !c)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 7, cursor: 'pointer',
            background: compareMode ? 'rgba(180,76,255,0.12)' : 'var(--glass)',
            border: compareMode ? '1px solid rgba(180,76,255,0.3)' : '1px solid var(--border)',
            color: compareMode ? 'var(--purple)' : 'var(--muted2)',
            fontFamily: 'var(--font-body)', fontSize: 12.5, transition: 'all 0.15s',
          }}>
            <Icon name="layers" size={13} color="currentColor" />
            Compare {compareMode ? 'ON' : 'OFF'}
          </button>

          <div style={{ flex: 1 }} />
          <ExportBar />

          {/* Refresh */}
          <button style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7,
            background: 'var(--glass)', border: '1px solid var(--border)',
            color: 'var(--muted2)', fontFamily: 'var(--font-body)', fontSize: 12.5, cursor: 'pointer',
          }}>
            <Icon name="activity" size={13} /> Auto ▾
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '18px 20px' }}>

          {/* DORA overview (shown when a DORA metric is selected) */}
          {isDORA && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>DORA Metrics</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Click a metric to drill in</span>
              </div>
              <DORAPanel onSelect={setSelected} selected={selected} />
            </div>
          )}

          {/* Selected metric chart */}
          <div className="fade-up" style={{
            background: 'var(--glass)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '18px 20px', marginBottom: 16,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: currentMetric?.color || 'var(--cyan)' }} />
                  <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{currentMetric?.label}</span>
                  {team !== 'All teams' && <span style={{ fontSize: 11, color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 4 }}>{team}</span>}
                  {repo !== 'All repos' && <span style={{ fontSize: 11, color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 4 }}>{repo}</span>}
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                    {currentValue >= 100 ? Math.round(currentValue) : currentValue.toFixed(1)}{currentMetric?.unit?.startsWith('%') ? '%' : ''}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{currentMetric?.unit?.startsWith('%') ? '' : currentMetric?.unit}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: delta <= 0 && ['lead-time','cfr','mttr','ci-duration','ci-queue','pr-cycle','pr-review'].includes(selected) ? '#00C853' : delta >= 0 && !['lead-time','cfr','mttr','ci-duration','ci-queue','pr-cycle','pr-review'].includes(selected) ? '#00C853' : '#FF1744' }}>
                    {deltaStr} {currentMetric?.unit?.startsWith('%') ? 'pp' : currentMetric?.unit} vs {timeRange} ago
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['Area', 'Bar', 'Table'].map(t => (
                  <button key={t} style={{ padding: '4px 9px', borderRadius: 6, fontSize: 12, border: '1px solid var(--border)', background: t === 'Area' ? 'rgba(0,229,255,0.1)' : 'transparent', color: t === 'Area' ? 'var(--cyan)' : 'var(--muted2)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{t}</button>
                ))}
              </div>
            </div>

            {/* Chart */}
            <AreaChart
              data={slicedData}
              compare={compareMode ? slicedCompare : null}
              color={currentMetric?.color || '#00E5FF'}
              height={180}
              labels={WEEK_LABELS_30.slice(-slicedData.length)}
            />
          </div>

          {/* Breakdown */}
          <div className="fade-up-1" style={{
            background: 'var(--glass)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '18px 20px', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>Breakdown</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Per repo / team</span>
            </div>
            <BreakdownTable metricId={selected} />
          </div>

          {/* Custom formula */}
          <div className="fade-up-2" style={{
            background: 'var(--glass)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '16px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>Custom Formula</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Computed metric</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{
                flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--cyan)',
                background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.15)',
                borderRadius: 8, padding: '10px 14px',
              }}>
                deploy_frequency * (1 - change_failure_rate / 100)
              </div>
              <button style={{
                padding: '9px 16px', borderRadius: 8, background: 'rgba(0,229,255,0.1)',
                border: '1px solid rgba(0,229,255,0.2)', color: 'var(--cyan)',
                fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer',
              }}>Run</button>
            </div>
            <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--muted)' }}>Result: <span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>4.07 adjusted deploys/day</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { MetricsScreen });
