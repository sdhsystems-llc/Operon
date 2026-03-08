# Frontend to API Matrix — Operon SRE Platform

This matrix maps every UI capability and screen to the FastAPI endpoints required to support it, along with current data source, priority, and migration notes.

---

## Column Definitions

- **Capability**: The user-facing feature or action
- **UI Location**: File path(s) of the screen/component
- **Current Source**: How the frontend gets data today (`supabase`, `mock`, `local-state`, `computed`)
- **Required FastAPI Endpoint(s)**: The backend route(s) needed
- **Priority**: P1 (critical, blocks core UX) / P2 (important, supporting flow) / P3 (secondary/admin/async)
- **Migration Notes**: Key considerations for cutover

---

## Authentication & Session

| Capability | UI Location | Current Source | Required FastAPI Endpoint(s) | Priority | Migration Notes |
|---|---|---|---|---|---|
| User registration | `src/pages/auth/RegisterPage.tsx` | supabase auth | `POST /api/v1/auth/register` | P1 | Must return JWT + profile; replace `supabase.auth.signUp()` |
| User login | `src/pages/auth/LoginPage.tsx` | supabase auth | `POST /api/v1/auth/login` | P1 | Must return JWT; replace `supabase.auth.signInWithPassword()` |
| Session restore on app mount | `src/contexts/AuthContext.tsx` | supabase getSession | `GET /api/v1/auth/me` | P1 | Called on every app load; critical for auth gate |
| Logout | Sidebar / header | supabase signOut | `POST /api/v1/auth/logout` | P1 | Clear localStorage JWT; session invalidation optional |
| Token refresh | `src/contexts/AuthContext.tsx` | supabase auto-refresh | `POST /api/v1/auth/refresh` | P1 | Frontend must handle 401 → refresh → retry |
| Load user profile after login | `src/contexts/AuthContext.tsx` | supabase user_profiles | `GET /api/v1/users/me` | P1 | Profile needed for role checks and display name |

---

## User Profile & Settings

| Capability | UI Location | Current Source | Required FastAPI Endpoint(s) | Priority | Migration Notes |
|---|---|---|---|---|---|
| View profile | `src/pages/settings/ProfileTab.tsx` | supabase user_profiles | `GET /api/v1/users/me` | P1 | |
| Edit profile (name, timezone, avatar) | `src/pages/settings/ProfileTab.tsx` | supabase user_profiles | `PATCH /api/v1/users/me` | P2 | |
| View API keys list | `src/pages/settings/ApiKeysTab.tsx` | supabase api_keys | `GET /api/v1/users/me/api-keys` | P2 | Key value never shown after creation |
| Create API key | `src/pages/settings/ApiKeysTab.tsx` | supabase api_keys | `POST /api/v1/users/me/api-keys` | P2 | Return full key only once |
| Revoke API key | `src/pages/settings/ApiKeysTab.tsx` | supabase api_keys | `DELETE /api/v1/users/me/api-keys/{id}` | P2 | |
| View org settings | `src/pages/settings/OrgTab.tsx` | supabase orgs | `GET /api/v1/orgs/{org_id}` | P2 | |
| Edit org settings | `src/pages/settings/OrgTab.tsx` | supabase orgs | `PATCH /api/v1/orgs/{org_id}` | P2 | |
| View team members | `src/pages/settings/TeamTab.tsx` | supabase org_members | `GET /api/v1/orgs/{org_id}/members` | P2 | |
| Add team member | `src/pages/settings/TeamTab.tsx` | supabase org_members | `POST /api/v1/orgs/{org_id}/members` | P2 | |
| Change member role | `src/pages/settings/TeamTab.tsx` | supabase org_members | `PATCH /api/v1/orgs/{org_id}/members/{user_id}` | P2 | |
| Remove team member | `src/pages/settings/TeamTab.tsx` | supabase org_members | `DELETE /api/v1/orgs/{org_id}/members/{user_id}` | P2 | |
| View projects (settings) | `src/pages/settings/ProjectsTab.tsx` | mock / local-state | `GET /api/v1/projects?org_id={id}` | P2 | |

