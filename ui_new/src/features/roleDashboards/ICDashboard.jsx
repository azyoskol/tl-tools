import React from 'react';
import { StatCard, Widget, InlineInsight, SH } from '../../components/ui';
import { AreaChart } from '../../components/charts';
import { DataTable } from '../../components/ui/DataTable';
import { Icon } from '../../components/shared/Icon';
import { makeTimeSeries } from '../../utils/seeds';

export const ICDashboard = () => {
  const myBuilds = makeTimeSeries(14, 85, 15, 0.5, 77);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
      <StatCard icon="gitPR" label="My Open PRs" value="3" sub="1 needs rebase" trend="same" trendDir="neutral" color="cyan" delay={0} />
      <StatCard icon="activity" label="My CI Pass Rate" value="88%" trend="+4%" trendDir="up" color="success" spark={makeTimeSeries(10, 82, 8, 0.4, 88)} delay={1} />
      <StatCard icon="clock" label="Avg Review Received" value="6.4h" trend="+1.1h" trendDir="down" color="warning" delay={2} />
      <StatCard icon="boxes" label="Sprint Points" value="18/26" sub="4 days left" trend="on track" trendDir="up" color="purple" delay={3} />

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

      <div className="fade-up-3" style={{ gridColumn: 'span 2' }}>
        <Widget>
          <SH title="My CI Pass Rate" right="Last 14 days" />
          <AreaChart data={myBuilds} color="#00C853" height={120} labels={Array.from({ length: 14 }, (_, i) => `D${i + 1}`)} />
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