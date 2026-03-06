// ─── Shared Types for the Projects Section ────────────────────────────────────

export type ProjectTab = 'overview' | 'datasources' | 'integrations' | 'agents' | 'knowledge' | 'notifications'
export type KnowledgeDocType = 'runbook' | 'architecture' | 'postmortem' | 'sop' | 'known-issue' | 'playbook'

export interface ProjectNotificationConfig {
  enabled: boolean
  platform: 'slack' | 'teams' | 'both' | 'inherit'
  slackChannel: string
  teamsChannel: string
  events: {
    new_investigation: boolean
    root_cause_identified: boolean
    remediation_suggested: boolean
    investigation_resolved: boolean
    agent_health_alerts: boolean
  }
  alertLevels: { p1: boolean; p2: boolean; p3: boolean }
}

export interface ProjectDataSource {
  integrationId: string
  enabled: boolean
  config: Record<string, string>
}

export interface Component {
  id: string
  name: string
  description: string
  tech: string
}

export interface KnowledgeDoc {
  id: string
  title: string
  type: KnowledgeDocType
  summary: string
  author: string
  updatedAt: string
  link?: string
}

export interface RecentActivity {
  id: string
  time: string
  label: string
  kind: 'incident' | 'deploy' | 'agent' | 'alert' | 'resolved'
}

export interface OnCallInfo {
  name: string
  until: string
}

export interface LastDeploy {
  who: string
  when: string
  commit: string
  message: string
  status: 'success' | 'failed' | 'rollback'
}

export interface Project {
  id: string
  name: string
  description: string
  environment: string
  serviceUrl?: string
  repoUrl?: string
  agents: string[]
  investigations: number
  docs: number
  dataSources: ProjectDataSource[]
  components: Component[]
  knowledge: KnowledgeDoc[]
  notifications?: ProjectNotificationConfig
  healthScore?: number
  sloTarget?: string
  sloActual?: string
  onCall?: OnCallInfo
  lastDeploy?: LastDeploy
  recentActivity?: RecentActivity[]
}

export interface Domain {
  id: string
  name: string
  description: string
  owner: string
  notificationChannel: string
  projects: Project[]
  knowledge: KnowledgeDoc[]
}

export interface Org {
  id: string
  name: string
  industry: string
  timezone: string
  plan: string
  knowledge: KnowledgeDoc[]
}

export interface IntegrationItem {
  id: string
  name: string
  logo: string
  connected: boolean
  description: string
  badge?: string
  config?: Record<string, string>
  dsFields: Record<string, string>
}

export interface IntCategory {
  id: string
  label: string
  color: string
  items: IntegrationItem[]
}

export interface Member {
  name: string
  email: string
  role: string
  avatar: string
  active: boolean
}

// Flat views used by table pages
export interface FlatDomain extends Domain {
  orgId: string
  orgName: string
}

export interface FlatProject extends Project {
  orgId: string
  orgName: string
  domainId: string
  domainName: string
}
