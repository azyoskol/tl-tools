import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
});

export const getDORA = () => client.get('/dora').then((r: any) => r.data);
export const getMetrics = (metric: string, range = '30d', team = '', repo = '') =>
  client.get('/metrics', { params: { metric, range, team, repo } }).then((r: any) => r.data);
export const getRole = (role: string) => client.get(`/role?role=${role}`).then((r: any) => r.data);
export const getInsights = () => client.get('/insights').then((r: any) => r.data);
export const getDashboards = () => client.get('/dashboards').then((r: any) => r.data);
export const createDashboard = (data: any) => client.post('/dashboards', data).then((r: any) => r.data);