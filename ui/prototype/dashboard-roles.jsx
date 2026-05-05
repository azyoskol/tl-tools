// dashboard-roles.jsx — Role-based dashboards: CTO, VP Eng, Tech Lead, DevOps, IC
// Requires: charts.jsx, shared components from Metraly.html (Icon via window)

const { useState, useMemo } = React;

// ─── Stat Card (compact, used inside role dashboards) ────────────────────────
const StatCard = ({ icon, label, value, sub, trend, trendDir, color, spark, delay = 0 }) => {
  const [hov, setHov] = useState(false);
  const colors = { cyan: '#00E5FF', purple: '#B44CFF', success: '#00C853', warning: '#FF9100', error: '#FF1744' };
  const c = colors[color] || color || '#00E5FF';
  return (
    <div className={`fade-up-${delay + 1}`}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'var(--glass2)' : 'var(--glass)',
        border: `1px solid ${hov ? 'rgba(255,255,255,0.12)' : 'var(--border)'}`,
        borderRadius: 12, padding: '16px 16px 13px',
        display: 'flex', flexDirection: 'column', gap: 10,
        transition: 'all 0.2s ease',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? `0 6px 24px rgba(0,0,0,0.35)` : 'none',
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${c}18`, border: `1px solid ${c}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={15} color={c} />
        </div>
        {trend && (
          <span style={{
            fontSize: 11, fontFamily: 'var(--font-mono)',
            color: trendDir === 'up' ? '#00C853' : trendDir === 'down' ? '#FF1744' : 'var(--muted)',
            background: trendDir === 'up' ? 'rgba(0,200,83,0.1)' : trendDir === 'down' ? 'rgba(255,23,68,0.1)' : 'rgba(107,122,154,0.12)',
            border: `1px solid ${trendDir === 'up' ? 'rgba(0,200,83,0.2)' : trendDir === 'down' ? 'rgba(255,23,68,0.2)' : 'rgba(107,122,154,0.15)'}`,
            borderRadius: 5, padding: '2px 6px',
          }}>{trend}</span>
        )}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--muted)', opacity: 0.7, marginTop: 2 }}>{sub}</div>}
      </div>
      {spark && <MiniSparkline data={spark} color={c} height={28} />}
    </div>
  );
};

// ─── Section header ───────────────────────────────────────────────────────────
const SH = ({ title, right }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: 4 }}>
    <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{title}</span>
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    {right && <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{right}</span>}
  </div>
);

// ─── Widget wrapper ───────────────────────────────────────────────────────────
const Widget = ({ children, style = {}, className = '' }) => (
  <div className={className} style={{
    background: 'var(--glass)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '16px 18px',
    ...style,
  }}>{children}</div>
);

