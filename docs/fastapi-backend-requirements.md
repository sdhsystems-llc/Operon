# FastAPI Backend Requirements — Operon SRE Platform

## Summary

Operon is an AI-powered Site Reliability Engineering (SRE) platform that supports multi-tenant incident investigation, root cause analysis, and remediation orchestration through a fleet of specialized AI agents. The frontend is a React/TypeScript application currently backed by Supabase (PostgreSQL + Auth) with significant use of mock/local-state data for the hierarchy management and agent pipeline simulation.

This document defines the backend requirements for a FastAPI team to incrementally replace Supabase-direct access and mock data with proper backend services while preserving the existing frontend data contracts.

---

## Capability Inventory

### 1. Authentication & Session Management
- **Status**: Fully implemented via Supabase Auth (JWT)
- **Screens**: LoginPage, RegisterPage, AuthContext (global)
- **User actions**: Register with email/password, log in, log out, session persistence
- **Data reads**: User session (JWT), user_profiles row by user_id
- **Data mutations**: Insert user_profiles on signup, update profile fields

### 2. User Profile & Preferences
- **Status**: Partially implemented (Supabase-backed profile row)
- **Screens**: SettingsPage (ProfileTab, OrgTab, TeamTab, ApiKeysTab, ProjectsTab)
- **User actions**: View/edit full_name, role, org_name, timezone, avatar
- **Data reads**: user_profiles by user_id
- **Data mutations**: Update user_profiles fields
- **Missing**: API keys management backend, org membership management

### 3. Organization / Domain / Project Hierarchy
- **Status**: Mostly mocked (ProjectsContext with local React state)
- **Screens**: OrgsPage, OrgDetailPage, DomainsPage, DomainDetailPage, ProjectsListPage, ProjectDetailPage
- **User actions**: CRUD orgs, CRUD domains, CRUD projects; assign agents; configure data sources; configure notifications; manage knowledge docs; manage components
- **Data reads**: Orgs list, domains by org, projects by domain, flat cross-org project/domain lists
- **Data mutations**: Add/edit/delete orgs, domains, projects; toggle data sources; assign agents
- **Note**: Currently 100% client-side React state with no persistence — highest migration priority

### 4. Investigations (Incidents)
- **Status**: Fully implemented via Supabase
- **Screens**: InvestigationsPage, InvestigationDetailPage, NewInvestigationPage, ChatPage (inline investigation view)
- **User actions**: Create investigation, view list (filter by project/service/status/severity), view detail, mark resolved
- **Data reads**: Investigations list (filtered/paginated), investigation detail, investigation_events list with correlation scores
- **Data mutations**: Insert investigation, update status/root_cause/resolved_at, insert investigation_events

### 5. AI Agent Fleet Management
- **Status**: Partially implemented (agents table in Supabase, rich mock log data)
- **Screens**: AgentsPage, AgentCard, LogsPanel, DeployWizard
- **User actions**: View agent list, view agent status/current_task, view logs, deploy new agent
- **Data reads**: Agents list by org, agent logs (simulated via LOG_TEMPLATES), agent capabilities
- **Data mutations**: Update agent config, deploy agent (mock only today)

### 6. Chat / Conversational Investigation Interface
- **Status**: Partially implemented (Supabase-persisted sessions/messages, rich client-side pipeline simulation)
- **Screens**: ChatPage, AgentWorkflowCard, InvestigationPipeline, pipeline sub-components
- **User actions**: Create new chat session, send messages, receive AI responses, view live agent pipeline, delete session
- **Data reads**: chat_sessions list, chat_messages by session
- **Data mutations**: Insert chat_session, insert chat_messages (user + assistant), delete session + messages
- **Streaming**: Agent pipeline simulated client-side; no server-side streaming today

### 7. Integration Catalog
- **Status**: Partially mocked (connected status mocked, Supabase integrations table for persistence)
- **Screens**: IntegrationsPage, ConfigurePanel, IntegrationCard, ProjectDetailPage/IntegrationsTab
- **User actions**: Browse integrations, connect/disconnect, configure API keys/URLs, view connected status
- **Data reads**: Integrations list by org, integration config fields, connection status
- **Data mutations**: Upsert integration (connect + config), delete integration

