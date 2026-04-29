import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { api } from '../api/client'
import { DashboardData } from '../types'
import { useTeams } from '../hooks/useTeams'
import { CHART_COLORS } from '../constants'



export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getTeamName } = useTeams()

  useEffect(() => {
    setError(null)
    api.getDashboard()
      .then(res => {
        setData(res.data)
        setLoading(false)
      })
      .catch(err => { 
        console.error(err); 
        setError(err.message || 'Failed to load dashboard data')
        setLoading(false) 
      })
  }, [])

  if (loading) return <div>Loading dashboard...</div>
  if (error) return <div style={{ color: '#d32f2f', padding: '24px', textAlign: 'center' }}>
    <div style={{ fontSize: '16px', marginBottom: '8px' }}>Error: {error}</div>
    <button onClick={() => { setLoading(true); setError(null); api.getDashboard().then(res => { setData(res.data); setLoading(false) }).catch(err => { setError(err.message || 'Failed to load dashboard data'); setLoading(false) }) }} 
      style={{ padding: '8px 16px', cursor: 'pointer', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px' }}>
      Retry
    </button>
  </div>
  if (!data) return <div>No data available</div>

  const { overview, activity, top_teams, hourly, top_authors } = data
  
  const grouped: Record<string, { date: string; [key: string]: string | number }> = {}
  activity.forEach((r) => {
    if (!grouped[r.date]) grouped[r.date] = { date: r.date }
    grouped[r.date][r.source] = (grouped[r.date][r.source] as number || 0) + r.count
  })
  const chartData = Object.values(grouped)

  const hourlyData = hourly.map((h) => ({
    hour: `${h.hour}:00`,
    count: h.count
  }))

  return (
    <div style={{ padding: '24px' }}>
      <h2>Overall Dashboard</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={cardStyle}>
          <div style={labelStyle}>PRs Opened (2d)</div>
          <div style={valueStyle}>{overview.prs_opened || 0}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Tasks Blocked (1d)</div>
          <div style={valueStyle}>{overview.tasks_blocked || 0}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>CI Failures (1h)</div>
          <div style={{ ...valueStyle, color: overview.ci_failures > 0 ? '#d32f2f' : undefined }}>
            {overview.ci_failures || 0}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>PRs Merged (7d)</div>
          <div style={{ ...valueStyle, color: '#2e7d32' }}>{overview.prs_merged || 0}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={{ height: '280px' }}>
          <h3>Activity by Day</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
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

        <div style={{ height: '280px' }}>
          <h3>Activity by Hour</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#0088FE" name="Events" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {top_authors.length > 0 && (
          <div>
            <h3>Top Authors</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={top_authors}
                  dataKey="count"
                  nameKey="author"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label={({ author, count }) => `${author}: ${count}`}
                >
                  {top_authors.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {top_teams.length > 0 && (
          <div>
            <h3>Top Teams</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Team</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Source</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Events</th>
                </tr>
              </thead>
              <tbody>
                {top_teams.slice(0, 5).map((t, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{getTeamName(t.team_id)}</td>
                    <td style={{ padding: '8px' }}>{t.source}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{t.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const cardStyle = {
  background: '#fff',
  borderRadius: '8px',
  padding: '16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
}

const labelStyle = {
  fontSize: '12px',
  color: '#666',
  marginBottom: '4px',
}

const valueStyle = {
  fontSize: '28px',
  fontWeight: 600,
}