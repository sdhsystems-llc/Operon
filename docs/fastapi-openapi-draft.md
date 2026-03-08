# FastAPI OpenAPI Draft — Operon SRE Platform

All endpoints are prefixed with `/api/v1`. All requests/responses use `application/json` unless noted. All authenticated endpoints require `Authorization: Bearer {access_token}`.

---

## Auth Domain

### POST /api/v1/auth/register
Register a new user account.

**Auth**: None required

**Request body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "Jane Smith",
  "org_name": "Acme Corp"
}
```

**Pydantic models**:
```python
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=1, max_length=255)
    org_name: str = Field(min_length=1, max_length=255)

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserProfileResponse
```

**Response 201**:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "user_id": "uuid",
    "full_name": "Jane Smith",
    "role": "admin",
    "org_name": "Acme Corp",
    "timezone": "UTC",
    "avatar_url": null,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### POST /api/v1/auth/login
Authenticate with email and password.

**Auth**: None required

**Request body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Pydantic models**:
```python
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserProfileResponse
```

**Response 200**: Same shape as `/register`
**Response 401**: `{ "detail": "Invalid credentials" }`

---

### GET /api/v1/auth/me
Get current authenticated user's session info and profile.

**Auth**: Required

**Response 200**:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { ...UserProfileResponse }
}
```

---

### POST /api/v1/auth/logout
Invalidate the current refresh token.

**Auth**: Required

**Request body**: `{ "refresh_token": "eyJ..." }`
**Response 204**: No content

---

### POST /api/v1/auth/refresh
Exchange a refresh token for a new access token.

**Auth**: None (refresh token in body)

**Request body**: `{ "refresh_token": "eyJ..." }`
**Response 200**: `{ "access_token": "eyJ...", "token_type": "bearer" }`

---

## Users Domain

### GET /api/v1/users/me
Get current user's profile.

**Auth**: Required

**Pydantic models**:
```python
class UserProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    full_name: str
    role: Literal["admin", "engineer", "viewer"]
    avatar_url: str | None
    org_name: str
    timezone: str
    default_project_id: UUID | None
    created_at: datetime
    updated_at: datetime
```

**Response 200**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "full_name": "Jane Smith",
  "role": "admin",
  "avatar_url": null,
  "org_name": "Acme Corp",
  "timezone": "America/New_York",
  "default_project_id": null,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

---

### PATCH /api/v1/users/me
Update current user's profile.

**Auth**: Required

**Pydantic models**:
```python
class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None
    org_name: str | None = None
    timezone: str | None = None
    default_project_id: UUID | None = None
```

**Request body** (all fields optional):
```json
{
  "full_name": "Jane Smith-Jones",
  "timezone": "Europe/London"
}
```

**Response 200**: Updated `UserProfileResponse`

---

### GET /api/v1/users/me/api-keys
List API keys for current user (key values are never returned after creation).

**Auth**: Required

**Pydantic models**:
```python
class ApiKeyResponse(BaseModel):
    id: UUID
    name: str
    key_prefix: str   # e.g. "op_sk_abc1..."
    created_at: datetime
    last_used_at: datetime | None

class ApiKeyListResponse(BaseModel):
    items: list[ApiKeyResponse]
    total: int
```

**Response 200**:
```json
{
  "items": [
    { "id": "uuid", "name": "Production Key", "key_prefix": "op_sk_abc1...", "created_at": "...", "last_used_at": "..." }
  ],
  "total": 1
}
```

---

### POST /api/v1/users/me/api-keys
Create a new API key. Returns the full key **once only**.

**Auth**: Required

**Request body**: `{ "name": "CI Pipeline Key" }`

**Pydantic models**:
```python
class ApiKeyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)

class ApiKeyCreatedResponse(BaseModel):
    id: UUID
    name: str
    key: str    # Full key shown only once: "op_sk_abc1...xyz9"
    key_prefix: str
    created_at: datetime
```