### 8. Knowledge Management
- **Status**: Partially implemented (Supabase knowledge_documents, UI allows add/view/delete)
- **Screens**: KnowledgePage, KnowledgeTab (inside ProjectDetailPage), AddKnowledgeModal, KnowledgeDocsPanel
- **User actions**: Upload/link document, browse docs, search docs, delete doc
- **Data reads**: knowledge_documents list (by org, by project/domain scope)
- **Data mutations**: Insert knowledge_document, delete knowledge_document
- **Missing**: File upload/storage backend, semantic search endpoint

### 9. Dashboard / Overview Analytics
- **Status**: Computed from mocked investigation data
- **Screens**: OverviewPage, KpiCards, SystemKpis, SloRiskPanel, OrgHealthChart, LiveIncidentFeed, ServiceHealthMap, AgentActivityPanel, LiveActivityStream, IncidentsByServiceChart, InvestigationsTrendChart
- **Data reads**: Investigation counts by status/severity, resolved investigation durations (for MTTR), agents list with status, recent activity stream
- **Computed values**: Active investigations count, MTTR (minutes), MTTD (minutes), health %, SLO burn rates

### 10. Audit Log
- **Status**: Read-only view, insertion happens through Supabase
- **Screens**: AuditLogPage
- **User actions**: Browse audit entries (filter by actor, resource type, date range)
- **Data reads**: audit_log entries (paginated, filtered)
- **Data mutations**: Insert audit_log (server-side only, triggered by other actions)

### 11. Alert Triage
- **Status**: Placeholder / partial (AlertTriagePage)
- **Screens**: AlertTriagePage
- **User actions**: View incoming alerts, triage (acknowledge/escalate/dismiss)
- **Data reads**: Alerts from integrations (via event_log or dedicated alerts table)
- **Data mutations**: Update alert status, create investigation from alert

### 12. Event Sources & Event Log
- **Status**: Supabase-backed
- **Screens**: ProjectDetailPage/DataSourcesTab
- **User actions**: Add event source (webhook endpoint), view event log, configure source
- **Data reads**: event_sources by project, event_log entries
- **Data mutations**: Insert event_source, update event_source config

### 13. Notifications / Team Integrations
- **Status**: Config UI implemented, backend not wired
- **Screens**: TeamIntegrationsPage, SlackSection, TeamsSection, NotificationToggles, ProjectDetailPage/ProvidersTab
- **User actions**: Connect Slack workspace, configure Teams channel, toggle notification events per project
- **Data reads**: TeamIntegration records, project notification configs
- **Data mutations**: Upsert TeamIntegration config, update ProjectNotificationConfig

### 14. Settings / Admin
- **Status**: Partially implemented
- **Screens**: SettingsPage (5 tabs)
- **User actions**: Edit profile (ProfileTab), edit org settings (OrgTab), manage team members (TeamTab), manage API keys (ApiKeysTab), manage projects (ProjectsTab)
- **Data reads**: user_profiles, org details, organization_members, api_keys
- **Data mutations**: Update user_profiles, CRUD organization_members, CRUD api_keys

---

## Recommended Backend Architecture

