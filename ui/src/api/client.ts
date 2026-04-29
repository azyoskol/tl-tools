import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
})

export const api = {
  getTeams: () => client.get('/teams'),
  getTeam: (id: string) => client.get(`/teams/${id}`),
  getOverview: (teamId: string) => client.get(`/teams/${teamId}/overview`),
  getActivity: (teamId: string) => client.get(`/teams/${teamId}/activity`),
  getVelocity: (teamId: string) => client.get(`/teams/${teamId}/velocity`),
  getActivityWithFilters: (teamId: string, params: string) => client.get(`/teams/${teamId}/activity?${params}`),
  getInsights: (teamId: string) => client.get(`/teams/${teamId}/insights`),
  getDashboard: () => client.get('/dashboard'),
  getTeamsComparison: () => client.get('/teams/comparison'),
}