**Response 201**:
```json
{
  "id": "uuid",
  "name": "CI Pipeline Key",
  "key": "op_sk_abc1...xyz9",
  "key_prefix": "op_sk_abc1...",
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

### DELETE /api/v1/users/me/api-keys/{key_id}
Revoke an API key.

**Auth**: Required
**Response 204**: No content

---

## Organizations Domain

### GET /api/v1/orgs
List all organizations accessible to current user.

**Auth**: Required
**Query params**: `page=1`, `page_size=20`, `search=`

**Pydantic models**:
```python
class OrgResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    industry: str | None
    timezone: str
    plan: Literal["free", "pro", "enterprise"]
    created_at: datetime

class OrgListResponse(BaseModel):
    items: list[OrgResponse]
    total: int
    page: int
    page_size: int
```

**Response 200**:
```json
{
  "items": [
    { "id": "uuid", "name": "Acme Corp", "slug": "acme-corp", "industry": "SaaS", "timezone": "UTC", "plan": "enterprise", "created_at": "..." }
  ],
  "total": 2,
  "page": 1,
  "page_size": 20
}
```

---

### POST /api/v1/orgs
Create a new organization.

**Auth**: Required

**Pydantic models**:
```python
class OrgCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    industry: str | None = None
    timezone: str = "UTC"
    plan: Literal["free", "pro", "enterprise"] = "free"
```

**Request body**:
```json
{ "name": "Acme Corp", "industry": "SaaS / Software", "timezone": "UTC", "plan": "enterprise" }
```

**Response 201**: `OrgResponse`

---

### GET /api/v1/orgs/{org_id}
Get org detail with member count and domain count.

**Auth**: Required

**Response 200**:
```json
{
  "id": "uuid", "name": "Acme Corp", "slug": "acme-corp",
  "industry": "SaaS / Software", "timezone": "UTC", "plan": "enterprise",
  "domain_count": 3, "project_count": 9, "member_count": 4,
  "created_at": "..."
}
```

---

### PATCH /api/v1/orgs/{org_id}
Update org settings.

**Auth**: Required (admin role)

**Pydantic models**:
```python
class OrgUpdate(BaseModel):
    name: str | None = None
    industry: str | None = None
    timezone: str | None = None
    plan: str | None = None
```

**Response 200**: Updated `OrgResponse`

---

### DELETE /api/v1/orgs/{org_id}
Delete org and all children (cascade).

**Auth**: Required (admin role)
**Response 204**: No content

---

### GET /api/v1/orgs/{org_id}/members
List org members.

**Auth**: Required

**Pydantic models**:
```python
class OrgMemberResponse(BaseModel):
    user_id: UUID
    full_name: str
    email: str
    role: Literal["admin", "engineer", "viewer"]
    avatar_url: str | None
    active: bool
    joined_at: datetime
```

**Response 200**: `{ "items": [OrgMemberResponse...], "total": int }`

---

## Domains Domain

### GET /api/v1/orgs/{org_id}/domains
List domains for an org.

**Auth**: Required

**Pydantic models**:
```python
class DomainResponse(BaseModel):
    id: UUID
    org_id: UUID
    name: str
    description: str
    owner_team: str
    notification_channel: str | None
    color: str
    project_count: int
    created_at: datetime

class DomainListResponse(BaseModel):
    items: list[DomainResponse]
    total: int
```

**Response 200**:
```json
{
  "items": [
    {
      "id": "uuid", "org_id": "uuid", "name": "E-Commerce", "description": "...",
      "owner_team": "Commerce Team", "notification_channel": "#ecom-incidents",
      "color": "#60a5fa", "project_count": 4, "created_at": "..."
    }
  ],
  "total": 3
}
```

---

### POST /api/v1/orgs/{org_id}/domains
Create a domain.

**Auth**: Required

**Pydantic models**:
```python
class DomainCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    owner_team: str = ""
    notification_channel: str | None = None
    color: str = "#60a5fa"
```

**Response 201**: `DomainResponse`

---

### PATCH /api/v1/domains/{domain_id}
Update domain.

**Auth**: Required

**Pydantic models**:
```python
class DomainUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    owner_team: str | None = None
    notification_channel: str | None = None
    color: str | None = None