---

## Organization Hierarchy

| Capability | UI Location | Current Source | Required FastAPI Endpoint(s) | Priority | Migration Notes |
|---|---|---|---|---|---|
| List all orgs | `src/pages/projects/OrgsPage.tsx` | local-state (ProjectsContext) | `GET /api/v1/orgs` | P1 | Currently no persistence — data lost on refresh |
| Create org | `src/pages/projects/components/OrgModal.tsx` | local-state | `POST /api/v1/orgs` | P1 | |
| Edit org | `src/pages/projects/components/OrgModal.tsx` | local-state | `PATCH /api/v1/orgs/{id}` | P1 | |
| Delete org | `src/pages/projects/OrgDetailPage.tsx` (confirm modal) | local-state | `DELETE /api/v1/orgs/{id}` | P1 | Cascade delete domains + projects |
| View org detail with domains | `src/pages/projects/OrgDetailPage.tsx` | local-state | `GET /api/v1/orgs/{id}`, `GET /api/v1/orgs/{id}/domains` | P1 | |
| List all domains (flat) | `src/pages/projects/DomainsPage.tsx` | local-state | `GET /api/v1/domains?flat=true` | P1 | Returns domains with org_name |
| List domains for org | `src/pages/projects/OrgDetailPage.tsx` | local-state | `GET /api/v1/orgs/{id}/domains` | P1 | |
| Create domain | `src/pages/projects/components/DomainModal.tsx` | local-state | `POST /api/v1/orgs/{org_id}/domains` | P1 | |
| Edit domain | `src/pages/projects/components/DomainModal.tsx` | local-state | `PATCH /api/v1/domains/{id}` | P1 | |
| Delete domain | `src/pages/projects/DomainDetailPage.tsx` | local-state | `DELETE /api/v1/domains/{id}` | P1 | Cascade delete projects |
| View domain detail with projects | `src/pages/projects/DomainDetailPage.tsx` | local-state | `GET /api/v1/domains/{id}`, `GET /api/v1/orgs/{org_id}/domains/{id}/projects` | P1 | |

---

## Projects

| Capability | UI Location | Current Source | Required FastAPI Endpoint(s) | Priority | Migration Notes |
|---|---|---|---|---|---|
| List all projects (flat, filtered) | `src/pages/projects/ProjectsListPage.tsx` | local-state | `GET /api/v1/projects?org_id=&env=&search=` | P1 | Needs org_name + domain_name in response |
| List projects in domain | `src/pages/projects/DomainDetailPage.tsx` | local-state | `GET /api/v1/orgs/{oid}/domains/{did}/projects` | P1 | |
| Create project | `src/pages/projects/components/ProjectModal.tsx` | local-state | `POST /api/v1/orgs/{oid}/domains/{did}/projects` | P1 | |
| Edit project (name, description, URLs, env) | `src/pages/projects/ProjectDetailPage.tsx` (Overview tab) | local-state | `PATCH /api/v1/projects/{id}` | P1 | |
| Delete project | Confirm modal in ProjectDetailPage | local-state | `DELETE /api/v1/projects/{id}` | P1 | |
| View project overview (health, SLO, on-call, last deploy, activity) | `src/pages/projects/components/tabs/OverviewTab.tsx` | local-state (mock) | `GET /api/v1/projects/{id}`, `GET /api/v1/projects/{id}/health` | P1 | health_score, slo_actual are computed |
| Manage data sources | `src/pages/projects/components/tabs/DataSourcesTab.tsx` | local-state | `GET /api/v1/projects/{id}/data-sources`, `PATCH /api/v1/projects/{id}/data-sources/{integration_id}` | P2 | |
| Manage assigned agents | `src/pages/projects/components/tabs/AgentsTab.tsx` | local-state | `GET /api/v1/agents?project_id={id}`, `POST/DELETE /api/v1/projects/{id}/agents/{agent_id}` | P2 | |
| Manage integrations | `src/pages/projects/components/tabs/IntegrationsTab.tsx` | local-state + supabase | `GET /api/v1/integrations?org_id=`, `POST/DELETE /api/v1/integrations` | P2 | |
| Manage knowledge docs | `src/pages/projects/components/tabs/KnowledgeTab.tsx` | local-state + supabase | `GET /api/v1/knowledge?project_id=`, `POST /api/v1/knowledge`, `DELETE /api/v1/knowledge/{id}` | P2 | |
| Configure notification routing | `src/pages/projects/ProjectDetailPage.tsx` (Notifications tab) | local-state | `PATCH /api/v1/projects/{id}/notifications` | P2 | |
| Manage components | `src/pages/projects/ProjectDetailPage.tsx` (Components tab) | local-state | `GET/POST/PATCH/DELETE /api/v1/projects/{id}/components` | P3 | Only shown in advanced mode |

