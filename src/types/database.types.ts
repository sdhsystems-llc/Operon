export interface Account {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'trial';
  created_at: string;
}

export interface Organization {
  id: string;
  account_id: string;
  name: string;
  slug: string;
  settings: Record<string, any>;
  created_at: string;
}


export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  role: 'admin' | 'engineer' | 'viewer';
  org_name: string;
  timezone: string;
  default_project_id: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  created_at: string;
  last_used_at: string | null;
}

export interface Project {
  id: string;
  org_id: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'admin' | 'member' | 'viewer';
  joined_at: string;
}

export type IntegrationType =
  | 'aws'
  | 'azure'
  | 'splunk'
  | 'grafana'
  | 'launchdarkly'
  | 'datadog'
  | 'pagerduty'
  | 'github'
  | 'gitlab';

export interface Integration {
  id: string;
  project_id: string;
  type: IntegrationType;
  name: string;
  config: Record<string, any>;
  status: 'active' | 'inactive' | 'error';
  last_sync_at: string | null;
  created_at: string;
}

export type KnowledgeType = 'playbook' | 'runbook' | 'architecture' | 'article' | 'documentation' | 'postmortem';

export interface KnowledgeBase {
  id: string;
  project_id: string;
  type: KnowledgeType;
  title: string;
  content: string;
  file_url: string;
  metadata: Record<string, any>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocument {
  id: string;
  org_id: string;
  name: string;
  type: string;
  size: number | null;
  status: 'active' | 'processing' | 'failed';
  url: string | null;
  created_at: string;
}

export interface MCPServer {
  id: string;
  project_id: string;
  name: string;
  url: string;
  capabilities: any[];
  status: 'active' | 'inactive';
  created_at: string;
}

export type InvestigationStatus = 'open' | 'investigating' | 'resolved' | 'escalated';
export type Severity = 'p1' | 'p2' | 'p3' | 'p4';

export interface Investigation {
  id: string;
  project_id: string;
  title: string;
  severity: Severity;
  status: InvestigationStatus;
  service: string;
  assigned_agent: string | null;
  root_cause: string | null;
  created_at: string;
  resolved_at: string | null;
  duration_minutes: number | null;
}

export type EventType =
  | 'deploy'
  | 'commit'
  | 'feature_flag'
  | 'alert'
  | 'metric'
  | 'log'
  | 'trace'
  | 'config_change';

export interface InvestigationEvent {
  id: string;
  investigation_id: string;
  event_type: EventType;
  source: string;
  title: string;
  description: string;
  timestamp: string;
  correlation_score: number;
}

export type ActionType =
  | 'automated_fix'
  | 'manual_fix'
  | 'rollback'
  | 'scale'
  | 'restart'
  | 'config_update';

export interface InvestigationAction {
  id: string;
  investigation_id: string;
  action_type: ActionType;
  description: string;
  result: string;
  performed_by: string;
  performed_at: string;
}

export interface ChatSession {
  id: string;
  project_id: string;
  investigation_id: string | null;
  user_id: string;
  title: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export type TeamIntegrationType = 'slack' | 'teams';

export interface TeamIntegration {
  id: string;
  organization_id: string;
  type: TeamIntegrationType;
  config: Record<string, any>;
  status: 'active' | 'inactive';
  created_at: string;
}