```

**Response 200**: Updated `DomainResponse`

---

## Projects Domain

### GET /api/v1/projects
Flat paginated list of all projects with filters.

**Auth**: Required
**Query params**: `org_id=`, `domain_id=`, `environment=production`, `search=`, `page=1`, `page_size=20`

**Pydantic models**:
```python
class ProjectListItem(BaseModel):
    id: UUID
    org_id: UUID
    org_name: str
    domain_id: UUID | None
    domain_name: str | None
    name: str
    description: str
    environment: Literal["production", "staging", "development"]
    status: str
    service_url: str | None
    repo_url: str | None
    health_score: float | None   # 0.0-100.0 computed
    slo_target: str | None
    slo_actual: str | None
    active_investigations: int
    agent_count: int
    last_deploy_at: datetime | None
    created_at: datetime

class ProjectListResponse(BaseModel):
    items: list[ProjectListItem]
    total: int
    page: int
    page_size: int
```

**Response 200**:
```json
{
  "items": [
    {
      "id": "uuid", "org_id": "uuid", "org_name": "Acme Corp",
      "domain_id": "uuid", "domain_name": "E-Commerce",
      "name": "Checkout Service", "description": "...",
      "environment": "production", "status": "active",
      "service_url": "https://checkout.acme.com", "repo_url": "github.com/acme/checkout",
      "health_score": 97.3, "slo_target": "99.9%", "slo_actual": "99.82%",
      "active_investigations": 2, "agent_count": 2,
      "last_deploy_at": "2025-01-01T12:00:00Z", "created_at": "..."
    }
  ],
  "total": 10,
  "page": 1,
  "page_size": 20
}
```

---

### POST /api/v1/orgs/{org_id}/domains/{domain_id}/projects
Create a project.

**Auth**: Required

**Pydantic models**:
```python
class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    environment: Literal["production", "staging", "development"] = "production"
    service_url: str | None = None
    repo_url: str | None = None
    slo_target: str | None = None
```

**Response 201**: `ProjectResponse` (full detail)

---

### GET /api/v1/projects/{project_id}
Get full project detail.

**Auth**: Required

**Pydantic models**:
```python
class ProjectDataSource(BaseModel):
    integration_id: str
    enabled: bool
    config: dict[str, str]

class ProjectComponent(BaseModel):
    id: UUID
    name: str
    description: str
    tech: str

class ProjectNotificationConfig(BaseModel):
    enabled: bool
    platform: Literal["slack", "teams", "both", "inherit"]
    slack_channel: str
    teams_channel: str
    events: dict[str, bool]   # new_investigation, root_cause_identified, etc.
    alert_levels: dict[str, bool]  # p1, p2, p3

class ProjectResponse(BaseModel):
    id: UUID
    org_id: UUID
    org_name: str
    domain_id: UUID | None
    domain_name: str | None
    name: str
    description: str
    environment: str
    service_url: str | None
    repo_url: str | None
    health_score: float | None
    slo_target: str | None
    slo_actual: str | None
    notification_config: ProjectNotificationConfig | None
    data_sources: list[ProjectDataSource]
    components: list[ProjectComponent]
    active_investigations: int
    agent_count: int
    doc_count: int
    created_at: datetime
    updated_at: datetime
```

**Response 200**: `ProjectResponse`

---

### PATCH /api/v1/projects/{project_id}
Update project fields.

**Auth**: Required

**Pydantic models**:
```python
class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    environment: str | None = None
    service_url: str | None = None
    repo_url: str | None = None
    slo_target: str | None = None
