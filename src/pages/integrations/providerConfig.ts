export type ProviderStatus = 'connected' | 'pending' | 'not_connected';
export type DataSourceKey = 'logs' | 'metrics' | 'alerts' | 'events';

export interface CredentialField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'password' | 'url';
}

export interface Provider {
  id: string;
  name: string;
  category: string;
  description: string;
  color: string;
  supportedSources: DataSourceKey[];
  credentials: CredentialField[];
}

export const PROVIDERS: Provider[] = [
  {
    id: 'aws',
    name: 'AWS CloudWatch',
    category: 'Observability',
    description: 'Collect metrics, logs, and alarms from AWS services',
    color: '#FF9900',
    supportedSources: ['logs', 'metrics', 'alerts'],
    credentials: [
      { key: 'accessKeyId', label: 'Access Key ID', placeholder: 'AKIAIOSFODNN7EXAMPLE', type: 'text' },
      { key: 'secretAccessKey', label: 'Secret Access Key', placeholder: '••••••••••••••••', type: 'password' },
      { key: 'region', label: 'Region', placeholder: 'us-east-1', type: 'text' },
    ],
  },
  {
    id: 'azure',
    name: 'Azure Monitor',
    category: 'Observability',
    description: 'Pull metrics and logs from Azure Monitor and Log Analytics',
    color: '#0078D4',
    supportedSources: ['logs', 'metrics', 'alerts'],
    credentials: [
      { key: 'tenantId', label: 'Tenant ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text' },
      { key: 'clientId', label: 'Client ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text' },
      { key: 'clientSecret', label: 'Client Secret', placeholder: '••••••••••••••••', type: 'password' },
      { key: 'subscriptionId', label: 'Subscription ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text' },
    ],
  },
  {
    id: 'splunk',
    name: 'Splunk',
    category: 'Observability',
    description: 'Search and correlate machine data from your Splunk instance',
    color: '#65A637',
    supportedSources: ['logs', 'alerts', 'events'],
    credentials: [
      { key: 'url', label: 'Splunk URL', placeholder: 'https://splunk.example.com:8089', type: 'url' },
      { key: 'token', label: 'HEC Token', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'password' },
      { key: 'index', label: 'Default Index', placeholder: 'main', type: 'text' },
    ],
  },
  {
    id: 'grafana',
    name: 'Grafana',
    category: 'Observability',
    description: 'Ingest alerts and dashboard annotations from Grafana',
    color: '#F46800',
    supportedSources: ['metrics', 'alerts'],
    credentials: [
      { key: 'url', label: 'Grafana URL', placeholder: 'https://grafana.example.com', type: 'url' },
      { key: 'apiKey', label: 'Service Account Token', placeholder: 'glsa_xxxxxxxxxxxx', type: 'password' },
      { key: 'orgId', label: 'Organisation ID', placeholder: '1', type: 'text' },
    ],
  },
  {
    id: 'datadog',
    name: 'Datadog',
    category: 'Observability',
    description: 'Stream metrics, traces, and events from Datadog',
    color: '#632CA6',
    supportedSources: ['logs', 'metrics', 'alerts', 'events'],
    credentials: [
      { key: 'apiKey', label: 'API Key', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' },
      { key: 'appKey', label: 'App Key', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' },
      { key: 'site', label: 'Datadog Site', placeholder: 'datadoghq.com', type: 'text' },
    ],
  },
  {
    id: 'launchdarkly',
    name: 'LaunchDarkly',
    category: 'Feature Flags',
    description: 'Correlate feature flag changes with incidents',
    color: '#405BFF',
    supportedSources: ['events'],
    credentials: [
      { key: 'sdkKey', label: 'SDK Key', placeholder: 'sdk-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'password' },
      { key: 'projectKey', label: 'Project Key', placeholder: 'my-project', type: 'text' },
      { key: 'environment', label: 'Environment', placeholder: 'production', type: 'text' },
    ],
  },
  {
    id: 'pagerduty',
    name: 'PagerDuty',
    category: 'ITSM',
    description: 'Sync incidents and escalations from PagerDuty',
    color: '#06AC38',
    supportedSources: ['alerts', 'events'],
    credentials: [
      { key: 'apiKey', label: 'API Key', placeholder: 'u+xxxxxxxxxxxxxxxxxxxx', type: 'password' },
      { key: 'serviceId', label: 'Service ID', placeholder: 'PXXXXXX', type: 'text' },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'Source Control',
    description: 'Track deployments, commits, and pull requests',
    color: '#24292F',
    supportedSources: ['events'],
    credentials: [
      { key: 'token', label: 'Personal Access Token', placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx', type: 'password' },
      { key: 'owner', label: 'Owner / Org', placeholder: 'my-org', type: 'text' },
      { key: 'repo', label: 'Repository', placeholder: 'my-repo', type: 'text' },
    ],
  },
  {
    id: 'jira',
    name: 'Jira',
    category: 'ITSM',
    description: 'Link investigations to Jira tickets automatically',
    color: '#0052CC',
    supportedSources: ['events'],
    credentials: [
      { key: 'url', label: 'Jira URL', placeholder: 'https://yourorg.atlassian.net', type: 'url' },
      { key: 'email', label: 'Email', placeholder: 'you@example.com', type: 'text' },
      { key: 'apiToken', label: 'API Token', placeholder: '••••••••••••••••', type: 'password' },
      { key: 'projectKey', label: 'Project Key', placeholder: 'OPS', type: 'text' },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Messaging',
    description: 'Send real-time alerts and investigation updates to Slack',
    color: '#4A154B',
    supportedSources: ['alerts', 'events'],
    credentials: [
      { key: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/…', type: 'url' },
      { key: 'channel', label: 'Default Channel', placeholder: '#incidents', type: 'text' },
      { key: 'botToken', label: 'Bot Token', placeholder: 'xoxb-xxxxxxxxxxxx', type: 'password' },
    ],
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    category: 'Messaging',
    description: 'Post incident cards and updates to MS Teams channels',
    color: '#6264A7',
    supportedSources: ['alerts', 'events'],
    credentials: [
      { key: 'webhookUrl', label: 'Incoming Webhook URL', placeholder: 'https://teams.microsoft.com/l/message/…', type: 'url' },
      { key: 'channel', label: 'Channel Name', placeholder: 'General', type: 'text' },
    ],
  },
  {
    id: 'mcp',
    name: 'MCP Server',
    category: 'AI Tools',
    description: 'Connect a Model Context Protocol server for custom AI tooling',
    color: '#10b981',
    supportedSources: ['logs', 'metrics', 'alerts', 'events'],
    credentials: [
      { key: 'url', label: 'Server URL', placeholder: 'http://localhost:8080', type: 'url' },
      { key: 'apiKey', label: 'API Key', placeholder: '••••••••••••••••', type: 'password' },
      { key: 'name', label: 'Server Name', placeholder: 'My MCP Server', type: 'text' },
    ],
  },
];

export const CATEGORY_COLORS: Record<string, string> = {
  Observability:   'rgba(129,140,248,0.15)',
  ITSM:            'rgba(251,146,60,0.15)',
  'Source Control':'rgba(45,212,191,0.15)',
  'Feature Flags': 'rgba(251,191,36,0.15)',
  Messaging:       'rgba(168,85,247,0.15)',
  'AI Tools':      'rgba(16,185,129,0.15)',
};

export const CATEGORY_TEXT: Record<string, string> = {
  Observability:   '#818cf8',
  ITSM:            '#fb923c',
  'Source Control':'#2dd4bf',
  'Feature Flags': '#fbbf24',
  Messaging:       '#a855f7',
  'AI Tools':      '#34d399',
};