```
app/
├── api/
│   └── v1/
│       ├── endpoints/
│       │   ├── auth.py
│       │   ├── users.py
│       │   ├── orgs.py
│       │   ├── domains.py
│       │   ├── projects.py
│       │   ├── investigations.py
│       │   ├── investigation_events.py
│       │   ├── agents.py
│       │   ├── agent_logs.py
│       │   ├── chat.py
│       │   ├── integrations.py
│       │   ├── knowledge.py
│       │   ├── dashboard.py
│       │   ├── audit.py
│       │   ├── alerts.py
│       │   ├── event_sources.py
│       │   ├── notifications.py
│       │   └── settings.py
│       └── router.py
├── schemas/
│   ├── auth.py
│   ├── user.py
│   ├── org.py
│   ├── domain.py
│   ├── project.py
│   ├── investigation.py
│   ├── agent.py
│   ├── chat.py
│   ├── integration.py
│   ├── knowledge.py
│   ├── dashboard.py
│   ├── audit.py
│   └── common.py
├── services/
│   ├── auth_service.py
│   ├── user_service.py
│   ├── org_service.py
│   ├── project_service.py
│   ├── investigation_service.py
│   ├── agent_service.py
│   ├── chat_service.py
│   ├── pipeline_service.py
│   ├── integration_service.py
│   ├── knowledge_service.py
│   ├── dashboard_service.py
│   ├── audit_service.py
│   └── notification_service.py
├── repositories/
│   ├── user_repository.py
│   ├── org_repository.py
│   ├── domain_repository.py
│   ├── project_repository.py
│   ├── investigation_repository.py
│   ├── agent_repository.py
│   ├── chat_repository.py
│   ├── integration_repository.py
│   ├── knowledge_repository.py
│   ├── audit_repository.py
│   └── event_repository.py
├── models/
│   ├── user.py
│   ├── org.py
│   ├── domain.py
│   ├── project.py
│   ├── investigation.py
│   ├── agent.py
│   ├── chat.py
│   ├── integration.py
│   ├── knowledge.py
│   ├── audit.py
│   └── event.py
├── core/
│   ├── config.py
│   ├── security.py
│   ├── database.py
│   └── exceptions.py
├── dependencies/
│   ├── auth.py          # get_current_user, require_role
│   ├── pagination.py    # PaginationParams
│   └── db.py           # get_db session
├── integrations/
│   ├── datadog.py
│   ├── splunk.py
│   ├── pagerduty.py
│   ├── slack.py
│   ├── teams.py
│   ├── github.py
│   └── launchdarkly.py
└── main.py
```

---

## Domain Model Definitions

### UserProfile
**Purpose**: Stores per-user display info and platform preferences beyond what Supabase Auth provides.
```
id: UUID (PK)
user_id: UUID (FK → auth.users, unique)
full_name: str (required)
role: Literal['admin', 'engineer', 'viewer'] (default='engineer')
avatar_url: str | None
org_name: str (required)
timezone: str (default='UTC')
default_project_id: UUID | None (FK → projects)
created_at: datetime
updated_at: datetime
```
Relationships: belongs to auth user; has many api_keys; belongs to organization

### Organization
**Purpose**: Top-level multi-tenant boundary. Currently represented only by org_name on UserProfile; needs its own table.
```
id: UUID (PK)
name: str (required)
slug: str (unique)
industry: str | None
timezone: str (default='UTC')
plan: Literal['free', 'pro', 'enterprise'] (default='free')
created_at: datetime
updated_at: datetime
```
Relationships: has many domains, members, integrations, knowledge_documents, agents

### Domain
**Purpose**: Logical grouping of related projects within an organization.
```
id: UUID (PK)
org_id: UUID (FK → organizations, required)
name: str (required)
description: str (default='')
owner_team: str (default='')
notification_channel: str | None (e.g. '#infra-alerts')
color: str (default='#60a5fa')
created_at: datetime
updated_at: datetime
```
Relationships: belongs to organization; has many projects, knowledge_documents

### Project
**Purpose**: A deployable service or system component that can be investigated.
```
id: UUID (PK)
org_id: UUID (FK → organizations, required)
domain_id: UUID | None (FK → domains)
name: str (required)
description: str (default='')
environment: Literal['production', 'staging', 'development'] (default='production')
service_url: str | None
repo_url: str | None
status: str (default='active')
slo_target: str | None (e.g. '99.9%')
notification_config: dict | None (ProjectNotificationConfig JSON)
created_at: datetime
updated_at: datetime
```
Relationships: belongs to org and domain; has many investigations, event_sources, knowledge_docs, assigned agents

### Investigation
**Purpose**: A single incident investigation lifecycle record.
```
id: UUID (PK)
project_id: UUID (FK → projects, required)
title: str (required)
severity: Literal['p1', 'p2', 'p3', 'p4'] (required)
status: Literal['open', 'investigating', 'resolved', 'escalated'] (default='open')
service: str (required; service slug or name)
assigned_agent: str | None (agent name)
root_cause: str | None (populated on resolution)
created_at: datetime
resolved_at: datetime | None
duration_minutes: int | None (computed: resolved_at - created_at)
```
Relationships: belongs to project; has many investigation_events, investigation_actions, chat_sessions