```

**Response 200**: Updated `ProjectResponse`

---

### PATCH /api/v1/projects/{project_id}/notifications
Update project notification config.

**Auth**: Required

**Request body**: `ProjectNotificationConfig` (full object)
**Response 200**: Updated `ProjectNotificationConfig`

---

### PATCH /api/v1/projects/{project_id}/data-sources/{integration_id}
Update a data source config for a project.

**Auth**: Required

**Request body**:
```json
{
  "enabled": true,
  "config": {
    "Service Name": "checkout-prod",
    "Environment": "production",
    "APM Service": "checkout-api"
  }
}
```

**Response 200**:
```json
{ "integration_id": "datadog", "enabled": true, "config": { ... } }
```

---

## Investigations Domain

### GET /api/v1/investigations
Paginated, filterable list of investigations.

**Auth**: Required
**Query params**: `project_id=`, `status=open,investigating`, `severity=p1,p2`, `service=`, `search=`, `order=created_at:desc`, `page=1`, `page_size=20`

**Pydantic models**:
```python
class InvestigationListItem(BaseModel):
    id: UUID
    project_id: UUID
    project_name: str
    title: str
    severity: Literal["p1", "p2", "p3", "p4"]
    status: Literal["open", "investigating", "resolved", "escalated"]
    service: str
    assigned_agent: str | None
    created_at: datetime
    resolved_at: datetime | None
    duration_minutes: int | None

class InvestigationListResponse(BaseModel):
    items: list[InvestigationListItem]
    total: int
    page: int
    page_size: int
```

**Response 200**:
```json
{
  "items": [
    {
      "id": "inv-001", "project_id": "uuid", "project_name": "Checkout Service",
      "title": "Connection Pool Exhausted", "severity": "p1",
      "status": "investigating", "service": "checkout-service",
      "assigned_agent": "Sentinel", "created_at": "2025-01-01T10:00:00Z",
      "resolved_at": null, "duration_minutes": null
    }
  ],
  "total": 12, "page": 1, "page_size": 20
}
```

---

### POST /api/v1/investigations
Create a new investigation.

**Auth**: Required

**Pydantic models**:
```python
class InvestigationCreate(BaseModel):
    project_id: UUID
    title: str = Field(min_length=1, max_length=500)
    severity: Literal["p1", "p2", "p3", "p4"]
    service: str
    assigned_agent: str | None = None
```

**Request body**:
```json
{
  "project_id": "uuid",
  "title": "Payment Gateway Timeout Spike",
  "severity": "p1",
  "service": "payment-gateway",
  "assigned_agent": "Sentinel"
}
```

**Response 201**: `InvestigationResponse` (full detail)

---

### GET /api/v1/investigations/{investigation_id}
Get full investigation detail.

**Auth**: Required

**Pydantic models**:
```python
class InvestigationResponse(BaseModel):
    id: UUID
    project_id: UUID
    project_name: str
    title: str
    severity: Literal["p1", "p2", "p3", "p4"]
    status: Literal["open", "investigating", "resolved", "escalated"]
    service: str
    assigned_agent: str | None
    root_cause: str | None
    created_at: datetime
    resolved_at: datetime | None
    duration_minutes: int | None
    event_count: int
    action_count: int
```

---

### POST /api/v1/investigations/{investigation_id}/resolve
Resolve an investigation (action endpoint — triggers downstream side effects).

**Auth**: Required

**Request body**:
```json
{
  "root_cause": "Connection pool exhausted due to connection leak in checkout v2.14.3",
  "resolution_notes": "Rolled back to v2.14.2, increased pool size to 200"
}
```

**Pydantic models**:
```python
class ResolveInvestigationRequest(BaseModel):
    root_cause: str = Field(min_length=1)
    resolution_notes: str = ""
```

**Response 200**: Updated `InvestigationResponse` with `status="resolved"`, `resolved_at`, `duration_minutes` computed.
**Side effects**: Creates audit_log entry, fires notifications if configured.

---

### GET /api/v1/investigations/{investigation_id}/events
List correlated events for an investigation.

**Auth**: Required

**Pydantic models**:
```python
class InvestigationEventResponse(BaseModel):
    id: UUID
    investigation_id: UUID
    event_type: Literal["metric", "log", "alert", "deploy", "commit", "feature_flag", "trace", "config_change"]
    title: str
    description: str | None
    source: str
    timestamp: datetime
    correlation_score: float | None

class InvestigationEventsResponse(BaseModel):
    items: list[InvestigationEventResponse]
    total: int
