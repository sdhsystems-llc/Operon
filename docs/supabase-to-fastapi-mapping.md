# Supabase to FastAPI Migration Mapping — Operon

## Overview

This document maps every current Supabase dependency in the Operon frontend to its FastAPI replacement. The frontend uses Supabase for: PostgreSQL queries, Auth (JWT), and Storage. There are no Supabase Realtime subscriptions in use today. All usages are direct client-side calls via `@supabase/supabase-js`.

---

## File-by-File Supabase Usage

### `src/lib/supabase.ts`
**Type**: Client setup
**What it does**: Creates and exports a singleton Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
**FastAPI replacement**: Replace with a generic `apiClient` utility (e.g., using `fetch` or `axios`) that targets `VITE_API_BASE_URL` and attaches the Bearer JWT token from auth context on every request.
**Migration notes**: Keep this file but add a parallel `src/lib/apiClient.ts` that wraps `fetch` with auth headers. Migrate callers incrementally.
**Risk**: Low — straightforward swap.

```typescript
// Current
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(url, anonKey)

// Replacement
export const apiClient = {
  get: (path, params?) => fetch(`${API_BASE}${path}?${qs(params)}`, { headers: authHeaders() }),
  post: (path, body) => fetch(`${API_BASE}${path}`, { method: 'POST', body: JSON.stringify(body), headers: authHeaders() }),
  patch: (path, body) => fetch(`${API_BASE}${path}`, { method: 'PATCH', body: JSON.stringify(body), headers: authHeaders() }),
  delete: (path) => fetch(`${API_BASE}${path}`, { method: 'DELETE', headers: authHeaders() }),
}
```

---

### `src/contexts/AuthContext.tsx` (and `src/context/AuthContext.tsx`)
**Type**: Supabase Auth
**Operations used**:
- `supabase.auth.getSession()` — check for existing JWT session on load
- `supabase.auth.onAuthStateChange()` — listen for login/logout events
- `supabase.auth.signOut()` — logout
- `supabase.from('user_profiles').select().eq('user_id', userId).maybeSingle()` — load profile after login

**FastAPI replacement**:
- `getSession()` → `GET /api/v1/auth/me` — returns current user + profile if JWT is valid
- `onAuthStateChange` → Not needed; FastAPI is stateless; frontend stores JWT in localStorage and checks on mount
- `signOut()` → `POST /api/v1/auth/logout` (optional; mostly clear localStorage)
- Profile load → `GET /api/v1/users/me`

**Migration notes**: The auth context is global and used by all authenticated screens. Migrate this first. Keep the same context interface (`user`, `profile`, `signOut`) so all consumers are unaffected.
**Compatibility adapter**: During transition, can continue using Supabase JWT for auth while adding profile fetch from FastAPI. Supabase tokens can be validated in FastAPI using the Supabase JWT secret.
**Risk**: Medium — session handling is critical path; must be tested thoroughly.

---

### `src/pages/ChatPage.tsx`
**Type**: Supabase PostgreSQL
**Operations**:

| Supabase Call | Table | Operation | FastAPI Replacement |
|---|---|---|---|
| `.from('chat_sessions').select().eq('user_id', userId).order('updated_at', 'desc')` | chat_sessions | LIST | `GET /api/v1/chat/sessions` |
| `.from('chat_sessions').insert({...}).select().single()` | chat_sessions | CREATE | `POST /api/v1/chat/sessions` |
| `.from('chat_sessions').update({title, updated_at}).eq('id', id)` | chat_sessions | UPDATE | `PATCH /api/v1/chat/sessions/{id}` |
| `.from('chat_sessions').delete().eq('id', id)` | chat_sessions | DELETE | `DELETE /api/v1/chat/sessions/{id}` |
| `.from('chat_messages').select().eq('session_id', id).order('created_at', 'asc')` | chat_messages | LIST | `GET /api/v1/chat/sessions/{id}/messages` |
| `.from('chat_messages').insert({session_id, role, content})` | chat_messages | CREATE | `POST /api/v1/chat/sessions/{id}/messages` |
| `.from('chat_messages').delete().eq('session_id', id)` | chat_messages | BULK DELETE | `DELETE /api/v1/chat/sessions/{id}` (cascade) |

**Migration notes**: The message creation on the assistant side is currently done locally in the frontend (the response is generated from `aiResponses.ts` or `agentPipeline.ts`). Once the backend handles AI responses, the `POST /messages` endpoint should return both the user message confirmation and trigger an async AI response that either streams (SSE) or is polled.
**Risk**: Medium — chat is core UX; session list and history must be preserved.

---