---

## Investigations

| Capability | UI Location | Current Source | Required FastAPI Endpoint(s) | Priority | Migration Notes |
|---|---|---|---|---|---|
| List investigations (filtered, sorted) | `src/pages/InvestigationsPage.tsx` | supabase investigations | `GET /api/v1/investigations?project_id=&status=&severity=` | P1 | Pagination required |
| Create investigation | `src/pages/NewInvestigationPage.tsx` | supabase investigations | `POST /api/v1/investigations` | P1 | |
| View investigation detail | `src/pages/InvestigationDetailPage.tsx` | supabase investigations | `GET /api/v1/investigations/{id}` | P1 | |
| View investigation events (timeline) | `src/pages/InvestigationDetailPage.tsx` | supabase investigation_events | `GET /api/v1/investigations/{id}/events` | P1 | |
| View investigation timeline view | `src/pages/InvestigationDetailPage.tsx` | supabase investigation_events | `GET /api/v1/investigations/{id}/timeline` | P2 | Chronological annotated view |
| Resolve investigation | `src/pages/InvestigationDetailPage.tsx` | supabase investigations update | `POST /api/v1/investigations/{id}/resolve` | P1 | Action endpoint; computes duration, fires notifications |
| Escalate investigation | `src/pages/InvestigationDetailPage.tsx` | supabase investigations update | `POST /api/v1/investigations/{id}/escalate` | P2 | |
| Add investigation event | Backend / agent action | supabase investigation_events | `POST /api/v1/investigations/{id}/events` | P2 | Typically called by agent pipeline, not user directly |
| View remediation actions | `src/pages/InvestigationDetailPage.tsx` | mock MOCK_REMEDIATIONS | `GET /api/v1/investigations/{id}/actions` | P2 | Currently keyed by service name in mock data |
| Add/update remediation action | `src/pages/InvestigationDetailPage.tsx` | mock only | `POST /api/v1/investigations/{id}/actions`, `PATCH /api/v1/investigations/{id}/actions/{id}` | P2 | |

---

## Dashboard / Overview

| Capability | UI Location | Current Source | Required FastAPI Endpoint(s) | Priority | Migration Notes |
|---|---|---|---|---|---|
| KPI cards (active investigations, MTTR, health %) | `src/pages/overview/KpiCards.tsx`, `SystemKpis.tsx` | computed from mock investigations | `GET /api/v1/dashboard/summary` | P1 | MTTR computed from resolved investigations |
| SLO risk panel | `src/pages/overview/SloRiskPanel.tsx` | mock data | `GET /api/v1/dashboard/slo-risk` | P2 | |
| Org health chart (trend) | `src/pages/overview/OrgHealthChart.tsx` | mock data | `GET /api/v1/dashboard/investigations-trend` | P2 | |
| Live incident feed | `src/pages/overview/LiveIncidentFeed.tsx` | mock MOCK_INVESTIGATIONS | `GET /api/v1/investigations?status=open,investigating&order=created_at:desc&limit=10` | P1 | |
| Service health map | `src/pages/overview/ServiceHealthMap.tsx` | mock data | `GET /api/v1/dashboard/service-health` | P2 | Service topology with status |
| Agent activity panel | `src/pages/overview/AgentActivityPanel.tsx` | mock agents | `GET /api/v1/agents/status` | P2 | |
| Live activity stream | `src/pages/overview/LiveActivityStream.tsx` | mock data | `GET /api/v1/dashboard/activity-stream` | P2 | Poll every 60s |
| Incidents by service chart | `src/pages/overview/IncidentsByServiceChart.tsx` | computed from mock | `GET /api/v1/dashboard/incidents-by-service` | P2 | |
| Investigations trend chart | `src/pages/overview/InvestigationsTrendChart.tsx` | computed from mock | `GET /api/v1/dashboard/investigations-trend` | P2 | |

