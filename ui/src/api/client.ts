import axios from 'axios'
import { Team, DashboardData, VelocityData, TeamComparisonData, ActivityPageData, OverviewMetrics, ActivityItem } from '../types'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
})

export const api = {
  getTeams: (): Promise<{data: Team[]}> => client.get('/teams'),
  getTeam: (id: string): Promise<{data: Team}> => client.get(`/teams/${id}`),
  getOverview: (teamId: string): Promise<{data: OverviewMetrics}> => client.get(`/teams/${teamId}/overview`),
  getActivity: (teamId: string): Promise<{data: ActivityItem[]}> => client.get(`/teams/${teamId}/activity`),
  getVelocity: (teamId: string): Promise<{data: VelocityData}> => client.get(`/teams/${teamId}/velocity`),
  getActivityWithFilters: (teamId: string, params: string): Promise<{data: ActivityPageData}> => 
    client.get(`/teams/${teamId}/activity?${params}`),
  getInsights: (teamId: string): Promise<{data: { insights: string[] }}> => 
    client.get(`/teams/${teamId}/insights`),
  getDashboard: (): Promise<{data: DashboardData}> => client.get('/dashboard'),
  getTeamsComparison: (): Promise<{data: TeamComparisonData[]}> => client.get('/teams/comparison'),
}