```

**Response 200**:
```json
{
  "items": [
    {
      "id": "uuid", "investigation_id": "uuid",
      "event_type": "metric", "title": "Connection pool 98% utilisation",
      "description": "threshold: 80%", "source": "datadog",
      "timestamp": "2025-01-01T10:00:00Z", "correlation_score": 0.97
    }
  ],
  "total": 5
}
```

---

### POST /api/v1/investigations/{investigation_id}/events
Add a correlated event.

**Auth**: Required

**Pydantic models**:
```python
class InvestigationEventCreate(BaseModel):
    event_type: Literal["metric", "log", "alert", "deploy", "commit", "feature_flag", "trace", "config_change"]
    title: str
    description: str | None = None
    source: str
    timestamp: datetime
    correlation_score: float | None = Field(None, ge=0.0, le=1.0)
```

**Response 201**: `InvestigationEventResponse`

---

### GET /api/v1/investigations/{investigation_id}/timeline
Timeline view with events sorted chronologically, annotated with severity.

**Auth**: Required

**Response 200**:
```json
{
  "investigation_id": "uuid",
  "title": "Connection Pool Exhausted",
  "created_at": "2025-01-01T10:00:00Z",
  "resolved_at": null,
  "events": [
    { "at": "2025-01-01T09:45:00Z", "type": "deploy", "label": "Checkout v2.14.3 deployed", "source": "github", "score": 0.89 },
    { "at": "2025-01-01T09:50:00Z", "type": "metric", "label": "Connection pool 98% utilisation", "source": "datadog", "score": 0.97 },
    { "at": "2025-01-01T10:00:00Z", "type": "alert", "label": "Investigation started by Sentinel", "source": "operon", "score": 1.0 }
  ]
}
```

---

## Agents Domain

### GET /api/v1/agents
List agents for org.

**Auth**: Required
**Query params**: `org_id=`, `status=active,idle,error`, `type=monitor`

**Pydantic models**:
```python
class AgentResponse(BaseModel):
    id: UUID
    org_id: UUID | None
    name: str
    type: Literal["investigator", "monitor", "remediation", "reporter", "triage", "knowledge"]
    status: Literal["active", "idle", "error"]
    tasks_completed_today: int
    current_task: str | None
    capabilities: list[str]
    created_at: datetime
    updated_at: datetime

class AgentListResponse(BaseModel):
    items: list[AgentResponse]
    total: int
```

**Response 200**:
```json
{
  "items": [
    {
      "id": "uuid", "org_id": "uuid", "name": "Sentinel", "type": "monitor",
      "status": "active", "tasks_completed_today": 142,
      "current_task": "Monitoring CloudWatch metrics — anomaly score 0.74",
      "capabilities": ["metrics", "logs", "alerting", "anomaly-detection"],
      "created_at": "...", "updated_at": "..."
    }
  ],
  "total": 6
}
```

---

### GET /api/v1/agents/{agent_id}/logs
Paginated agent logs.

**Auth**: Required
**Query params**: `level=info,warn,error`, `page=1`, `page_size=50`

**Pydantic models**:
```python
class AgentLogResponse(BaseModel):
    id: UUID
    agent_id: UUID
    level: Literal["debug", "info", "warn", "error"]
    message: str
    metadata: dict
    created_at: datetime

class AgentLogListResponse(BaseModel):
    items: list[AgentLogResponse]
    total: int
    page: int
    page_size: int
```

---

### GET /api/v1/agents/{agent_id}/logs/stream
SSE stream of live agent logs.

**Auth**: Required
**Response**: `text/event-stream`

**Event format**:
```
event: log
data: {"id":"uuid","level":"info","message":"Polling Datadog metrics for checkout-service...","created_at":"2025-01-01T10:05:00Z"}

event: log
data: {"id":"uuid","level":"warn","message":"Anomaly score crossed threshold 0.75","created_at":"2025-01-01T10:05:02Z"}
```

---

## Chat Domain

### GET /api/v1/chat/sessions
List chat sessions for current user.

**Auth**: Required
**Query params**: `page=1`, `page_size=20`

**Pydantic models**:
```python
class ChatSessionListItem(BaseModel):
    id: UUID
    title: str
    status: Literal["active", "archived"]
    message_count: int
    created_at: datetime
    updated_at: datetime