### InvestigationEvent
**Purpose**: A correlated signal event discovered during investigation (metric spike, deploy, log error, etc).
```
id: UUID (PK)
investigation_id: UUID (FK → investigations, required)
event_type: Literal['metric', 'log', 'alert', 'deploy', 'commit', 'feature_flag', 'trace', 'config_change']
title: str (required)
description: str | None
source: str (required; integration slug e.g. 'datadog', 'github')
timestamp: datetime (required)
correlation_score: float | None (0.0–1.0)
```
Relationships: belongs to investigation

### InvestigationAction
**Purpose**: A remediation action taken or recommended during an investigation.
```
id: UUID (PK)
investigation_id: UUID (FK → investigations, required)
action_type: Literal['automated_fix', 'manual_fix', 'rollback', 'scale', 'restart', 'config_update']
description: str (required)
command: str | None (optional CLI command)
risk: Literal['low', 'medium', 'high'] (default='low')
status: Literal['pending', 'approved', 'executing', 'done', 'failed'] (default='pending')
result: str | None
performed_by: str | None (user or agent name)
performed_at: datetime | None
```
Relationships: belongs to investigation

### Agent
**Purpose**: Registry record for an AI agent in the fleet.
```
id: UUID (PK)
org_id: UUID | None (FK → organizations)
name: str (required; e.g. 'Sentinel', 'Arbiter')
type: Literal['investigator', 'monitor', 'remediation', 'reporter', 'triage', 'knowledge']
status: Literal['active', 'idle', 'error'] (default='idle')
tasks_completed_today: int (default=0)
current_task: str | None
capabilities: list[str] (default=[])
config: dict (default={})
created_at: datetime
updated_at: datetime
```
Relationships: belongs to org; has many agent_logs

### AgentLog
**Purpose**: Structured log entry from an agent execution.
```
id: UUID (PK)
agent_id: UUID (FK → agents, required)
level: Literal['debug', 'info', 'warn', 'error'] (default='info')
message: str (required)
metadata: dict (default={})
created_at: datetime
```
Relationships: belongs to agent

### ChatSession
**Purpose**: A named conversation session between a user and the AI assistant.
```
id: UUID (PK)
user_id: UUID (FK → auth.users, required)
project_id: UUID | None (FK → projects)
investigation_id: UUID | None (FK → investigations)
title: str (default='New Chat')
status: Literal['active', 'archived'] (default='active')
created_at: datetime
updated_at: datetime
```
Relationships: belongs to user; has many chat_messages; optionally linked to project/investigation

### ChatMessage
**Purpose**: A single message in a chat session.
```
id: UUID (PK)
session_id: UUID (FK → chat_sessions, required)
role: Literal['user', 'assistant', 'system'] (required)
content: str (required)
metadata: dict | None (pipeline context, sources, confidence scores)
created_at: datetime
```
Relationships: belongs to chat_session

### Integration
**Purpose**: A connected third-party tool configured at the org level.
```
id: UUID (PK)
org_id: UUID (FK → organizations, required)
type: str (required; e.g. 'datadog', 'splunk', 'github')
name: str (required)
status: Literal['active', 'inactive', 'error'] (default='inactive')
config: dict (encrypted fields: API keys, URLs)
last_sync_at: datetime | None
events_today: int (default=0)
data_sources: dict | None ({ logs: bool, alerts: bool, events: bool, metrics: bool })
created_at: datetime
updated_at: datetime
```
Relationships: belongs to org; referenced by project data_sources configs

### KnowledgeDocument
**Purpose**: A runbook, postmortem, architecture doc, or playbook scoped to an org/domain/project.
```
id: UUID (PK)
org_id: UUID (FK → organizations, required)
domain_id: UUID | None (FK → domains)
project_id: UUID | None (FK → projects)
name: str (required)
title: str (required)
type: Literal['runbook', 'architecture', 'postmortem', 'sop', 'known-issue', 'playbook', 'documentation']
summary: str (default='')
size: int | None (bytes)
status: Literal['active', 'processing', 'failed'] (default='active')
url: str | None (external link or storage path)
author: str (default='')
created_at: datetime
updated_at: datetime
```
Relationships: belongs to org; optionally scoped to domain or project

