import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { api } from '../api/client'

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [teams, setTeams] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getDashboard(),
      api.getTeams()
    ])
      .then(([dashRes, teamsRes]) => {
        setData(dashRes.data)
        const teamMap: Record<string, string> = {}
        teamsRes.data.forEach((t: any) => { teamMap[t.id] = t.name })
        setTeams(teamMap)
        setLoading(false)
      })
      .catch(err => { console.error(err); setLoading(false) })
  }, [])

  if (loading) return <div>Loading dashboard...</div>
  if (!data) return <div>No data available</div>

  const { overview, activity, top_teams, hourly, top_authors } = data
  
  const grouped: Record<string, any> = {}
  activity.forEach((r: any) => {
    if (!grouped[r.date]) grouped[r.date] = { date: r.date }
    grouped[r.date][r.source] = (grouped[r.date][r.source] || 0) + r.count
  })
  const chartData = Object.values(grouped)

  const hourlyData = hourly.map((h: any) => ({
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
                  {top_authors.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                {top_teams.slice(0, 5).map((t: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{teams[t.team_id] || t.team_id.slice(0, 8)}</td>
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