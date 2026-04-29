import { useEffect, useState } from 'react'
import { api } from '../api/client'

export function AttentionItems({ teamId }: { teamId: string }) {
  const [insights, setInsights] = useState<string[]>([])

  useEffect(() => {
    api.getInsights(teamId).then(res => setInsights(res.data.insights))
  }, [teamId])

  if (insights.length === 0) return null

  return (
    <div style={{ marginTop: '32px' }}>
      <h3>Attention Items</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {insights.map((item, i) => (
          <li key={i} style={{ 
            padding: '12px 16px', 
            background: '#fff3e0', 
            borderLeft: '4px solid #ff9800',
            marginBottom: '8px',
            borderRadius: '4px'
          }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}