### `src/lib/seedData.ts`
**Type**: Supabase PostgreSQL (seed script run once on signup)
**Operations**: Bulk inserts into: user_profiles, projects, investigations, investigation_events, chat_sessions, chat_messages, integrations, knowledge_documents
**FastAPI replacement**: Backend seeding via a `/api/v1/auth/register` endpoint that triggers a service-layer seed method, or a separate admin endpoint `POST /api/v1/admin/seed-demo`.
**Migration notes**: The seed data is only for demo/testing; in production users start fresh. The seed logic can be moved to a backend service method called once on first login/registration.
**Risk**: Low — non-critical path.

---

### `src/pages/InvestigationsPage.tsx`
**Type**: Supabase PostgreSQL
**Operations**:

| Supabase Call | FastAPI Replacement |
|---|---|
| `investigations.select().eq('project_id', id).order('created_at', 'desc')` | `GET /api/v1/investigations?project_id={id}&order=created_at:desc` |
| `investigations.select().in('status', [...])` | `GET /api/v1/investigations?status=open,investigating` |
| `investigations.select().eq('severity', 'p1')` | `GET /api/v1/investigations?severity=p1` |

**Migration notes**: The investigations list page needs pagination. Frontend should pass `page` and `page_size` query params.
**Risk**: Low — straightforward list/filter.

---

### `src/pages/InvestigationDetailPage.tsx`
**Type**: Supabase PostgreSQL
**Operations**:

| Supabase Call | FastAPI Replacement |
|---|---|
| `investigations.select().eq('id', id).single()` | `GET /api/v1/investigations/{id}` |
| `investigation_events.select().eq('investigation_id', id).order('timestamp', 'asc')` | `GET /api/v1/investigations/{id}/events` |
| `investigations.update({status:'resolved', root_cause, resolved_at}).eq('id', id)` | `POST /api/v1/investigations/{id}/resolve` |
| `investigation_events.insert({...})` | `POST /api/v1/investigations/{id}/events` |

**Migration notes**: The resolve action should be an action-style endpoint, not a raw PATCH, so the backend can compute `duration_minutes`, fire notifications, and write an audit log entry atomically.
**Risk**: Low.

---

### `src/pages/AgentsPage.tsx`
**Type**: Supabase PostgreSQL
**Operations**:

| Supabase Call | FastAPI Replacement |
|---|---|
| `agents.select().eq('org_id', orgId)` | `GET /api/v1/agents?org_id={orgId}` |
| `agents.update({config}).eq('id', id)` | `PATCH /api/v1/agents/{id}` |
| Agent logs: simulated locally via `LOG_TEMPLATES` | `GET /api/v1/agents/{id}/logs` + SSE stream |

**Migration notes**: Agent logs are currently 100% mocked (LOG_TEMPLATES generates random messages). The backend needs an `agent_logs` table or a log ingestion pipeline. The LogsPanel component auto-scrolls a live feed — implement as SSE or 2s polling.
**Risk**: Medium — log streaming needs SSE or WebSocket.

---

### `src/pages/IntegrationsPage.tsx`
**Type**: Supabase PostgreSQL + Mock
**Operations**:

| Supabase Call | FastAPI Replacement |
|---|---|
| `integrations.select().eq('org_id', orgId)` | `GET /api/v1/integrations?org_id={orgId}` |
| `integrations.upsert({type, name, config, status})` | `POST /api/v1/integrations` or `PATCH /api/v1/integrations/{id}` |
| `integrations.delete().eq('id', id)` | `DELETE /api/v1/integrations/{id}` |

**Note**: The integration catalog (list of all 24 available integration types with logos, descriptions, field definitions) is currently mock data in `src/pages/integrations/providerConfig.ts`. The FastAPI team should either:
1. Expose this as `GET /api/v1/integrations/catalog` (static config) — recommended
2. Keep it as frontend static data (acceptable, rarely changes)

**Migration notes**: Integration credentials (API keys, tokens) must be encrypted at rest. FastAPI service should use a secrets manager or column encryption.
**Risk**: Medium — security-sensitive (credentials).

---

### `src/pages/KnowledgePage.tsx`
**Type**: Supabase PostgreSQL
**Operations**:

| Supabase Call | FastAPI Replacement |
|---|---|
| `knowledge_documents.select().eq('org_id', orgId)` | `GET /api/v1/knowledge?org_id={orgId}` |
| `knowledge_documents.insert({name, type, url, org_id, status:'active'})` | `POST /api/v1/knowledge` |
| `knowledge_documents.delete().eq('id', id)` | `DELETE /api/v1/knowledge/{id}` |

**Note**: File upload for knowledge docs is partially implemented in the UI (AddKnowledgeModal). Currently no actual upload to Supabase Storage is wired — the URL field is just a link. A proper file upload endpoint is needed.
**Migration notes**: Add `POST /api/v1/knowledge/upload` that accepts multipart/form-data and stores in S3/R2.
**Risk**: Medium — file storage infrastructure needed.

---