// ─── AI Insight inline ────────────────────────────────────────────────────────
const InlineInsight = ({ text, action }) => (
  <div style={{
    background: 'rgba(180,76,255,0.06)', border: '1px solid rgba(180,76,255,0.18)',
    borderRadius: 10, padding: '12px 14px',
    display: 'flex', gap: 10, alignItems: 'flex-start',
  }}>
    <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(180,76,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
      <Icon name="sparkles" size={12} color="#B44CFF" />
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 12.5, color: 'var(--muted2)', lineHeight: 1.55, margin: 0 }}>{text}</p>
      {action && (
        <button style={{ marginTop: 8, fontSize: 11.5, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {action} <Icon name="arrowRight" size={11} color="var(--cyan)" />
        </button>
      )}
    </div>
  </div>
);

// ─── Status badge ─────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const map = {
    'On track': ['#00C853', 'rgba(0,200,83,0.12)'],
    'At risk':  ['#FF9100', 'rgba(255,145,0,0.12)'],
    'Blocked':  ['#FF1744', 'rgba(255,23,68,0.12)'],
    'Done':     ['#00C853', 'rgba(0,200,83,0.1)'],
    'Open':     ['#00E5FF', 'rgba(0,229,255,0.1)'],
  };
  const [c, bg] = map[status] || ['var(--muted)', 'rgba(107,122,154,0.1)'];
  return (
    <span style={{ fontSize: 10.5, color: c, background: bg, border: `1px solid ${c}30`, borderRadius: 4, padding: '2px 7px', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
};

// ─── CTO Dashboard ────────────────────────────────────────────────────────────
const CTODashboard = () => {
  const deployTrend = makeTimeSeries(30, 4.2, 1.5, 0.04, 11);
  const leadTimeTrend = makeTimeSeries(30, 18, 8, -0.1, 22);
  const velocityByTeam = { labels: ['Platform', 'Mobile', 'Backend', 'Frontend', 'Data'], values: [84, 71, 92, 63, 55] };
  const prevVelocity = [76, 68, 88, 70, 48];
  const weekLabels = Array.from({ length: 30 }, (_, i) => i % 5 === 0 ? `W${Math.floor(i/7)+1}` : '');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
      {/* Row 1: Stats */}
      <StatCard icon="trendingUp" label="Engineering Health" value="84" sub="out of 100" trend="+3 pts" trendDir="up" color="cyan" spark={makeTimeSeries(12, 78, 5, 0.5, 1)} delay={0} />
      <StatCard icon="zap" label="Deploy Frequency" value="4.2/day" trend="+0.8" trendDir="up" color="success" spark={makeTimeSeries(12, 3.2, 1, 0.08, 2)} delay={1} />
      <StatCard icon="clock" label="Lead Time" value="2.1 days" trend="−0.4d" trendDir="up" color="purple" spark={makeTimeSeries(12, 2.8, 0.5, -0.05, 3)} delay={2} />
      <StatCard icon="xCircle" label="Change Failure Rate" value="3.2%" trend="−1.1%" trendDir="up" color="warning" spark={makeTimeSeries(12, 5, 1.5, -0.1, 4)} delay={3} />

      {/* Row 2: Health Gauge + DORA */}
      <div className="fade-up-1" style={{ gridColumn: 'span 1' }}>
        <Widget>
          <div style={{ textAlign: 'center', paddingTop: 6 }}>
            <Gauge value={0.84} label="Health Score" size={150} />
          </div>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { k: 'Velocity', v: '92%', good: true },
              { k: 'Quality', v: '96.8%', good: true },
              { k: 'Reliability', v: '99.7%', good: true },
              { k: 'Security', v: '78%', good: false },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>{r.k}</span>
                <span style={{ color: r.good ? '#00C853' : '#FF9100', fontFamily: 'var(--font-mono)' }}>{r.v}</span>
              </div>
            ))}
          </div>
        </Widget>
      </div>

      {/* Deployment frequency */}
      <div className="fade-up-2" style={{ gridColumn: 'span 3' }}>
        <Widget>
          <SH title="Deployment Frequency" right="Last 30 days" />
          <AreaChart data={deployTrend} labels={weekLabels} color="#00E5FF" height={150} />
        </Widget>
      </div>

      {/* Row 3: Team velocity comparison + insight */}
      <div className="fade-up-3" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="Team Velocity" right="Sprint vs prev sprint" />
          <BarChart labels={velocityByTeam.labels} values={velocityByTeam.values} compare={prevVelocity} height={160} color="#00E5FF" compareColor="#B44CFF" />
          <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#00E5FF' }} /> This sprint
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#B44CFF', opacity: 0.6 }} /> Previous sprint
            </div>
          </div>
        </Widget>
      </div>

      <div className="fade-up-4" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="Lead Time for Changes" right="Days, 30-day trend" />
          <AreaChart data={leadTimeTrend} compare={makeTimeSeries(30, 22, 8, 0, 99)} labels={weekLabels} color="#B44CFF" height={150} />
        </Widget>
      </div>

      {/* AI insight full-width */}
      <div className="fade-up-5" style={{ gridColumn: 'span 4' }}>
        <InlineInsight
          text="Security score at 78% is the main drag on engineering health. 3 critical CVEs in dependencies remain unpatched across the Backend team repos (introduced 12 days ago). Addressing these would push overall health to ~89."
          action="View security report"
        />
      </div>
    </div>
  );
};