---

## AI Agent Fleet

| Capability | UI Location | Current Source | Required FastAPI Endpoint(s) | Priority | Migration Notes |
|---|---|---|---|---|---|
| List agents with status | `src/pages/AgentsPage.tsx`, `src/pages/agents/AgentCard.tsx` | supabase agents | `GET /api/v1/agents` | P2 | |
| View agent detail | `src/pages/agents/AgentCard.tsx` | supabase agents | `GET /api/v1/agents/{id}` | P2 | |
| View agent logs (paginated) | `src/pages/agents/LogsPanel.tsx` | mock LOG_TEMPLATES (simulated) | `GET /api/v1/agents/{id}/logs` | P2 | Currently random simulation; replace with real log storage |
| Live agent log stream | `src/pages/agents/LogsPanel.tsx` | client-side setInterval | `GET /api/v1/agents/{id}/logs/stream` (SSE) | P3 | Stream new logs as they arrive |
| Deploy new agent | `src/pages/agents/DeployWizard.tsx` | mock only | `POST /api/v1/agents` | P3 | Wizard collects: name, type, capabilities, config |
| Update agent config | `src/pages/agents/AgentCard.tsx` | supabase agents update | `PATCH /api/v1/agents/{id}` | P2 | |
| Global agent status summary | `src/pages/overview/AgentActivityPanel.tsx` | mock | `GET /api/v1/agents/status` | P2 | Returns list of agents with current task |

---

## Chat / Conversational Investigation

| Capability | UI Location | Current Source | Required FastAPI Endpoint(s) | Priority | Migration Notes |
|---|---|---|---|---|---|
| List chat sessions | `src/pages/ChatPage.tsx` (sidebar) | supabase chat_sessions | `GET /api/v1/chat/sessions` | P1 | Ordered by updated_at desc |
| Create new chat session | `src/pages/ChatPage.tsx` | supabase chat_sessions | `POST /api/v1/chat/sessions` | P1 | |
| Update session title | `src/pages/ChatPage.tsx` | supabase chat_sessions | `PATCH /api/v1/chat/sessions/{id}` | P2 | |
| Delete chat session | `src/pages/ChatPage.tsx` | supabase chat_sessions + messages | `DELETE /api/v1/chat/sessions/{id}` (cascade) | P2 | Backend cascades message deletion |
| Load message history | `src/pages/ChatPage.tsx` | supabase chat_messages | `GET /api/v1/chat/sessions/{id}/messages` | P1 | Ordered by created_at asc |
| Send user message | `src/pages/ChatPage.tsx` | supabase chat_messages insert | `POST /api/v1/chat/sessions/{id}/messages` | P1 | |
| Receive AI response | `src/pages/ChatPage.tsx` | aiResponses.ts (mock) | `POST /api/v1/chat/sessions/{id}/messages` response or SSE | P1 | Currently static mock; needs LLM integration |
| Live agent pipeline visualization | `src/components/chat/InvestigationPipeline.tsx`, `AgentWorkflowCard.tsx` | agentPipeline.ts (client-side simulation) | `GET /api/v1/chat/sessions/{id}/pipeline` (SSE) | P2 | Multi-agent task streaming; highest complexity |
| Quick investigation prompts | `src/pages/ChatPage.tsx` (prompt buttons) | local hardcoded | Same as "Send user message" | P2 | Prompts are pre-defined; routing logic on backend |
| View past investigation results | `src/components/chat/pipeline/PastInvestigationCard.tsx` | local state donePipelines | `GET /api/v1/investigations?session_id={id}` or embedded in session | P3 | |