### AuditLog
**Purpose**: Immutable audit trail of significant user and agent actions.
```
id: UUID (PK)
org_id: UUID | None (FK → organizations)
actor_type: Literal['user', 'agent', 'system'] (required)
actor_name: str (required)
action: str (required; e.g. 'created', 'resolved', 'deleted')
resource_type: str (required; e.g. 'investigation', 'project')
resource_name: str (required)
ip_address: str | None
metadata: dict (default={})
created_at: datetime
```
Relationships: belongs to org; append-only (no updates or deletes)

### EventSource
**Purpose**: A webhook endpoint or polling source that feeds events into the platform.
```
id: UUID (PK)
project_id: UUID (FK → projects, required)
type: str (required; integration slug)
name: str (required)
status: Literal['listening', 'paused', 'error'] (default='listening')
config: dict (default={})
webhook_token: str | None (auto-generated for inbound webhooks)
last_event_at: datetime | None
last_event_summary: str (default='')
created_at: datetime
```
Relationships: belongs to project; has many event_log entries

### EventLog
**Purpose**: Historical record of events received and processed by the platform.
```
id: UUID (PK)
project_id: UUID (FK → projects, required)
event_source_id: UUID | None (FK → event_sources)
source_type: str (required)
source_name: str (required)
event_type: str (required)
payload_summary: str (required)
payload: dict (full event payload)
action_taken: str (default='')
status: Literal['processed', 'logged', 'error'] (default='logged')
created_at: datetime
```
Relationships: belongs to project and optionally event_source

### DashboardMetrics (Computed — not persisted)
**Purpose**: Aggregated metrics for the overview dashboard.
```
active_investigations: int
mttr_minutes: float | None
mttd_minutes: float | None
health_pct: float (0.0–100.0)
health_degraded: int
health_critical: int
investigations_by_day: list[DayBucket]
incidents_by_service: list[ServiceBucket]
```

---

## Endpoint Catalog

### Auth Domain — `/api/v1/auth`

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/v1/auth/register | Register new user |
| POST | /api/v1/auth/login | Login with email/password |
| POST | /api/v1/auth/logout | Invalidate session |
| GET | /api/v1/auth/me | Get current user session + profile |
| POST | /api/v1/auth/refresh | Refresh access token |

### Users Domain — `/api/v1/users`

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/users/me | Get current user's profile |
| PATCH | /api/v1/users/me | Update profile fields |
| GET | /api/v1/users/me/api-keys | List API keys for current user |
| POST | /api/v1/users/me/api-keys | Create new API key |
| DELETE | /api/v1/users/me/api-keys/{key_id} | Revoke API key |

### Organizations Domain — `/api/v1/orgs`

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/orgs | List all orgs (paginated) |
| POST | /api/v1/orgs | Create new org |
| GET | /api/v1/orgs/{org_id} | Get org detail |
| PATCH | /api/v1/orgs/{org_id} | Update org settings |
| DELETE | /api/v1/orgs/{org_id} | Delete org |
| GET | /api/v1/orgs/{org_id}/members | List org members |
| POST | /api/v1/orgs/{org_id}/members | Add member |
| PATCH | /api/v1/orgs/{org_id}/members/{user_id} | Update member role |
| DELETE | /api/v1/orgs/{org_id}/members/{user_id} | Remove member |

### Domains — `/api/v1/domains`

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/orgs/{org_id}/domains | List domains for org |
| POST | /api/v1/orgs/{org_id}/domains | Create domain |
| GET | /api/v1/domains/{domain_id} | Get domain detail |
| PATCH | /api/v1/domains/{domain_id} | Update domain |
| DELETE | /api/v1/domains/{domain_id} | Delete domain |

### Projects — `/api/v1/projects`

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/projects | List all projects (flat, paginated, filterable) |
| GET | /api/v1/orgs/{org_id}/domains/{domain_id}/projects | List projects in domain |
| POST | /api/v1/orgs/{org_id}/domains/{domain_id}/projects | Create project |
| GET | /api/v1/projects/{project_id} | Get project detail |
| PATCH | /api/v1/projects/{project_id} | Update project |
| DELETE | /api/v1/projects/{project_id} | Delete project |
| GET | /api/v1/projects/{project_id}/health | Get project health summary |
| PATCH | /api/v1/projects/{project_id}/notifications | Update notification config |
| GET | /api/v1/projects/{project_id}/data-sources | List data source configs |
| PATCH | /api/v1/projects/{project_id}/data-sources/{integration_id} | Update data source config |
| GET | /api/v1/projects/{project_id}/components | List components |
| POST | /api/v1/projects/{project_id}/components | Add component |
| PATCH | /api/v1/projects/{project_id}/components/{component_id} | Update component |
| DELETE | /api/v1/projects/{project_id}/components/{component_id} | Delete component |

