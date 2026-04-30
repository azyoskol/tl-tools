import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '../api/client'
import { ActivityItem } from '../types'

export function ActivityChart({ teamId }: { teamId: string }) {
  const [data, setData] = useState<Record<string, { date: string; [key: string]: string | number }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getActivity(teamId).then(res => {
      const raw: ActivityItem[] = res.data
      console.log('Activity data:', raw)
      const grouped: Record<string, { date: string; [key: string]: string | number }> = {}
      raw.forEach((r) => {
        if (!grouped[r.date]) grouped[r.date] = { date: r.date }
        grouped[r.date][r.source] = ((grouped[r.date][r.source] as number) || 0) + r.count
      })
      console.log('Grouped:', grouped)
      setData(grouped)
      setLoading(false)
    }).catch(err => { console.error('Activity error:', err); setLoading(false) })
  }, [teamId])

  if (loading) return <div style={{ marginTop: '32px' }}>Loading chart...</div>
  if (Object.keys(data).length === 0) return <div style={{ marginTop: '32px' }}>No activity data</div>

  return (
    <div style={{ marginTop: '32px', height: '300px' }}>
      <h3>Activity (Last 7 Days)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={Object.values(data)}>
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
  )
}