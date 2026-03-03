export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Partial<UserProfile>
        Update: Partial<UserProfile>
      }
      projects: {
        Row: Project
        Insert: Partial<Project>
        Update: Partial<Project>
      }
      investigations: {
        Row: Investigation
        Insert: Partial<Investigation>
        Update: Partial<Investigation>
      }
      investigation_events: {
        Row: InvestigationEvent
        Insert: Partial<InvestigationEvent>
        Update: Partial<InvestigationEvent>
      }
      agents: {
        Row: Agent
        Insert: Partial<Agent>
        Update: Partial<Agent>
      }
      integrations: {
        Row: Integration
        Insert: Partial<Integration>
        Update: Partial<Integration>
      }
      knowledge_documents: {
        Row: KnowledgeDocument
        Insert: Partial<KnowledgeDocument>
        Update: Partial<KnowledgeDocument>
      }
      domains: {
        Row: Domain
        Insert: Partial<Domain>
        Update: Partial<Domain>
      }
      event_sources: {
        Row: EventSource
        Insert: Partial<EventSource>
        Update: Partial<EventSource>
      }
      event_log: {
        Row: EventLog
        Insert: Partial<EventLog>
        Update: Partial<EventLog>
      }
      audit_log: {
        Row: AuditLog
        Insert: Partial<AuditLog>
        Update: Partial<AuditLog>
      }
      chat_sessions: {
        Row: ChatSession
        Insert: Partial<ChatSession>
        Update: Partial<ChatSession>
      }
      chat_messages: {
        Row: ChatMessage
        Insert: Partial<ChatMessage>
        Update: Partial<ChatMessage>
      }
    }
  }
}

export interface UserProfile {
  id: string
  user_id: string
  full_name: string
  role: string
  avatar_url: string | null
  org_name: string
  created_at: string | null
  timezone: string
  updated_at: string | null
  default_project_id: string | null
}

export interface Project {
  id: string
  org_id: string
  name: string
  description: string | null
  status: string
  created_at: string | null
  domain_id: string | null
  environment: 'production' | 'staging' | 'development'
  service_url: string
  repo_url: string
}

export interface Investigation {
  id: string
  project_id: string
  title: string
  severity: 'p1' | 'p2' | 'p3' | 'p4'
  status: 'open' | 'investigating' | 'resolved'
  service: string
  assigned_agent: string | null
  root_cause: string | null
  created_at: string | null
  resolved_at: string | null
  duration_minutes: number | null
}

export interface InvestigationEvent {
  id: string
  investigation_id: string
  event_type: string
  title: string
  description: string | null
  source: string
  timestamp: string | null
  correlation_score: number | null
}

export interface Agent {
  id: string
  org_id: string | null
  name: string
  type: string
  status: 'active' | 'idle' | 'error'
  tasks_completed_today: number
  current_task: string | null
  capabilities: string[]
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Integration {
  id: string
  org_id: string
  name: string
  type: string
  status: string
  config: Record<string, unknown>
  last_sync_at: string | null
  created_at: string | null
  events_today: number | null
  data_sources: {
    logs: boolean
    alerts: boolean
    events: boolean
    metrics: boolean
  } | null
}

export interface KnowledgeDocument {
  id: string
  org_id: string
  name: string
  type: string
  size: number | null
  status: string
  url: string | null
  created_at: string | null
}

export interface Domain {
  id: string
  org_id: string
  name: string
  description: string
  owner_team: string
  color: string
  created_at: string
}

export interface EventSource {
  id: string
  project_id: string
  type: string
  name: string
  status: 'listening' | 'paused' | 'error'
  config: Record<string, unknown>
  webhook_token: string | null
  last_event_at: string | null
  last_event_summary: string
  created_at: string
}

export interface EventLog {
  id: string
  project_id: string
  event_source_id: string | null
  source_type: string
  source_name: string
  event_type: string
  payload_summary: string
  payload: Record<string, unknown>
  action_taken: string
  status: 'processed' | 'logged' | 'error'
  created_at: string
}

export interface AuditLog {
  id: string
  org_id: string | null
  actor_type: string
  actor_name: string
  action: string
  resource_type: string
  resource_name: string
  ip_address: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  title: string
  context: Record<string, unknown> | null
  created_at: string | null
  updated_at: string | null
}

export interface ChatMessage {
  id: string
  session_id: string
  role: string
  content: string
  created_at: string | null
}
