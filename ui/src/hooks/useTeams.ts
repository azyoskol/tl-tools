import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Team } from '../types'

export function useTeams() {
  const [teams, setTeams] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getTeams()
      .then(res => {
        const teamMap: Record<string, string> = {}
        res.data.forEach((t: Team) => { teamMap[t.id] = t.name })
        setTeams(teamMap)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load teams:', err)
        setError('Failed to load teams')
        setLoading(false)
      })
  }, [])

  const getTeamName = (teamId: string) => teams[teamId] || teamId.slice(0, 8)

  return { teams, loading, error, getTeamName }
}