### Investigations — `/api/v1/investigations`

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/investigations | List investigations (paginated, multi-filter) |
| POST | /api/v1/investigations | Create investigation |
| GET | /api/v1/investigations/{investigation_id} | Get investigation detail |
| PATCH | /api/v1/investigations/{investigation_id} | Update investigation |
| POST | /api/v1/investigations/{investigation_id}/resolve | Resolve investigation (action endpoint) |
| POST | /api/v1/investigations/{investigation_id}/escalate | Escalate investigation |
| GET | /api/v1/investigations/{investigation_id}/events | List correlated events |
| POST | /api/v1/investigations/{investigation_id}/events | Add investigation event |
| GET | /api/v1/investigations/{investigation_id}/actions | List remediation actions |
| POST | /api/v1/investigations/{investigation_id}/actions | Add action |
| PATCH | /api/v1/investigations/{investigation_id}/actions/{action_id} | Update action status |
| GET | /api/v1/investigations/{investigation_id}/timeline | Get timeline view |

### Agents — `/api/v1/agents`

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/agents | List agents for org |
| POST | /api/v1/agents | Register/deploy new agent |
| GET | /api/v1/agents/{agent_id} | Get agent detail |
| PATCH | /api/v1/agents/{agent_id} | Update agent config/status |
| DELETE | /api/v1/agents/{agent_id} | Remove agent |
| GET | /api/v1/agents/{agent_id}/logs | Get agent logs (paginated) |
| GET | /api/v1/agents/{agent_id}/logs/stream | SSE stream of live logs |
| POST | /api/v1/agents/{agent_id}/tasks | Assign task to agent |
| GET | /api/v1/agents/status | Summary of all agents' current status |

### Chat — `/api/v1/chat`

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/chat/sessions | List chat sessions for user |
| POST | /api/v1/chat/sessions | Create new session |
| GET | /api/v1/chat/sessions/{session_id} | Get session detail + messages |
| PATCH | /api/v1/chat/sessions/{session_id} | Update session title/status |
| DELETE | /api/v1/chat/sessions/{session_id} | Delete session (cascade messages) |
| GET | /api/v1/chat/sessions/{session_id}/messages | List messages |
| POST | /api/v1/chat/sessions/{session_id}/messages | Send message (triggers AI response) |
| GET | /api/v1/chat/sessions/{session_id}/pipeline | SSE stream of live agent pipeline execution |

### Integrations — `/api/v1/integrations`

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/integrations | List all integrations for org |
| POST | /api/v1/integrations | Connect/create integration |
| GET | /api/v1/integrations/{integration_id} | Get integration detail |
| PATCH | /api/v1/integrations/{integration_id} | Update integration config |
| DELETE | /api/v1/integrations/{integration_id} | Disconnect integration |
| POST | /api/v1/integrations/{integration_id}/test | Test connection |
| GET | /api/v1/integrations/catalog | List all available integration types |

### Knowledge — `/api/v1/knowledge`

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/knowledge | List knowledge docs (scoped: org/domain/project) |
| POST | /api/v1/knowledge | Create/link knowledge doc |
| GET | /api/v1/knowledge/{doc_id} | Get doc detail |
| PATCH | /api/v1/knowledge/{doc_id} | Update doc metadata |
| DELETE | /api/v1/knowledge/{doc_id} | Delete doc |
| POST | /api/v1/knowledge/upload | Upload file (returns storage path + doc record) |
| GET | /api/v1/knowledge/search | Semantic/full-text search |

### Dashboard — `/api/v1/dashboard`

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/dashboard/summary | KPI card data (active investigations, MTTR, health %) |
| GET | /api/v1/dashboard/investigations-trend | Time-series investigation counts by day |
| GET | /api/v1/dashboard/incidents-by-service | Incident breakdown per service |
| GET | /api/v1/dashboard/service-health | Service health map data |
| GET | /api/v1/dashboard/slo-risk | SLO burn rate / risk panel data |
| GET | /api/v1/dashboard/activity-stream | Recent activity feed (deploys, alerts, resolutions) |
| GET | /api/v1/dashboard/agent-activity | Active agent status list |

