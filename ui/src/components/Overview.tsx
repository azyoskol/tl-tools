import { useEffect, useState } from 'react'
import { api } from '../api/client'

export function Overview({ teamId }: { teamId: string }) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    api.getOverview(teamId).then(res => setData(res.data))
  }, [teamId])

  if (!data) return <div>Loading...</div>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '24px' }}>
      <div style={{ padding: '24px', background: '#f5f5f5', borderRadius: '12px' }}>
        <div style={{ fontSize: '14px', color: '#666' }}>PRs Awaiting Review</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{data.prs_awaiting_review}</div>
      </div>
      <div style={{ padding: '24px', background: '#f5f5f5', borderRadius: '12px' }}>
        <div style={{ fontSize: '14px', color: '#666' }}>Blocked Tasks</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: data.blocked_tasks > 0 ? '#d32f2f' : '#333' }}>
          {data.blocked_tasks}
        </div>
      </div>
      <div style={{ padding: '24px', background: '#f5f5f5', borderRadius: '12px' }}>
        <div style={{ fontSize: '14px', color: '#666' }}>CI Failures (1h)</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: data.ci_failures_last_hour > 0 ? '#d32f2f' : '#333' }}>
          {data.ci_failures_last_hour}
        </div>
      </div>
    </div>
  )
}