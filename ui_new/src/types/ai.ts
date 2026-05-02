import type { MetricId } from './metrics';
import type { DashboardFilters } from './dashboard';

export interface AIInsight {
  id: string;
  title: string;
  body: string;
  action?: string;
  generatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface AIChatRequest {
  messages: ChatMessage[];
  context?: {
    activeDashboardId?: string;
    activeMetric?: MetricId;
    resolvedFilters?: DashboardFilters;
  };
}

export interface AIChatResponse {
  reply: string;
  relatedMetrics?: MetricId[];
}