// ─── VP of Engineering Dashboard ─────────────────────────────────────────────
const VPDashboard = () => {
  const sprintVelocity = makeTimeSeries(12, 72, 12, 0.5, 55);
  const prCycleByTeam = { labels: ['Platform', 'Mobile', 'Backend', 'Frontend', 'Data'], values: [18, 24, 14, 31, 22] };
  const heatData = makeHeatData(5, 14, 0.5, 33);
  const teamLabels = ['Platform', 'Mobile', 'Backend', 'Frontend', 'Data'];
  const weekdayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S', 'M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
      <StatCard icon="zap" label="Sprint Velocity" value="76 pts" trend="+4" trendDir="up" color="cyan" spark={makeTimeSeries(12, 70, 8, 0.3, 5)} delay={0} />
      <StatCard icon="clock" label="Avg PR Cycle Time" value="22h" trend="+3h" trendDir="down" color="warning" spark={makeTimeSeries(12, 18, 5, 0.2, 6)} delay={1} />
      <StatCard icon="alertTri" label="At-Risk Deliverables" value="3" sub="of 18 active" trend="same" trendDir="neutral" color="warning" delay={2} />
      <StatCard icon="gitPR" label="Open PRs" value="31" trend="+7" trendDir="down" color="purple" spark={makeTimeSeries(12, 22, 6, 0.5, 7)} delay={3} />

      {/* Sprint velocity */}
      <div className="fade-up-2" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="Sprint Velocity Trend" right="Last 12 sprints" />
          <AreaChart data={sprintVelocity} compare={makeTimeSeries(12, 65, 10, 0.2, 200)} color="#00E5FF" height={150}
            labels={Array.from({length:12},(_,i)=>`S${i+1}`)} />
        </Widget>
      </div>

      {/* PR Cycle time by team */}
      <div className="fade-up-3" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="PR Cycle Time by Team" right="Hours" />
          <BarChart labels={prCycleByTeam.labels} values={prCycleByTeam.values} height={150} color="#B44CFF" horizontal={true} />
        </Widget>
      </div>

      {/* Team activity heatmap */}
      <div className="fade-up-4" style={{ gridColumn: 'span 3' }}>
        <Widget>
          <SH title="Team Commit Activity" right="Last 2 weeks · by day" />
          <Heatmap data={heatData} rows={5} cols={14} labelRows={teamLabels} labelCols={weekdayLabels} color="#00E5FF" cellSize={18} gap={4} />
        </Widget>
      </div>

      {/* Delivery risk table */}
      <div className="fade-up-5" style={{ gridColumn: 'span 1' }}>
        <Widget style={{ height: '100%' }}>
          <SH title="Delivery Risk" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { name: 'Auth refactor', team: 'Backend', status: 'At risk' },
              { name: 'iOS release v4.2', team: 'Mobile', status: 'Blocked' },
              { name: 'Data pipeline v2', team: 'Data', status: 'At risk' },
              { name: 'API gateway', team: 'Platform', status: 'On track' },
              { name: 'Design system', team: 'Frontend', status: 'On track' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 12.5, color: 'var(--text)' }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.team}</div>
                </div>
                <Badge status={r.status} />
              </div>
            ))}
          </div>
        </Widget>
      </div>

      <div className="fade-up-6" style={{ gridColumn: 'span 4' }}>
        <InlineInsight
          text="Frontend team PR cycle time is 31h — 41% above the org median. Most of the delay is in review wait time, not implementation. Consider auto-assigning reviewers and setting a 4h SLA on initial review."
          action="Configure auto-assign"
        />
      </div>
    </div>
  );
};