### `src/pages/AuditLogPage.tsx`
**Type**: Supabase PostgreSQL
**Operations**:

| Supabase Call | FastAPI Replacement |
|---|---|
| `audit_log.select().eq('org_id', orgId).order('created_at', 'desc')` | `GET /api/v1/audit?org_id={orgId}&order=created_at:desc` |
| Filters: actor_type, resource_type, date range | `GET /api/v1/audit?actor_type=agent&from=2025-01-01&to=2025-12-31` |

**Migration notes**: Audit log is read-only from the UI. Write path is internal (service layer) or event-driven.
**Risk**: Low.

---

### `src/pages/SettingsPage.tsx` (all tabs)
**Type**: Supabase PostgreSQL
**Operations**:

| Feature | Supabase Call | FastAPI Replacement |
|---|---|---|
| Profile view/edit | `user_profiles.select/update` | `GET/PATCH /api/v1/users/me` |
| Org settings | `organizations.select/update` | `GET/PATCH /api/v1/orgs/{id}` |
| Team members | `organization_members.select/insert/update/delete` | `GET/POST/PATCH/DELETE /api/v1/orgs/{id}/members` |
| API keys | `api_keys.select/insert/delete` | `GET/POST/DELETE /api/v1/users/me/api-keys` |
| Projects list | `projects.select` | `GET /api/v1/projects?org_id={id}` |

**Risk**: Low.

---

### `src/pages/projects/ProjectsContext.tsx`
**Type**: Local React state (NO Supabase — 100% in-memory)
**What it does**: Holds the entire org/domain/project hierarchy in React context. All CRUD (add/edit/delete org, domain, project) mutates this local state only — **no persistence**.

This is the most critical migration gap. Data is lost on page refresh.

**FastAPI replacement**: Remove the local state mutations and replace with API calls:

| Context Action | FastAPI Replacement |
|---|---|
| `addOrg(org)` | `POST /api/v1/orgs` |
| `updateOrg(id, org)` | `PATCH /api/v1/orgs/{id}` |
| `deleteOrg(id)` | `DELETE /api/v1/orgs/{id}` |
| `addDomain(orgId, domain)` | `POST /api/v1/orgs/{orgId}/domains` |
| `updateDomain(orgId, id, domain)` | `PATCH /api/v1/domains/{id}` |
| `deleteDomain(orgId, id)` | `DELETE /api/v1/domains/{id}` |
| `addProject(orgId, domainId, project)` | `POST /api/v1/orgs/{orgId}/domains/{domainId}/projects` |
| `updateProject(orgId, domainId, project)` | `PATCH /api/v1/projects/{id}` |
| `deleteProject(orgId, domainId, id)` | `DELETE /api/v1/projects/{id}` |
| `getAllProjects()` | `GET /api/v1/projects` (flat list with org/domain names) |
| `getAllDomains()` | `GET /api/v1/domains` (flat list with org names) |

**Migration strategy**: Replace context mutations with API calls. Context can be kept as a cache layer on top of API data (use `useQuery` patterns or SWR).
**Risk**: High — largest scope change; no existing persistence layer means all hierarchy data must be migrated.

---

### `src/pages/TeamIntegrationsPage.tsx`
**Type**: Supabase PostgreSQL (partially mocked)
**Operations**:

| Feature | Supabase Call | FastAPI Replacement |
|---|---|---|
| List team integrations | `team_integrations.select().eq('organization_id', orgId)` | `GET /api/v1/notifications/integrations` |
| Connect Slack | `team_integrations.insert({type:'slack', config, status:'active'})` | `POST /api/v1/notifications/integrations` |
| Update Teams | `team_integrations.update({config}).eq('id', id)` | `PATCH /api/v1/notifications/integrations/{id}` |
| Test notification | Currently fires a local toast | `POST /api/v1/notifications/integrations/{id}/test` |

**Migration notes**: The Slack OAuth flow (workspace authorization) needs a server-side redirect handler. The current implementation uses a direct webhook URL — simpler to implement first.
**Risk**: Medium — OAuth flow for Slack needs server redirect URL.

---

### `src/context/ReportContext.tsx`
**Type**: Local state + Supabase Storage (placeholder)
**What it does**: Manages an active "report" banner/modal state. Currently local state only.
**FastAPI replacement**: If reports need to be persisted and shared, add `GET/POST /api/v1/reports`. Otherwise keep as local state.
**Risk**: Low — not blocking any core workflows.

---

## Supabase Auth Replacement Strategy

### Current Auth Flow
```
1. supabase.auth.signUp({ email, password })
   → Creates auth.users record
   → Triggers DB trigger to create user_profiles row

2. supabase.auth.signInWithPassword({ email, password })
   → Returns JWT access_token + refresh_token

3. Every Supabase query uses the JWT (Row Level Security validates it)

4. supabase.auth.onAuthStateChange()
   → Session restored from localStorage on app mount
```

