import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '../api/client'
import { Heatmap } from './Heatmap'

interface ActivityData {
  date: string
  source: string
  event: string
  count: number
}

interface ActivityRow {
  date: string
  git?: number
  pm?: number
  cicd?: number
  [key: string]: string | number | undefined
}

interface Filters {
  source: string
  from: string
  to: string
}

export function ActivityPage({ teamId }: { teamId: string }) {
  const [data, setData] = useState<ActivityRow[]>([])
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({})
  const [filters, setFilters] = useState<Filters>({ source: '', from: '', to: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.source) params.append('source', filters.source)
    if (filters.from) params.append('from_date', filters.from)
    if (filters.to) params.append('to_date', filters.to)
    
    api.getActivityWithFilters(teamId, params.toString())
      .then(res => {
        const grouped: Record<string, any> = {}
        const events: Record<string, number> = {}
        res.data.data.forEach((r: ActivityData) => {
          if (!grouped[r.date]) grouped[r.date] = { date: r.date }
          grouped[r.date][r.source] = (grouped[r.date][r.source] || 0) + r.count
          events[r.event] = (events[r.event] || 0) + r.count
        })
        setData(Object.values(grouped))
        setEventCounts(events)
        setLoading(false)
      })
      .catch(err => { console.error(err); setLoading(false) })
  }, [teamId, filters])

  const topSources = React.useMemo(() => {
    const counts: Record<string, number> = {}
    data.forEach(d => {
      Object.keys(d).forEach(k => {
        if (k !== 'date') {
          const val = d[k]
          counts[k] = (counts[k] || 0) + (typeof val === 'number' ? val : 0)
        }
      })
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3)
  }, [data])

  const topEvents = React.useMemo(() => {
    return Object.entries(eventCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
  }, [eventCounts])

  if (loading) return <div>Loading activity...</div>

  return (
    <div style={{ padding: '24px' }}>
      <h2>Activity Details</h2>
      
      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
        <select 
          value={filters.source} 
          onChange={e => setFilters({...filters, source: e.target.value})}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="">All Sources</option>
          <option value="git">Git</option>
          <option value="pm">PM</option>
          <option value="cicd">CI/CD</option>
        </select>
        <input 
          type="date" 
          value={filters.from}
          onChange={e => setFilters({...filters, from: e.target.value})}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <input 
          type="date" 
          value={filters.to}
          onChange={e => setFilters({...filters, to: e.target.value})}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="git" fill="#8884d8" name="Git" />
            <Bar dataKey="pm" fill="#82ca9d" name="PM" />
            <Bar dataKey="cicd" fill="#ffc658" name="CI/CD" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Heatmap teamId={teamId} filters={filters} />

      <div style={{ marginTop: '24px' }}>
        <h3>Top Contributors</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <h4>Top Sources</h4>
            <ul>
              {topSources.map(([source, count]: [string, number]) => (
                <li key={source}>{source}: {count} events</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Top Event Types</h4>
            <ul>
              {topEvents.map(([event, count]: [string, number]) => (
                <li key={event}>{event}: {count} events</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}