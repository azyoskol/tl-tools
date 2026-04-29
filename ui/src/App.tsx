import { useState } from 'react'
import { TeamSelector } from './components/TeamSelector'
import { Overview } from './components/Overview'
import { ActivityChart } from './components/ActivityChart'
import { AttentionItems } from './components/AttentionItems'

export default function App() {
  const [teamId, setTeamId] = useState('')

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Team Dashboard</h1>
        <TeamSelector onSelect={setTeamId} />
      </header>
      {teamId && (
        <main>
          <Overview teamId={teamId} />
          <ActivityChart teamId={teamId} />
          <AttentionItems teamId={teamId} />
        </main>
      )}
    </div>
  )
}