// ─── Tech Lead Dashboard ──────────────────────────────────────────────────────
const TLDashboard = () => {
  const ciPassRate = makeTimeSeries(21, 88, 8, 0.3, 13);
  const burndown = makeTimeSeries(14, 58, 6, -3.8, 14);
  const dayLabels = Array.from({ length: 14 }, (_, i) => `D${i + 1}`);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
      <StatCard icon="activity" label="CI Pass Rate (7d)" value="92.4%" trend="+2.1%" trendDir="up" color="success" spark={makeTimeSeries(12, 88, 5, 0.2, 8)} delay={0} />
      <StatCard icon="gitPR" label="PRs Awaiting Review" value="8" sub="3 older than 24h" trend="+2" trendDir="down" color="warning" delay={1} />
      <StatCard icon="clock" label="Avg Build Time" value="4m 18s" trend="−22s" trendDir="up" color="cyan" spark={makeTimeSeries(12, 5.2, 0.8, -0.08, 9)} delay={2} />
      <StatCard icon="alertTri" label="Flaky Tests" value="7" sub="in api-gateway" trend="+2" trendDir="down" color="error" delay={3} />

      {/* CI pass rate trend */}
      <div className="fade-up-2" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="CI Pass Rate" right="Last 3 weeks" />
          <AreaChart data={ciPassRate} color="#00C853" height={150}
            labels={Array.from({length:21},(_,i)=>i%7===0?`W${Math.floor(i/7)+1}`:'')} />
        </Widget>
      </div>

      {/* Sprint burndown */}
      <div className="fade-up-3" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="Sprint Burndown" right="14 days remaining" />
          <AreaChart data={burndown} compare={makeTimeSeries(14, 58, 0, -58/14, 999)} color="#00E5FF" compareColor="#6B7A9A" height={150} labels={dayLabels} />
        </Widget>
      </div>

      {/* PR review queue */}
      <div className="fade-up-4" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="PR Review Queue" />
          <DataTable
            columns={['Pull Request', 'Author', 'Age', 'Status']}
            rows={[
              ['feat/auth-tokens', '@j.kim', '3h', <Badge status="Open" />],
              ['fix/rate-limit', '@s.chen', '8h', <Badge status="Open" />],
              ['refactor/api-layer', '@m.patel', '19h', <Badge status="Open" />],
              ['chore/deps-update', '@j.kim', '26h', <Badge status="Open" />],
              ['feat/webhooks-v2', '@a.garcia', '31h', <Badge status="Blocked" />],
            ]}
          />
        </Widget>
      </div>

      {/* Failing builds */}
      <div className="fade-up-5" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="Recent Failures" right="Last 24h" />
          <DataTable
            columns={['Workflow', 'Repo', 'Failed at']}
            rows={[
              ['integration-tests', 'api-gateway', '2h ago'],
              ['docker-build', 'monorepo', '5h ago'],
              ['e2e-suite', 'frontend', '9h ago'],
              ['security-scan', 'auth-service', '14h ago'],
            ]}
          />
        </Widget>
      </div>

      <div className="fade-up-6" style={{ gridColumn: 'span 4' }}>
        <InlineInsight
          text="7 flaky tests in api-gateway have caused 12 false CI failures this week. The tests relate to async timeout handling introduced in feat/webhooks-v2. Fixing or quarantining them would recover ~18 wasted engineer-hours per week."
          action="View flaky tests"
        />
      </div>
    </div>
  );
};

// ─── DevOps / SRE Dashboard ───────────────────────────────────────────────────
const DevOpsDashboard = () => {
  const deployFreq = makeTimeSeries(14, 3.8, 2, 0.1, 44);
  const mttrTrend = makeTimeSeries(12, 42, 20, -2, 55);
  const deployHeatData = makeHeatData(7, 16, 0.45, 66);
  const dayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
      <StatCard icon="zap" label="Deploy Freq (7d avg)" value="4.1/day" trend="+0.6" trendDir="up" color="success" spark={makeTimeSeries(12, 3.2, 1.2, 0.07, 10)} delay={0} />
      <StatCard icon="clock" label="MTTR" value="18 min" sub="p50 incidents" trend="−6 min" trendDir="up" color="cyan" spark={makeTimeSeries(12, 28, 10, -0.8, 11)} delay={1} />
      <StatCard icon="alertTri" label="Change Failure Rate" value="2.8%" trend="−0.9%" trendDir="up" color="warning" spark={makeTimeSeries(12, 4.5, 1.2, -0.12, 12)} delay={2} />
      <StatCard icon="activity" label="Service Uptime" value="99.91%" trend="+0.04%" trendDir="up" color="success" delay={3} />

      {/* Deploy frequency */}
      <div className="fade-up-2" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="Deploy Frequency" right="Deploys/day — 14d" />
          <AreaChart data={deployFreq} color="#00C853" height={150}
            labels={Array.from({length:14},(_,i)=>`D${i+1}`)} />
        </Widget>
      </div>

      {/* MTTR trend */}
      <div className="fade-up-3" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="MTTR Trend" right="Minutes" />
          <AreaChart data={mttrTrend} color="#FF9100" height={150}
            labels={Array.from({length:12},(_,i)=>`W${i+1}`)} />
        </Widget>
      </div>

      {/* Deploy heatmap */}
      <div className="fade-up-4" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="Deploy Activity" right="Last 16 days by weekday" />
          <Heatmap data={deployHeatData} rows={7} cols={16} labelRows={dayLabels} color="#00C853" cellSize={16} gap={3} />
        </Widget>
      </div>

      {/* Incidents */}
      <div className="fade-up-5" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="Recent Incidents" right="Last 7 days" />
          <DataTable
            columns={['Service', 'Severity', 'MTTR', 'Status']}
            rows={[
              ['api-gateway', 'P1', '12 min', <Badge status="Done" />],
              ['auth-service', 'P2', '31 min', <Badge status="Done" />],
              ['data-pipeline', 'P2', '—', <Badge status="Open" />],
              ['cdn-proxy', 'P3', '8 min', <Badge status="Done" />],
              ['notification-svc', 'P3', '—', <Badge status="Open" />],
            ]}
          />
        </Widget>
      </div>

      <div className="fade-up-6" style={{ gridColumn: 'span 4' }}>
        <InlineInsight
          text="Two open P2/P3 incidents have no assigned responder. data-pipeline has been degraded for 4.2 hours. Auto-escalation is not configured — recommend enabling PagerDuty escalation policy for services without active ownership."
          action="Configure escalation"
        />
      </div>
    </div>
  );
};

