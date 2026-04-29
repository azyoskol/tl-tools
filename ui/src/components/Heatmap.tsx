import { useEffect, useState } from 'react'
import { api } from '../api/client'

interface HeatmapData {
  key: string
  count: number
}

interface Filters {
  source?: string
  from?: string
  to?: string
}

interface ActivityItem {
  date: string
  source: string
  event: string
  count: number
}

export function Heatmap({ teamId, filters }: { teamId: string; filters?: Filters }) {
  const [data, setData] = useState<HeatmapData[]>([])

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters?.source) params.append('source', filters.source)
    if (filters?.from) params.append('from_date', filters.from)
    if (filters?.to) params.append('to_date', filters.to)
    
    api.getActivityWithFilters(teamId, params.toString()).then(res => {
      const hourly: Record<string, number> = {}
      res.data.data.forEach((r: ActivityItem) => {
        const day = r.date
        const source = r.source
        const key = `${day}-${source}`
        hourly[key] = (hourly[key] || 0) + r.count
      })
      setData(Object.entries(hourly).map(([k, v]) => ({ key: k, count: v as number })))
    })
  }, [teamId, filters])

  return (
    <div style={{ marginTop: '24px' }}>
      <h3>Activity Heatmap</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} style={{ textAlign: 'center', padding: '8px', background: '#f5f5f5' }}>{day}</div>
        ))}
        {data.slice(0, 21).map((d, i) => (
          <div key={i} style={{ 
            padding: '16px', 
            background: `rgba(24, 144, 255, ${Math.min(d.count / 10, 1)})`,
            textAlign: 'center'
          }}>
            {d.count}
          </div>
        ))}
      </div>
    </div>
  )
}