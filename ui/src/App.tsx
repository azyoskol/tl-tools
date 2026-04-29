import { useState } from 'react'
import { TeamSelector } from './components/TeamSelector'
import { Overview } from './components/Overview'
import { ActivityChart } from './components/ActivityChart'
import { AttentionItems } from './components/AttentionItems'
import { Dashboard } from './components/Dashboard'

export default function App() {
  const [teamId, setTeamId] = useState<string>('')
  const [showDashboard, setShowDashboard] = useState(true)

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Team Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => setShowDashboard(true)} style={showDashboard ? activeBtnStyle : btnStyle}>
            Overview
          </button>
          <TeamSelector onSelect={(id) => { setTeamId(id); setShowDashboard(false) }} />
        </div>
      </header>
      {showDashboard ? (
        <Dashboard />
      ) : teamId ? (
        <main>
          <Overview teamId={teamId} />
          <ActivityChart teamId={teamId} />
          <AttentionItems teamId={teamId} />
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