### FastAPI Replacement
```
1. POST /api/v1/auth/register { email, password, full_name }
   → Creates user in backend DB
   → Returns JWT { access_token, refresh_token, token_type }

2. POST /api/v1/auth/login { email, password }
   → Returns JWT tokens
   → Frontend stores in localStorage

3. Every API request includes: Authorization: Bearer {access_token}
   → FastAPI dependency: get_current_user(token: str = Depends(oauth2_scheme))

4. Frontend checks localStorage on mount, calls GET /api/v1/auth/me
   → Returns { user, profile } if token is valid

5. POST /api/v1/auth/refresh { refresh_token }
   → Returns new access_token

6. POST /api/v1/auth/logout
   → Invalidates refresh token server-side (optional)
   → Frontend clears localStorage
```

### Compatibility Adapter (Transitional)
During phased migration, Supabase JWTs can be validated in FastAPI by verifying against the Supabase JWT secret:
```python
from jose import jwt
SUPABASE_JWT_SECRET = settings.supabase_jwt_secret

def verify_supabase_token(token: str) -> dict:
    return jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
```
This allows the frontend to continue using Supabase Auth while migrating API endpoints incrementally.

---

## Supabase Storage Replacement

### Current Storage Usage
- **Knowledge documents**: UI supports file upload but currently only stores URL links — no actual Supabase Storage calls found
- **User avatars**: `avatar_url` field exists in user_profiles; no upload UI found

### FastAPI Replacement
```
POST /api/v1/knowledge/upload
  Content-Type: multipart/form-data
  Body: file (binary) + metadata (name, type, org_id, scope)
  Response: { doc_id, url, storage_path }

Backend: Store file in S3/R2/Supabase Storage
         Store metadata in knowledge_documents table
         Return pre-signed or CDN URL
```

---

## Supabase Realtime Replacement

### Current Realtime Usage
**None confirmed** — no `supabase.channel()` or `.on('postgres_changes')` calls found in the codebase.

### Simulated Realtime
The following features simulate real-time behavior via client-side timers and state:
- **Agent pipeline execution**: `setTimeout`-based task staggering in `agentPipeline.ts`
- **Live agent logs**: `setInterval`-based random log generation in `LogsPanel.tsx`
- **Activity stream**: Static mock data displayed as if streaming

### FastAPI Real-time Recommendations

| Feature | Current | Recommended FastAPI Pattern |
|---|---|---|
| Agent pipeline execution | Client-side simulation (setTimeout) | SSE: `GET /api/v1/chat/sessions/{id}/pipeline` |
| Live agent logs | Client-side random generation | SSE: `GET /api/v1/agents/{id}/logs/stream` |
| Live incident feed | Static mock with polling potential | Polling: `GET /api/v1/investigations?updated_since={timestamp}` every 30s |
| Activity stream | Static mock data | Polling: `GET /api/v1/dashboard/activity-stream?after={timestamp}` every 60s |
| Chat response streaming | Not implemented (full response at once) | SSE: stream tokens from LLM as they arrive |

---

## Supabase Edge Functions Replacement

### Current Edge Function Usage
**None found** — no Supabase Edge Functions calls in the frontend codebase.

### Implicit Backend Logic Needing Service Layer
The following logic is currently in the frontend and should move to FastAPI services:

| Frontend Logic | Location | FastAPI Service |
|---|---|---|
| Generate agent pipeline from user query | `agentPipeline.ts` matchPipeline() | `pipeline_service.py` — query intent detection + pipeline orchestration |
| Generate AI text responses | `aiResponses.ts` | `chat_service.py` — LLM integration |
| Agent workflow step execution | `agentWorkflows.ts` | `agent_service.py` — async task execution |
| Seed demo data on signup | `seedData.ts` | `user_service.py` — post-registration hook |

---

## Migration Risk Summary

| Area | Risk Level | Notes |
|---|---|---|
| Supabase Auth → FastAPI JWT | Medium | Critical path; use compatibility adapter during transition |
| user_profiles CRUD | Low | Simple table; direct replacement |
| Org/Domain/Project hierarchy | High | Currently no persistence; largest scope change |
| Investigations + Events | Low | Clean Supabase table; straightforward replacement |
| Chat sessions + messages | Medium | Session ordering and cascade delete needed |
| Agent fleet management | Medium | Logs need streaming pattern; pipeline is client-side |
| Integration catalog + config | Medium | Credential encryption required |
| Knowledge documents | Medium | File upload infrastructure needed |
| Dashboard analytics | Low | Computed from existing tables |
| Audit log | Low | Read-only from UI; append-only write pattern |
| Notifications (Slack/Teams) | Medium | OAuth flow needed for Slack |
| Alert triage | Low | Currently placeholder |
