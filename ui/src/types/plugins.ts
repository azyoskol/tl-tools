export type PluginCategory = 'Sources' | 'Exporters' | 'AI' | 'Alerts';

export interface Plugin {
  id: string;
  name: string;
  category: PluginCategory;
  description: string;
  rating: number;
  installCount: string;
  installed: boolean;
  accentColor: string;
}

export type PluginsResponse = Plugin[];

export type SourceId = 'github' | 'jira' | 'gitlab' | 'linear' | 'slack' | 'pagerduty';

export interface SourceSyncConfig {
  syncInterval: 'every_5m' | 'every_15m' | 'every_1h';
  repoScope: 'all' | 'selected';
  includeArchived: boolean;
  backfillDays: 30 | 90 | 365;
}

export interface ConnectSourceRequest {
  sourceId: SourceId;
  authToken: string;
  config: SourceSyncConfig;
}

export interface IntegrationStatus {
  sourceId: SourceId;
  name: string;
  connected: boolean;
  status: 'connecting' | 'active' | 'error';
}

export interface InstallPluginResponse {
  pluginId: string;
  installed: boolean;
}
