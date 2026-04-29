import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
})

export const api = {
  getTeams: () => client.get('/teams'),
  getTeam: (id: string) => client.get(`/teams/${id}`),
  getOverview: (teamId: string) => client.get(`/teams/${teamId}/overview`),
  getActivity: (teamId: string) => client.get(`/teams/${teamId}/activity`),
  getVelocity: (teamId: string) => client.get(`/teams/${teamId}/velocity`),
  getInsights: (teamId: string) => client.get(`/teams/${teamId}/insights`),
}