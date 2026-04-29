import { useState, useEffect } from 'react'
import { api } from '../api/client'

interface Team {
  id: string
  name: string
}

export function TeamSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const [teams, setTeams] = useState<Team[]>([])
  const [selected, setSelected] = useState('')

  useEffect(() => {
    api.getTeams().then(res => {
      setTeams(res.data)
      if (res.data.length > 0) {
        setSelected(res.data[0].id)
        onSelect(res.data[0].id)
      }
    })
  }, [])

  return (
    <select 
      value={selected} 
      onChange={e => { setSelected(e.target.value); onSelect(e.target.value) }}
      style={{ padding: '8px 16px', fontSize: '16px', borderRadius: '8px' }}
    >
      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  )
}