class ChatSessionListResponse(BaseModel):
    items: list[ChatSessionListItem]
    total: int
```

---

### POST /api/v1/chat/sessions
Create a new chat session.

**Auth**: Required

**Request body**:
```json
{ "title": "New Chat", "project_id": null, "investigation_id": null }
```

**Pydantic models**:
```python
class ChatSessionCreate(BaseModel):
    title: str = "New Chat"
    project_id: UUID | None = None
    investigation_id: UUID | None = None
```

**Response 201**:
```json
{
  "id": "uuid", "title": "New Chat", "status": "active",
  "message_count": 0, "created_at": "...", "updated_at": "..."
}
```

---

### GET /api/v1/chat/sessions/{session_id}/messages
List messages in a session.

**Auth**: Required

**Pydantic models**:
```python
class ChatMessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    role: Literal["user", "assistant", "system"]
    content: str
    metadata: dict | None
    created_at: datetime

class ChatMessagesResponse(BaseModel):
    items: list[ChatMessageResponse]
    total: int
```

---

### POST /api/v1/chat/sessions/{session_id}/messages
Send a user message. Returns user message + triggers async AI response.

**Auth**: Required

**Request body**:
```json
{
  "content": "Investigate billing service degradation",
  "role": "user"
}
```

**Pydantic models**:
```python
class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1)
    role: Literal["user"] = "user"
```

**Response 201** (non-streaming):
```json
{
  "user_message": {
    "id": "uuid", "session_id": "uuid", "role": "user",
    "content": "Investigate billing service degradation",
    "metadata": null, "created_at": "..."
  },
  "assistant_message": {
    "id": "uuid", "session_id": "uuid", "role": "assistant",
    "content": "I've identified a Stripe webhook retry storm caused by...",
    "metadata": {
      "pipeline_id": "billing-degradation",
      "confidence": 0.92,
      "sources": ["datadog", "github", "launchdarkly"],
      "severity": "HIGH"
    },
    "created_at": "..."
  }
}
```

**Notes**: For streaming responses, use `GET /api/v1/chat/sessions/{id}/pipeline` SSE endpoint instead.

---

### GET /api/v1/chat/sessions/{session_id}/pipeline
SSE stream of live agent pipeline execution for a session's latest query.

**Auth**: Required
**Response**: `text/event-stream`

**Event format**:
```
event: intent
data: {"type":"Performance Degradation","service":"billing-service","confidence":0.94}

event: agent_start
data: {"agent_id":"sentinel","name":"Sentinel","mission":"Find ERROR patterns in billing-service","data_source":"Datadog APM"}

event: agent_finding
data: {"agent_id":"sentinel","finding":{"label":"Error Rate","value":"8.4%","status":"critical","delta":"+4,100%"}}

event: agent_complete
data: {"agent_id":"sentinel","insight":"Error spike isolates to Stripe webhook handler","duration_ms":2200}

event: agent_start
data: {"agent_id":"arbiter","name":"Arbiter","mission":"Correlate deploys & feature flags"}

event: synthesis
data: {"headline":"Stripe Webhook Retry Storm — Caused by bill-87","severity":"HIGH","confidence":0.92,"root_cause":"...","actions":[...]}

event: done
data: {"pipeline_id":"uuid","total_duration_ms":6100}
```

---

## Integrations Domain

### GET /api/v1/integrations
List all integrations for org.

**Auth**: Required
**Query params**: `org_id=`, `status=active`, `type=`

**Pydantic models**:
```python
class IntegrationResponse(BaseModel):
    id: UUID
    org_id: UUID
    type: str
    name: str
    status: Literal["active", "inactive", "error"]
    last_sync_at: datetime | None
    events_today: int
    data_sources: dict | None
    created_at: datetime
```

---

### POST /api/v1/integrations
Connect a new integration.

**Auth**: Required

**Pydantic models**:
```python
class IntegrationCreate(BaseModel):
    org_id: UUID
    type: str
    name: str
    config: dict = Field(default_factory=dict)  # API keys, URLs — encrypted at rest