---

## Integrations

| Capability | UI Location | Current Source | Required FastAPI Endpoint(s) | Priority | Migration Notes |
|---|---|---|---|---|---|
| Browse integration catalog | `src/pages/IntegrationsPage.tsx`, `IntegrationCard.tsx` | mock (providerConfig.ts) | `GET /api/v1/integrations/catalog` (or keep as static frontend data) | P2 | Catalog rarely changes; can stay frontend static |
| View connected integrations | `src/pages/IntegrationsPage.tsx` | supabase integrations | `GET /api/v1/integrations?org_id=` | P2 | |
| Connect integration (with config) | `src/pages/integrations/ConfigurePanel.tsx` | supabase integrations | `POST /api/v1/integrations` | P2 | Credentials must be encrypted |
| Update integration config | `src/pages/integrations/ConfigurePanel.tsx` | supabase integrations | `PATCH /api/v1/integrations/{id}` | P2 | |
| Disconnect integration | `src/pages/IntegrationsPage.tsx` | supabase integrations delete | `DELETE /api/v1/integrations/{id}` | P2 | |
| Test integration connection | `src/pages/IntegrationsPage.tsx` | mock toast | `POST /api/v1/integrations/{id}/test` | P3 | |

---

## Knowledge Management

| Capability | UI Location | Current Source | Required FastAPI Endpoint(s) | Priority | Migration Notes |
|---|---|---|---|---|---|
| List knowledge docs (org-wide) | `src/pages/KnowledgePage.tsx` | supabase knowledge_documents | `GET /api/v1/knowledge?org_id=` | P2 | |
| List knowledge docs (project-scoped) | `src/pages/projects/components/tabs/KnowledgeTab.tsx`, `KnowledgeDocsPanel.tsx` | local-state + supabase | `GET /api/v1/knowledge?project_id=` | P2 | |
| Add knowledge doc (link) | `src/pages/projects/components/AddKnowledgeModal.tsx` | supabase knowledge_documents | `POST /api/v1/knowledge` | P2 | |
| Upload knowledge file | `src/pages/projects/components/AddKnowledgeModal.tsx` | incomplete (no storage wired) | `POST /api/v1/knowledge/upload` (multipart) | P3 | Needs storage backend |
| Delete knowledge doc | `src/pages/KnowledgePage.tsx`, `KnowledgeDocsPanel.tsx` | supabase knowledge_documents | `DELETE /api/v1/knowledge/{id}` | P2 | |
| Search knowledge docs | `src/pages/KnowledgePage.tsx` (search field) | client-side filter on mock | `GET /api/v1/knowledge/search?q=` | P3 | Semantic search needs embedding infrastructure |

---

## Notifications & Team Integrations

| Capability | UI Location | Current Source | Required FastAPI Endpoint(s) | Priority | Migration Notes |
|---|---|---|---|---|---|
| View team notification integrations | `src/pages/TeamIntegrationsPage.tsx` | supabase team_integrations | `GET /api/v1/notifications/integrations` | P2 | |
| Connect Slack workspace | `src/pages/team-integrations/SlackSection.tsx` | partial mock | `POST /api/v1/notifications/integrations` | P3 | Slack OAuth needs server redirect |
| Configure Slack channel | `src/pages/team-integrations/SlackSection.tsx` | local state | `PATCH /api/v1/notifications/integrations/{id}` | P3 | |
| Connect Teams | `src/pages/team-integrations/TeamsSection.tsx` | partial mock | `POST /api/v1/notifications/integrations` | P3 | |
| Send test notification | `src/pages/team-integrations/SlackSection.tsx` | local toast | `POST /api/v1/notifications/integrations/{id}/test` | P3 | |
| Toggle notification events per project | `src/pages/projects/ProjectDetailPage.tsx` (Notifications tab) | local-state | `PATCH /api/v1/projects/{id}/notifications` | P2 | |

