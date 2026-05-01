import type { AIInsight } from '../ai';

export const createMockAIInsight = (): AIInsight => ({
  id: 'insight-1',
  title: 'Deploy frequency trending up',
  body: 'Deploy frequency increased 20% this sprint, driven by Backend team.',
  action: 'View team breakdown',
  generatedAt: new Date().toISOString(),
});