```

**Request body**:
```json
{
  "org_id": "uuid",
  "type": "datadog",
  "name": "Datadog Production",
  "config": {
    "api_key": "dd_api_...",
    "app_key": "dd_app_...",
    "site": "datadoghq.com"
  }
}
```

**Response 201**: `IntegrationResponse` (config field redacted/masked)

---

### POST /api/v1/integrations/{integration_id}/test
Test integration connection and return status.

**Auth**: Required

**Response 200**:
```json
{
  "integration_id": "uuid",
  "success": true,
  "message": "Connected to Datadog. 3 services found.",
  "latency_ms": 245
}
```

---

### GET /api/v1/integrations/catalog
Get static catalog of all available integration types.

**Auth**: Required

**Response 200**:
```json
{
  "categories": [
    {
      "id": "monitoring",
      "label": "Monitoring",
      "color": "#3b82f6",
      "items": [
        {
          "id": "datadog",
          "name": "Datadog",
          "description": "APM, metrics, logs, and distributed tracing",
          "logo": "🐶",
          "config_fields": ["api_key", "app_key", "site"],
          "ds_fields": {
            "Service Name": "my-service",
            "Environment": "production",
            "APM Service": "checkout-api"
          }
        }
      ]
    }
  ]
}
```

---

## Knowledge Domain

### GET /api/v1/knowledge
List knowledge documents with optional scope filters.

**Auth**: Required
**Query params**: `org_id=`, `domain_id=`, `project_id=`, `type=runbook`, `search=`, `page=1`, `page_size=20`

**Pydantic models**:
```python
class KnowledgeDocResponse(BaseModel):
    id: UUID
    org_id: UUID
    domain_id: UUID | None
    project_id: UUID | None
    name: str
    title: str
    type: Literal["runbook", "architecture", "postmortem", "sop", "known-issue", "playbook", "documentation"]
    summary: str
    size: int | None
    status: Literal["active", "processing", "failed"]
    url: str | None
    author: str
    created_at: datetime
    updated_at: datetime
```

---

### POST /api/v1/knowledge
Create a knowledge document (link or metadata only; use /upload for file).

**Auth**: Required

**Pydantic models**:
```python
class KnowledgeDocCreate(BaseModel):
    org_id: UUID
    domain_id: UUID | None = None
    project_id: UUID | None = None
    title: str
    type: Literal["runbook", "architecture", "postmortem", "sop", "known-issue", "playbook", "documentation"]
    summary: str = ""
    url: str | None = None
    author: str = ""
```

**Response 201**: `KnowledgeDocResponse`

---

### POST /api/v1/knowledge/upload
Upload a knowledge document file.

**Auth**: Required
**Content-Type**: `multipart/form-data`

**Form fields**:
- `file`: binary
- `org_id`: UUID
- `domain_id`: UUID (optional)
- `project_id`: UUID (optional)
- `type`: string
- `title`: string
- `summary`: string

**Response 201**: `KnowledgeDocResponse` with `url` pointing to stored file.

---

### GET /api/v1/knowledge/search
Semantic or full-text search across knowledge docs.

**Auth**: Required
**Query params**: `q=incident+runbook`, `org_id=`, `scope=org|domain|project`, `scope_id=`

**Response 200**:
```json
{
  "query": "incident runbook",
  "results": [
    {
      "doc_id": "uuid",
      "title": "Global Incident Response Playbook",
      "type": "playbook",
      "summary": "...",
      "score": 0.92,
      "url": "..."
    }
  ],
  "total": 3
}
```

---

## Dashboard Domain

### GET /api/v1/dashboard/summary
KPI card data for the overview page.

**Auth**: Required
**Query params**: `org_id=`

**Pydantic models**:
```python
class DashboardSummary(BaseModel):
    active_investigations: int
    mttr_minutes: float | None
    mttd_minutes: float | None
    health_pct: float
    health_degraded: int
    health_critical: int
    total_agents: int
    active_agents: int
