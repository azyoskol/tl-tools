import { useState } from 'react'
import { TeamSelector } from './components/TeamSelector'
import { Overview } from './components/Overview'
import { ActivityChart } from './components/ActivityChart'
import { ActivityPage } from './components/ActivityPage'
import { Velocity } from './components/Velocity'
import { TeamComparison } from './components/TeamComparison'
import { AttentionItems } from './components/AttentionItems'
import { Dashboard } from './components/Dashboard'

export default function App() {
  const [teamId, setTeamId] = useState<string>('')
  const [showDashboard, setShowDashboard] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Team Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => { setShowDashboard(true); setActiveTab('overview') }} style={showDashboard && activeTab === 'overview' ? activeBtnStyle : btnStyle}>
            Overview
          </button>
          <TeamSelector onSelect={(id) => { setTeamId(id); setShowDashboard(false); setActiveTab('overview') }} />
        </div>
      </header>
      {!showDashboard && teamId && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
          <button onClick={() => setActiveTab('overview')} style={activeTab === 'overview' ? activeTabStyle : tabStyle}>
            Overview
          </button>
          <button onClick={() => setActiveTab('velocity')} style={activeTab === 'velocity' ? activeTabStyle : tabStyle}>
            Velocity
          </button>
          <button onClick={() => setActiveTab('activity')} style={activeTab === 'activity' ? activeTabStyle : tabStyle}>
            Activity
          </button>
          <button onClick={() => setActiveTab('comparison')} style={activeTab === 'comparison' ? activeTabStyle : tabStyle}>
            Comparison
          </button>
        </div>
      )}
      {showDashboard ? (
        <Dashboard />
      ) : teamId ? (
        <main>
          {activeTab === 'overview' && (
            <>
              <Overview teamId={teamId} />
              <ActivityChart teamId={teamId} />
              <AttentionItems teamId={teamId} />
            </>
          )}
          {activeTab === 'velocity' && <Velocity teamId={teamId} />}
          {activeTab === 'activity' && <ActivityPage teamId={teamId} />}
          {activeTab === 'comparison' && <TeamComparison />}
        </main>
      ) : null}
    </div>
  )
}

const btnStyle = {
  padding: '8px 16px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  background: '#fff',
  cursor: 'pointer',
}

const activeBtnStyle = {
  ...btnStyle,
  background: '#1976d2',
  color: '#fff',
  borderColor: '#1976d2',
}

const tabStyle = {
  padding: '8px 16px',
  border: 'none',
  borderRadius: '4px 4px 0 0',
  background: 'transparent',
  cursor: 'pointer',
  color: '#666',
}

const activeTabStyle = {
  ...tabStyle,
  background: '#f0f0f0',
  color: '#1976d2',
  fontWeight: 500,
}