### Audit — `/api/v1/audit`

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/audit | List audit log entries (paginated, filtered) |

### Alerts — `/api/v1/alerts`

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/alerts | List incoming alerts (paginated) |
| PATCH | /api/v1/alerts/{alert_id}/acknowledge | Acknowledge alert |
| PATCH | /api/v1/alerts/{alert_id}/dismiss | Dismiss alert |
| POST | /api/v1/alerts/{alert_id}/investigate | Create investigation from alert |

### Event Sources — `/api/v1/event-sources`

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/projects/{project_id}/event-sources | List event sources |
| POST | /api/v1/projects/{project_id}/event-sources | Create event source |
| PATCH | /api/v1/event-sources/{source_id} | Update config |
| DELETE | /api/v1/event-sources/{source_id} | Delete source |
| GET | /api/v1/event-sources/{source_id}/events | List event log entries |

### Notifications — `/api/v1/notifications`

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/notifications/integrations | List team notification integrations (Slack, Teams) |
| POST | /api/v1/notifications/integrations | Connect notification integration |
| PATCH | /api/v1/notifications/integrations/{id} | Update config |
| DELETE | /api/v1/notifications/integrations/{id} | Disconnect |
| POST | /api/v1/notifications/integrations/{id}/test | Send test notification |

---

## Migration Phases

### Phase 1 — Core Unblocking (Highest Priority)

1. **Auth endpoints** — Replace Supabase Auth JWT. Many screens gated on user session.
2. **User profile endpoints** — `GET/PATCH /api/v1/users/me`
3. **Org/Domain/Project CRUD** — Unblocks all hierarchy screens (currently 100% local state, no persistence)
4. **Investigations CRUD + list/filter** — Core product workflow
5. **Investigation events** — Required by InvestigationDetailPage
6. **Dashboard summary** — Unblocks OverviewPage KPI cards

### Phase 2 — Supporting Flows

7. **Chat sessions + messages** — Replace Supabase direct chat queries
8. **Agents list + status** — Replace Supabase agents table queries
9. **Integrations catalog + connect/disconnect** — Replace integration mock
10. **Knowledge documents CRUD** — Unblocks KnowledgePage and project knowledge tabs
11. **Audit log read** — Unblocks AuditLogPage

### Phase 3 — Async & Advanced

12. **Chat pipeline streaming (SSE)** — Replace client-side simulation
13. **Agent log streaming (SSE)** — Live logs in LogsPanel
14. **Event sources + event log** — Full webhook ingestion pipeline
15. **Alert triage** — AlertTriagePage with full lifecycle
16. **Notification integrations** — Slack/Teams connection and test endpoints
17. **Knowledge file upload + semantic search**
18. **SLO risk panel + advanced analytics**

---

## Gaps and Assumptions

### Confirmed Gaps
- **No existing FastAPI or backend API layer exists** — all data access is direct Supabase
- **Org/Domain/Project hierarchy has no persistence** — 100% client-side React state with mock data; creating or editing orgs/domains/projects is lost on page refresh
- **Agent pipeline is fully simulated client-side** — no server actually runs agent tasks; pipeline.ts contains hardcoded scenario data
- **Chat AI responses are stubbed** — no LLM integration exists today; responses are static strings from aiResponses.ts
- **File upload for knowledge docs is incomplete** — UI supports it but no storage backend is wired
- **Notification delivery is not implemented** — config UI exists but Slack/Teams messages are never actually sent
- **Alert triage page is a placeholder** — no real alert ingestion pipeline exists

### Assumptions
- The FastAPI backend will use PostgreSQL (same DB Supabase uses) with SQLAlchemy or asyncpg
- JWT auth will continue to be used; existing Supabase JWTs may be bridged via a compatibility adapter initially
- The AI agent pipeline will eventually be server-side using an LLM (OpenAI, Anthropic, etc.) with async task execution
- Chat streaming will use SSE from FastAPI once real LLM integration is added
- File storage for knowledge documents will use S3-compatible storage (Supabase Storage → AWS S3 / R2)
- Semantic search for knowledge will require embedding-based search (pgvector or a vector DB)
