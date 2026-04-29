import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../api/client'

interface VelocityData {
  date: string;
  tasks: number;
}

interface CycleTimeData {
  date: string;
  type: string;
  count: number;
}

interface LeadTimeData {
  date: string;
  count: number;
}

interface VelocityResponse {
  team_id: string;
  velocity: VelocityData[];
  cycle_time: CycleTimeData[];
  lead_time: LeadTimeData[];
}

export function Velocity({ teamId }: { teamId: string }) {
  const [data, setData] = useState<VelocityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    api.getVelocity(teamId)
      .then(res => { setData(res.data); setLoading(false) })
      .catch(err => { 
        console.error(err); 
        setError(err.message || 'Failed to load velocity data')
        setLoading(false) 
      })
  }, [teamId])

  if (loading) return <div>Loading velocity...</div>
  if (error) return <div style={{ color: '#d32f2f', padding: '24px', textAlign: 'center' }}>
    <div style={{ fontSize: '16px', marginBottom: '8px' }}>Error: {error}</div>
    <button onClick={() => { setLoading(true); setError(null); api.getVelocity(teamId).then(res => { setData(res.data); setLoading(false) }).catch(err => { setError(err.message || 'Failed to load velocity data'); setLoading(false) }) }} 
      style={{ padding: '8px 16px', cursor: 'pointer', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px' }}>
      Retry
    </button>
  </div>
  if (!data) return <div>No velocity data</div>

  return (
    <div style={{ padding: '24px' }}>
      <h2>Velocity & Cycle Time</h2>
      
      <div style={{ height: '300px' }}>
        <h3>Tasks Completed (Last 30 days)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.velocity}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="tasks" stroke="#8884d8" name="Tasks" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ height: '300px', marginTop: '24px' }}>
        <h3>Lead Time (PR Merge Time)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.lead_time}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#82ca9d" name="PRs Merged" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}