---

## Audit Log

| Capability | UI Location | Current Source | Required FastAPI Endpoint(s) | Priority | Migration Notes |
|---|---|---|---|---|---|
| Browse audit log | `src/pages/AuditLogPage.tsx` | mock (mockAuditData.ts) | `GET /api/v1/audit?org_id=&actor_type=&resource_type=&from=&to=` | P3 | Read-only; current mock has realistic structure |
| Filter by actor type | `src/pages/AuditLogPage.tsx` | client-side filter | `GET /api/v1/audit?actor_type=agent` | P3 | |
| Filter by date range | `src/pages/AuditLogPage.tsx` | client-side filter | `GET /api/v1/audit?from=&to=` | P3 | |

---

## Alert Triage

| Capability | UI Location | Current Source | Required FastAPI Endpoint(s) | Priority | Migration Notes |
|---|---|---|---|---|---|
| View incoming alerts | `src/pages/AlertTriagePage.tsx` | placeholder/mock | `GET /api/v1/alerts?status=open` | P3 | Page is currently a placeholder |
| Acknowledge alert | `src/pages/AlertTriagePage.tsx` | mock | `PATCH /api/v1/alerts/{id}/acknowledge` | P3 | |
| Dismiss alert | `src/pages/AlertTriagePage.tsx` | mock | `PATCH /api/v1/alerts/{id}/dismiss` | P3 | |
| Create investigation from alert | `src/pages/AlertTriagePage.tsx` | mock | `POST /api/v1/alerts/{id}/investigate` | P3 | Creates investigation pre-linked to alert |

---

## Summary by Priority

### P1 — Must implement first (core product unblocking)
Endpoints that unblock the main user workflows and most-visited screens:

1. `POST /api/v1/auth/register`
2. `POST /api/v1/auth/login`
3. `GET /api/v1/auth/me`
4. `POST /api/v1/auth/logout`
5. `GET /api/v1/users/me`
6. `PATCH /api/v1/users/me`
7. `GET /api/v1/orgs`
8. `POST /api/v1/orgs`
9. `GET /api/v1/orgs/{id}`
10. `PATCH /api/v1/orgs/{id}`
11. `DELETE /api/v1/orgs/{id}`
12. `GET /api/v1/orgs/{id}/domains`
13. `POST /api/v1/orgs/{id}/domains`
14. `PATCH /api/v1/domains/{id}`
15. `DELETE /api/v1/domains/{id}`
16. `GET /api/v1/projects` (flat list)
17. `POST /api/v1/orgs/{oid}/domains/{did}/projects`
18. `GET /api/v1/projects/{id}`
19. `PATCH /api/v1/projects/{id}`
20. `DELETE /api/v1/projects/{id}`
21. `GET /api/v1/investigations`
22. `POST /api/v1/investigations`
23. `GET /api/v1/investigations/{id}`
24. `POST /api/v1/investigations/{id}/resolve`
25. `GET /api/v1/investigations/{id}/events`
26. `GET /api/v1/dashboard/summary`
27. `GET /api/v1/chat/sessions`
28. `POST /api/v1/chat/sessions`
29. `GET /api/v1/chat/sessions/{id}/messages`
30. `POST /api/v1/chat/sessions/{id}/messages`

### P2 — Implement next (supporting flows + detail screens)
31–55: Investigation events/actions/timeline, agents list/status/logs, integrations connect/list, knowledge CRUD, dashboard charts, project data sources/notifications, settings/team management

### P3 — Phase 3 (async, admin, secondary)
56+: SSE streaming (pipeline, agent logs), file upload, semantic search, alert triage, notifications test, audit log, agent deploy wizard
