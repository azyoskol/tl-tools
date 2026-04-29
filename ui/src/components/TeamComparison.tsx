import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '../api/client'
import { useTeams } from '../hooks/useTeams'

interface TeamData {
  team_id: string;
  prs: number;
  tasks: number;
  ci_runs: number;
}

interface ChartData {
  name: string;
  PRs: number;
  Tasks: number;
  'CI Runs': number;
}

export function TeamComparison() {
  const [data, setData] = useState<TeamData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const { getTeamName } = useTeams()

  useEffect(() => {
    setError(null)
    api.getTeamsComparison()
      .then(res => {
        setData(res.data)
        setLoading(false)
      })
      .catch(err => { 
        console.error(err); 
        setError(err.message || 'Failed to load team comparison data')
        setLoading(false) 
      })
  }, [])

  if (loading) return <div>Loading comparison...</div>
  if (error) return <div style={{ color: '#d32f2f', padding: '24px', textAlign: 'center' }}>
    <div style={{ fontSize: '16px', marginBottom: '8px' }}>Error: {error}</div>
    <button onClick={() => { setLoading(true); setError(null); api.getTeamsComparison().then(res => { setData(res.data); setLoading(false) }).catch(err => { setError(err.message || 'Failed to load team comparison data'); setLoading(false) }) }} 
      style={{ padding: '8px 16px', cursor: 'pointer', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px' }}>
      Retry
    </button>
  </div>
  if (!data.length) return <div>No comparison data</div>

  const chartData: ChartData[] = data.map(t => ({
    name: getTeamName(t.team_id),
    PRs: t.prs,
    Tasks: t.tasks,
    "CI Runs": t.ci_runs
  }))

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>Team Comparison</h2>
        <div>
          <button onClick={() => setView('chart')} style={view === 'chart' ? activeBtnStyle : btnStyle}>Chart</button>
          <button onClick={() => setView('table')} style={view === 'table' ? activeBtnStyle : btnStyle}>Table</button>
        </div>
      </div>

      {view === 'chart' ? (
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="PRs" fill="#8884d8" />
              <Bar dataKey="Tasks" fill="#82ca9d" />
              <Bar dataKey="CI Runs" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Team</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>PRs</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Tasks</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>CI Runs</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{row.name}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{row.PRs}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{row.Tasks}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{row["CI Runs"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const btnStyle = { padding: '8px 16px', margin: '0 4px', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: 'pointer' }
const activeBtnStyle = { ...btnStyle, background: '#1976d2', color: '#fff', borderColor: '#1976d2' }