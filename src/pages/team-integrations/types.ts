export interface ChannelRoute {
  severity: 'p1' | 'p2' | 'p3';
  channel: string;
}

export interface NotificationSettings {
  new_investigation: boolean;
  root_cause_identified: boolean;
  remediation_suggested: boolean;
  investigation_resolved: boolean;
  agent_health_alerts: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  new_investigation: true,
  root_cause_identified: true,
  remediation_suggested: true,
  investigation_resolved: true,
  agent_health_alerts: true,
};

export const DEFAULT_CHANNEL_ROUTES: ChannelRoute[] = [
  { severity: 'p1', channel: '#incidents-critical' },
  { severity: 'p2', channel: '#incidents' },
  { severity: 'p3', channel: '#alerts' },
];

export const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
  p1: { label: 'P1 — Critical', color: 'text-error-600' },
  p2: { label: 'P2 — High', color: 'text-warning-600' },
  p3: { label: 'P3 — Medium', color: 'text-primary-600' },
};

export const NOTIFICATION_EVENTS: { key: keyof NotificationSettings; label: string; description: string }[] = [
  { key: 'new_investigation', label: 'New Investigation Started', description: 'When an AI agent begins investigating an incident' },
  { key: 'root_cause_identified', label: 'Root Cause Identified', description: 'When the AI identifies the root cause of an issue' },
  { key: 'remediation_suggested', label: 'Remediation Suggested', description: 'When an automated fix or recommendation is ready' },
  { key: 'investigation_resolved', label: 'Investigation Resolved', description: 'When an incident is closed or marked resolved' },
  { key: 'agent_health_alerts', label: 'Agent Health Alerts', description: 'When an AI agent becomes unavailable or degraded' },
];

export const TEAMS_CHANNELS = [
  'General',
  'Incidents',
  'Engineering',
  'On-Call',
  'Alerts',
  'DevOps',
];

export interface TeamIntegrationRow {
  id: string;
  user_id: string;
  type: 'slack' | 'teams';
  connected: boolean;
  workspace_name: string;
  tenant_id: string;
  bot_token: string;
  webhook_url: string;
  default_channel: string;
  channel_routes: ChannelRoute[];
  notification_settings: NotificationSettings;
  created_at: string;
  updated_at: string;
}
