import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '../api/client'

export function ActivityChart({ teamId }: { teamId: string }) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    api.getActivity(teamId).then(res => {
      const raw = res.data.data
      const grouped: Record<string, any> = {}
      raw.forEach((r: any) => {
        if (!grouped[r.date]) grouped[r.date] = { date: r.date }
        grouped[r.date][r.source] = (grouped[r.date][r.source] || 0) + r.count
      })
      setData(Object.values(grouped))
    })
  }, [teamId])

  return (
    <div style={{ marginTop: '32px', height: '300px' }}>
      <h3>Activity (Last 7 Days)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="git" stroke="#8884d8" name="Git" />
          <Line type="monotone" dataKey="pm" stroke="#82ca9d" name="PM" />
          <Line type="monotone" dataKey="cicd" stroke="#ffc658" name="CI/CD" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}