// ─── Individual Contributor Dashboard ────────────────────────────────────────
const ICDashboard = () => {
  const myBuilds = makeTimeSeries(14, 85, 15, 0.5, 77);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
      <StatCard icon="gitPR" label="My Open PRs" value="3" sub="1 needs rebase" trend="same" trendDir="neutral" color="cyan" delay={0} />
      <StatCard icon="activity" label="My CI Pass Rate" value="88%" trend="+4%" trendDir="up" color="success" spark={makeTimeSeries(10, 82, 8, 0.4, 88)} delay={1} />
      <StatCard icon="clock" label="Avg Review Received" value="6.4h" trend="+1.1h" trendDir="down" color="warning" delay={2} />
      <StatCard icon="boxes" label="Sprint Points" value="18/26" sub="4 days left" trend="on track" trendDir="up" color="purple" delay={3} />

      {/* My PRs */}
      <div className="fade-up-2" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="My Pull Requests" />
          <DataTable
            columns={['Title', 'Branch', 'Age', 'Reviews']}
            rows={[
              ['feat/auth-tokens', 'feat/auth-tokens', '3h', '1/2'],
              ['fix/rate-limiting', 'fix/rate-limit', '8h', '0/2'],
              ['chore/upgrade-ts', 'chore/ts-5', '2d', '2/2'],
            ]}
          />
          <button style={{ marginTop: 12, fontSize: 12, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}>
            + Open new PR →
          </button>
        </Widget>
      </div>

      {/* My CI runs */}
      <div className="fade-up-3" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="My CI Pass Rate" right="Last 14 days" />
          <AreaChart data={myBuilds} color="#00C853" height={120}
            labels={Array.from({length:14},(_,i)=>`D${i+1}`)} />
          <div style={{ marginTop: 12 }}>
            {[
              { branch: 'feat/auth-tokens', status: '✓ Pass', time: '3m 42s', ago: '1h' },
              { branch: 'feat/auth-tokens', status: '✗ Fail', time: '2m 11s', ago: '3h' },
              { branch: 'fix/rate-limit', status: '✓ Pass', time: '4m 05s', ago: '8h' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                <span style={{ color: r.status.startsWith('✓') ? '#00C853' : '#FF1744', fontFamily: 'var(--font-mono)', width: 52, flexShrink: 0 }}>{r.status}</span>
                <span style={{ flex: 1, color: 'var(--muted2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.branch}</span>
                <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{r.time}</span>
                <span style={{ color: 'var(--muted)', opacity: 0.6 }}>{r.ago}</span>
              </div>
            ))}
          </div>
        </Widget>
      </div>

      {/* Review assignments */}
      <div className="fade-up-4" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="My Review Queue" right="Assigned to me" />
          <DataTable
            columns={['PR', 'Author', 'Size', 'Waiting']}
            rows={[
              ['refactor/api-layer', '@s.chen', '+342 −89', '6h'],
              ['feat/webhooks-v2', '@a.garcia', '+218 −44', '14h'],
              ['fix/memory-leak', '@m.patel', '+31 −12', '2h'],
            ]}
          />
        </Widget>
      </div>

      {/* Sprint progress */}
      <div className="fade-up-5" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="Sprint Progress" right="Sprint 24 · 4 days left" />
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
              <span>18 of 26 points completed</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#00C853' }}>69%</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '69%', background: 'linear-gradient(90deg, #00E5FF, #00C853)', borderRadius: 4, transition: 'width 0.6s ease' }} />
            </div>
          </div>
          {[
            { task: 'Implement OAuth flow', pts: 5, done: true },
            { task: 'Add rate limiting middleware', pts: 3, done: true },
            { task: 'Write integration tests', pts: 5, done: false },
            { task: 'Update API docs', pts: 2, done: false },
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${t.done ? '#00C853' : 'var(--border2)'}`, background: t.done ? 'rgba(0,200,83,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {t.done && <Icon name="check" size={9} color="#00C853" />}
              </div>
              <span style={{ flex: 1, fontSize: 12.5, color: t.done ? 'var(--muted)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.task}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{t.pts}pt</span>
            </div>
          ))}
        </Widget>
      </div>

      <div className="fade-up-6" style={{ gridColumn: 'span 4' }}>
        <InlineInsight
          text="Your feat/auth-tokens branch has a CI failure from 3 hours ago. The test timeout in token-refresh.test.ts is likely a flaky assertion — the same test passed 4 times in the last 7 runs. Try re-running the suite."
          action="View CI run"
        />
      </div>
    </div>
  );
};

// ─── Role tabs + DashboardScreen ─────────────────────────────────────────────
const ROLES = [
  { id: 'overview', label: 'Overview', icon: 'home' },
  { id: 'cto',      label: 'CTO',      icon: 'trendingUp' },
  { id: 'vp',       label: 'VP Eng',   icon: 'users' },
  { id: 'tl',       label: 'Tech Lead',icon: 'gitPR' },
  { id: 'devops',   label: 'DevOps',   icon: 'cpu' },
  { id: 'ic',       label: 'My View',  icon: 'activity' },
];

const RoleDashboardScreen = ({ initialRole = 'cto', onNewDashboard }) => {
  const [role, setRole] = useState(initialRole);

  const renderRole = () => {
    switch (role) {
      case 'cto':    return <CTODashboard />;
      case 'vp':     return <VPDashboard />;
      case 'tl':     return <TLDashboard />;
      case 'devops': return <DevOpsDashboard />;
      case 'ic':     return <ICDashboard />;
      default:       return null; // overview handled by parent
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Role tab bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '10px 24px 0',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {ROLES.map(r => (
          <button key={r.id} onClick={() => setRole(r.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: role === r.id ? '2px solid var(--cyan)' : '2px solid transparent',
              color: role === r.id ? 'var(--cyan)' : 'var(--muted2)',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: role === r.id ? 600 : 400,
              transition: 'all 0.15s', marginBottom: -1, whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (role !== r.id) e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { if (role !== r.id) e.currentTarget.style.color = 'var(--muted2)'; }}
          >
            <Icon name={r.icon} size={13} color="currentColor" />
            {r.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={onNewDashboard} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
          background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
          color: 'var(--cyan)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 500,
          marginBottom: 6, transition: 'all 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.14)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,229,255,0.08)'}
        >
          <Icon name="plus" size={13} /> New Dashboard
        </button>
      </div>

      {/* Dashboard content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        {role === 'overview'
          ? <div style={{ color: 'var(--muted)', textAlign: 'center', marginTop: 40 }}>
              Switch to a role tab to see your dashboard
            </div>
          : renderRole()
        }
      </div>
    </div>
  );
};

Object.assign(window, { RoleDashboardScreen, StatCard, Widget, SH, InlineInsight, Badge, ROLES });