```

**Response 200**:
```json
{
  "active_investigations": 7,
  "mttr_minutes": 43.2,
  "mttd_minutes": 8.5,
  "health_pct": 87.5,
  "health_degraded": 2,
  "health_critical": 1,
  "total_agents": 6,
  "active_agents": 3
}
```

---

### GET /api/v1/dashboard/investigations-trend
Time-series investigation counts grouped by day (last 30 days).

**Auth**: Required
**Query params**: `org_id=`, `days=30`

**Response 200**:
```json
{
  "items": [
    { "date": "2025-01-01", "label": "Jan 1", "count": 3 },
    { "date": "2025-01-02", "label": "Jan 2", "count": 1 }
  ]
}
```

---

### GET /api/v1/dashboard/incidents-by-service
Incident count per service.

**Auth**: Required
**Query params**: `org_id=`, `days=30`

**Response 200**:
```json
{
  "items": [
    { "service": "checkout-service", "count": 4 },
    { "service": "payment-gateway", "count": 2 }
  ]
}
```

---

### GET /api/v1/dashboard/activity-stream
Recent platform activity (deploys, alerts, resolutions, agent actions).

**Auth**: Required
**Query params**: `org_id=`, `limit=20`, `after=` (ISO timestamp for polling)

**Response 200**:
```json
{
  "items": [
    { "id": "uuid", "time": "2025-01-01T10:00:00Z", "label": "Sentinel resolved checkout investigation", "kind": "agent" },
    { "id": "uuid", "time": "2025-01-01T09:45:00Z", "label": "Deploy: checkout-service v2.14.4", "kind": "deploy" },
    { "id": "uuid", "time": "2025-01-01T09:30:00Z", "label": "P1 alert: payment-gateway timeout spike", "kind": "alert" }
  ]
}
```

---

## Audit Domain

### GET /api/v1/audit
Paginated audit log with filters.

**Auth**: Required (admin role recommended)
**Query params**: `org_id=`, `actor_type=user|agent|system`, `resource_type=investigation`, `from=2025-01-01`, `to=2025-12-31`, `page=1`, `page_size=50`

**Pydantic models**:
```python
class AuditLogResponse(BaseModel):
    id: UUID
    org_id: UUID | None
    actor_type: Literal["user", "agent", "system"]
    actor_name: str
    action: str
    resource_type: str
    resource_name: str
    ip_address: str | None
    metadata: dict
    created_at: datetime

class AuditLogListResponse(BaseModel):
    items: list[AuditLogResponse]
    total: int
    page: int
    page_size: int
```

---

## Notifications Domain

### GET /api/v1/notifications/integrations
List team notification integrations (Slack, Teams).

**Auth**: Required

**Response 200**:
```json
{
  "items": [
    {
      "id": "uuid",
      "type": "slack",
      "status": "active",
      "config": { "workspace_name": "Acme Corp", "default_channel": "#incidents" },
      "created_at": "..."
    }
  ]
}
```

---

### POST /api/v1/notifications/integrations/{id}/test
Send a test notification.

**Auth**: Required

**Request body**: `{ "channel": "#test-channel", "message": "Operon test notification" }`
**Response 200**: `{ "success": true, "message": "Test notification sent to #test-channel" }`

---

## Common Pydantic Patterns

### Pagination
```python
class PaginationParams:
    page: int = Query(1, ge=1)
    page_size: int = Query(20, ge=1, le=100)

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
```

### Error Responses
```python
class ErrorResponse(BaseModel):
    detail: str
    code: str | None = None
    field: str | None = None

# 400 Bad Request
{ "detail": "Validation error", "field": "severity" }

# 401 Unauthorized
{ "detail": "Not authenticated" }

# 403 Forbidden
{ "detail": "Insufficient permissions" }

# 404 Not Found
{ "detail": "Investigation not found" }

# 422 Unprocessable Entity
{ "detail": [{"loc": ["body", "email"], "msg": "value is not a valid email", "type": "value_error.email"}] }
```

### Auth Dependency
```python
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> UserProfile:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await user_repo.get_by_user_id(db, UUID(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_role(*roles: str):
    async def checker(current_user: UserProfile = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return checker
```
