# FastAPI Router Structure — Operon SRE Platform

This document defines the recommended router, schema, service, and repository organization for the Operon FastAPI backend. Every recommendation is grounded in the actual frontend capabilities and data models.

---

## Top-Level Project Layout

```
operon-api/
├── app/
│   ├── main.py                     # FastAPI app factory, lifespan, middleware
│   ├── api/
│   │   └── v1/
│   │       ├── router.py           # Aggregates all domain routers
│   │       └── endpoints/
│   │           ├── auth.py
│   │           ├── users.py
│   │           ├── orgs.py
│   │           ├── domains.py
│   │           ├── projects.py
│   │           ├── investigations.py
│   │           ├── investigation_events.py
│   │           ├── investigation_actions.py
│   │           ├── agents.py
│   │           ├── agent_logs.py
│   │           ├── chat.py
│   │           ├── integrations.py
│   │           ├── knowledge.py
│   │           ├── dashboard.py
│   │           ├── audit.py
│   │           ├── alerts.py
│   │           ├── event_sources.py
│   │           └── notifications.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── org.py
│   │   ├── domain.py
│   │   ├── project.py
│   │   ├── investigation.py
│   │   ├── agent.py
│   │   ├── chat.py
│   │   ├── integration.py
│   │   ├── knowledge.py
│   │   ├── dashboard.py
│   │   ├── audit.py
│   │   ├── alert.py
│   │   └── common.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── org_service.py
│   │   ├── domain_service.py
│   │   ├── project_service.py
│   │   ├── investigation_service.py
│   │   ├── agent_service.py
│   │   ├── chat_service.py
│   │   ├── pipeline_service.py
│   │   ├── integration_service.py
│   │   ├── knowledge_service.py
│   │   ├── dashboard_service.py
│   │   ├── audit_service.py
│   │   ├── notification_service.py
│   │   └── storage_service.py
│   ├── repositories/
│   │   ├── base.py
│   │   ├── user_repository.py
│   │   ├── org_repository.py
│   │   ├── domain_repository.py
│   │   ├── project_repository.py
│   │   ├── investigation_repository.py
│   │   ├── agent_repository.py
│   │   ├── chat_repository.py
│   │   ├── integration_repository.py
│   │   ├── knowledge_repository.py
│   │   ├── audit_repository.py
│   │   └── event_repository.py
│   ├── models/
│   │   ├── base.py
│   │   ├── user.py
│   │   ├── org.py
│   │   ├── domain.py
│   │   ├── project.py
│   │   ├── investigation.py
│   │   ├── agent.py
│   │   ├── chat.py
│   │   ├── integration.py
│   │   ├── knowledge.py
│   │   ├── audit.py
│   │   └── event.py
│   ├── core/
│   │   ├── config.py               # Settings via pydantic-settings
│   │   ├── security.py             # JWT encode/decode, password hashing
│   │   ├── database.py             # SQLAlchemy async engine + session
│   │   └── exceptions.py           # Custom HTTP exceptions
│   ├── dependencies/
│   │   ├── auth.py                 # get_current_user, require_role
│   │   ├── pagination.py           # PaginationParams
│   │   └── db.py                   # get_db async session
│   └── integrations/
│       ├── datadog.py
│       ├── splunk.py
│       ├── pagerduty.py
│       ├── slack.py
│       ├── teams.py
│       ├── github.py
│       ├── launchdarkly.py
│       └── cloudwatch.py
├── alembic/
│   ├── env.py
│   ├── versions/
│   └── alembic.ini
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_investigations.py
│   ├── test_chat.py
│   └── ...
├── .env
├── pyproject.toml
└── README.md
```

---

## main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.v1.router import api_router
from app.core.database import engine
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    yield
    # shutdown


def create_app() -> FastAPI:
    app = FastAPI(
        title="Operon API",
        version="1.0.0",
        description="AI-powered SRE platform backend",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/api/v1")
    return app


app = create_app()
```

---

## api/v1/router.py

```python
from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, users, orgs, domains, projects,
    investigations, investigation_events, investigation_actions,
    agents, agent_logs, chat, integrations, knowledge,
    dashboard, audit, alerts, event_sources, notifications,
)

api_router = APIRouter()

api_router.include_router(auth.router,                      prefix="/auth",               tags=["auth"])
api_router.include_router(users.router,                     prefix="/users",              tags=["users"])
api_router.include_router(orgs.router,                      prefix="/orgs",               tags=["orgs"])
api_router.include_router(domains.router,                   prefix="",                    tags=["domains"])
api_router.include_router(projects.router,                  prefix="/projects",           tags=["projects"])
api_router.include_router(investigations.router,             prefix="/investigations",     tags=["investigations"])
api_router.include_router(investigation_events.router,       prefix="/investigations",     tags=["investigation-events"])
api_router.include_router(investigation_actions.router,      prefix="/investigations",     tags=["investigation-actions"])
api_router.include_router(agents.router,                    prefix="/agents",             tags=["agents"])
api_router.include_router(agent_logs.router,                prefix="/agents",             tags=["agent-logs"])
api_router.include_router(chat.router,                      prefix="/chat",               tags=["chat"])
api_router.include_router(integrations.router,              prefix="/integrations",       tags=["integrations"])
api_router.include_router(knowledge.router,                 prefix="/knowledge",          tags=["knowledge"])
api_router.include_router(dashboard.router,                 prefix="/dashboard",          tags=["dashboard"])
api_router.include_router(audit.router,                     prefix="/audit",              tags=["audit"])
api_router.include_router(alerts.router,                    prefix="/alerts",             tags=["alerts"])
api_router.include_router(event_sources.router,             prefix="",                    tags=["event-sources"])
api_router.include_router(notifications.router,             prefix="/notifications",      tags=["notifications"])
```

---

## Domain-by-Domain Router Details

---

### Auth — `api/v1/endpoints/auth.py`

**Responsibilities**: Register, login, logout, token refresh, session check.

```python
router = APIRouter()

@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(body: RegisterRequest, service: AuthService = Depends(get_auth_service)):
    return await service.register(body)

@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, service: AuthService = Depends(get_auth_service)):
    return await service.login(body)

@router.get("/me", response_model=AuthResponse)
async def me(current_user: UserProfile = Depends(get_current_user)):
    return current_user

@router.post("/logout", status_code=204)
async def logout(body: LogoutRequest, service: AuthService = Depends(get_auth_service)):
    await service.logout(body.refresh_token)

@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, service: AuthService = Depends(get_auth_service)):
    return await service.refresh(body.refresh_token)
```

**Service responsibilities** (`auth_service.py`):
- Hash passwords with bcrypt
- Generate JWT access tokens (15min expiry) and refresh tokens (7d expiry)
- Store refresh token hash in DB for revocation
- On register: create user record + user_profile row + optional seed demo data
- On login: verify password, issue tokens
- On refresh: validate refresh token, issue new access token

---

### Users — `api/v1/endpoints/users.py`

**Responsibilities**: Profile CRUD, API key management.

```python
router = APIRouter()

@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(current_user = Depends(get_current_user)):
    ...

@router.patch("/me", response_model=UserProfileResponse)
async def update_my_profile(body: UserProfileUpdate, current_user = Depends(get_current_user), service = Depends(get_user_service)):
    return await service.update_profile(current_user.id, body)

@router.get("/me/api-keys", response_model=ApiKeyListResponse)
async def list_api_keys(current_user = Depends(get_current_user), service = Depends(get_user_service)):
    return await service.list_api_keys(current_user.user_id)

@router.post("/me/api-keys", response_model=ApiKeyCreatedResponse, status_code=201)
async def create_api_key(body: ApiKeyCreate, current_user = Depends(get_current_user), service = Depends(get_user_service)):
    return await service.create_api_key(current_user.user_id, body.name)

@router.delete("/me/api-keys/{key_id}", status_code=204)
async def revoke_api_key(key_id: UUID, current_user = Depends(get_current_user), service = Depends(get_user_service)):
    await service.revoke_api_key(current_user.user_id, key_id)
```

**Service responsibilities** (`user_service.py`):
- CRUD on user_profiles table
- API key: generate random 32-byte token, store prefix + bcrypt hash, return full key once
- Validate key ownership before revoke

---

### Orgs — `api/v1/endpoints/orgs.py`

**Responsibilities**: CRUD orgs, manage members. This is the most critical migration (currently 100% local state).

```python
router = APIRouter()

@router.get("", response_model=OrgListResponse)
async def list_orgs(pagination: PaginationParams = Depends(), search: str | None = None, current_user = Depends(get_current_user), service = Depends(get_org_service)):
    return await service.list_for_user(current_user.user_id, pagination, search)

@router.post("", response_model=OrgResponse, status_code=201)
async def create_org(body: OrgCreate, current_user = Depends(get_current_user), service = Depends(get_org_service)):
    return await service.create(current_user.user_id, body)

@router.get("/{org_id}", response_model=OrgDetailResponse)
async def get_org(org_id: UUID, current_user = Depends(get_current_user), service = Depends(get_org_service)):
    return await service.get_detail(org_id, current_user.user_id)

@router.patch("/{org_id}", response_model=OrgResponse)
async def update_org(org_id: UUID, body: OrgUpdate, current_user = Depends(require_role("admin")), service = Depends(get_org_service)):
    return await service.update(org_id, body)

@router.delete("/{org_id}", status_code=204)
async def delete_org(org_id: UUID, current_user = Depends(require_role("admin")), service = Depends(get_org_service)):
    await service.delete(org_id)

@router.get("/{org_id}/members", response_model=OrgMemberListResponse)
async def list_members(org_id: UUID, current_user = Depends(get_current_user), service = Depends(get_org_service)):
    return await service.list_members(org_id)

@router.post("/{org_id}/members", response_model=OrgMemberResponse, status_code=201)
async def add_member(org_id: UUID, body: AddMemberRequest, current_user = Depends(require_role("admin")), service = Depends(get_org_service)):
    return await service.add_member(org_id, body)

@router.patch("/{org_id}/members/{user_id}", response_model=OrgMemberResponse)
async def update_member_role(org_id: UUID, user_id: UUID, body: UpdateMemberRoleRequest, current_user = Depends(require_role("admin")), service = Depends(get_org_service)):
    return await service.update_member_role(org_id, user_id, body.role)

@router.delete("/{org_id}/members/{user_id}", status_code=204)
async def remove_member(org_id: UUID, user_id: UUID, current_user = Depends(require_role("admin")), service = Depends(get_org_service)):
    await service.remove_member(org_id, user_id)

# Nested: domains under org
@router.get("/{org_id}/domains", response_model=DomainListResponse)
async def list_domains_for_org(...):
    ...

@router.post("/{org_id}/domains", response_model=DomainResponse, status_code=201)
async def create_domain(...):
    ...
```

---

### Investigations — `api/v1/endpoints/investigations.py`

**Responsibilities**: CRUD + action endpoints (resolve, escalate). This is the core product domain.

```python
router = APIRouter()

@router.get("", response_model=InvestigationListResponse)
async def list_investigations(
    project_id: UUID | None = None,
    status: list[str] = Query(None),
    severity: list[str] = Query(None),
    service: str | None = None,
    search: str | None = None,
    order: str = "created_at:desc",
    pagination: PaginationParams = Depends(),
    current_user = Depends(get_current_user),
    service_: InvestigationService = Depends(get_investigation_service),
):
    return await service_.list(project_id, status, severity, service, search, order, pagination)

@router.post("", response_model=InvestigationResponse, status_code=201)
async def create_investigation(body: InvestigationCreate, current_user = Depends(get_current_user), service = Depends(get_investigation_service)):
    result = await service.create(body, created_by=current_user)
    return result  # Service also writes audit_log entry

@router.get("/{investigation_id}", response_model=InvestigationResponse)
async def get_investigation(investigation_id: UUID, current_user = Depends(get_current_user), service = Depends(get_investigation_service)):
    return await service.get(investigation_id)

@router.patch("/{investigation_id}", response_model=InvestigationResponse)
async def update_investigation(investigation_id: UUID, body: InvestigationUpdate, current_user = Depends(get_current_user), service = Depends(get_investigation_service)):
    return await service.update(investigation_id, body)

@router.post("/{investigation_id}/resolve", response_model=InvestigationResponse)
async def resolve_investigation(investigation_id: UUID, body: ResolveInvestigationRequest, current_user = Depends(get_current_user), service = Depends(get_investigation_service)):
    # Service computes duration_minutes, sets resolved_at, fires notifications, writes audit log
    return await service.resolve(investigation_id, body, resolved_by=current_user)

@router.post("/{investigation_id}/escalate", response_model=InvestigationResponse)
async def escalate_investigation(investigation_id: UUID, current_user = Depends(get_current_user), service = Depends(get_investigation_service)):
    return await service.escalate(investigation_id, escalated_by=current_user)

@router.get("/{investigation_id}/timeline")
async def get_timeline(investigation_id: UUID, current_user = Depends(get_current_user), service = Depends(get_investigation_service)):
    return await service.get_timeline(investigation_id)
```

**Service responsibilities** (`investigation_service.py`):
- Filter/paginate investigations
- On create: validate project_id, set status='open', write audit_log
- On resolve: compute duration_minutes = (now - created_at).seconds // 60; set resolved_at; write audit_log; call notification_service to fire alerts
- Timeline: merge investigation_events sorted by timestamp; annotate with correlation_score

---

### Chat — `api/v1/endpoints/chat.py`

**Responsibilities**: Session CRUD, message history, AI response, SSE pipeline stream.

```python
router = APIRouter()

@router.get("/sessions", response_model=ChatSessionListResponse)
async def list_sessions(pagination = Depends(), current_user = Depends(get_current_user), service = Depends(get_chat_service)):
    return await service.list_sessions(current_user.user_id, pagination)

@router.post("/sessions", response_model=ChatSessionResponse, status_code=201)
async def create_session(body: ChatSessionCreate, current_user = Depends(get_current_user), service = Depends(get_chat_service)):
    return await service.create_session(current_user.user_id, body)

@router.patch("/sessions/{session_id}", response_model=ChatSessionResponse)
async def update_session(session_id: UUID, body: ChatSessionUpdate, current_user = Depends(get_current_user), service = Depends(get_chat_service)):
    return await service.update_session(session_id, body)

@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(session_id: UUID, current_user = Depends(get_current_user), service = Depends(get_chat_service)):
    await service.delete_session(session_id)  # Cascades messages

@router.get("/sessions/{session_id}/messages", response_model=ChatMessagesResponse)
async def list_messages(session_id: UUID, current_user = Depends(get_current_user), service = Depends(get_chat_service)):
    return await service.list_messages(session_id)

@router.post("/sessions/{session_id}/messages", response_model=ChatMessagePairResponse, status_code=201)
async def send_message(session_id: UUID, body: ChatMessageCreate, current_user = Depends(get_current_user), service = Depends(get_chat_service)):
    # 1. Insert user message
    # 2. Run pipeline_service.match_and_run(body.content)
    # 3. Insert assistant message with pipeline result
    # 4. Update session updated_at
    # 5. Return both messages
    return await service.send_message(session_id, body, current_user)

@router.get("/sessions/{session_id}/pipeline")
async def stream_pipeline(session_id: UUID, current_user = Depends(get_current_user), service = Depends(get_chat_service)):
    # Returns SSE EventSourceResponse
    return EventSourceResponse(service.stream_pipeline(session_id, current_user))
```

**Service responsibilities** (`chat_service.py`):
- Session CRUD with proper ownership validation (user_id check)
- Delete session cascades to chat_messages
- `send_message`: calls `pipeline_service.run(content)`, persists both messages
- `stream_pipeline`: async generator yielding SSE events as agents execute

**Service responsibilities** (`pipeline_service.py`):
- Intent detection: classify user query into investigation scenario
- Agent orchestration: run agents in sequence/parallel, collect findings
- Synthesis: produce root cause + confidence + actions
- Emit SSE events: intent, agent_start, agent_finding, agent_complete, synthesis, done
- This is where LLM integration lives (OpenAI/Anthropic tool calling)

---

### Agents — `api/v1/endpoints/agents.py` + `agent_logs.py`

```python
# agents.py
@router.get("", response_model=AgentListResponse)
@router.post("", response_model=AgentResponse, status_code=201)
@router.get("/status", response_model=list[AgentStatusItem])   # Summary for dashboard
@router.get("/{agent_id}", response_model=AgentResponse)
@router.patch("/{agent_id}", response_model=AgentResponse)
@router.delete("/{agent_id}", status_code=204)

# agent_logs.py
@router.get("/{agent_id}/logs", response_model=AgentLogListResponse)
@router.get("/{agent_id}/logs/stream")   # SSE stream
```

**Service responsibilities** (`agent_service.py`):
- List/filter agents by org_id, status, type
- Agent logs: paginate from agent_logs table
- SSE log stream: tail agent_logs table, emit new rows as SSE events (poll DB every 1s or use Postgres LISTEN/NOTIFY)

---

### Dashboard — `api/v1/endpoints/dashboard.py`

```python
@router.get("/summary", response_model=DashboardSummary)
@router.get("/investigations-trend", response_model=InvestigationsTrend)
@router.get("/incidents-by-service", response_model=IncidentsByService)
@router.get("/service-health", response_model=ServiceHealthMap)
@router.get("/slo-risk", response_model=SloRiskPanel)
@router.get("/activity-stream", response_model=ActivityStream)
@router.get("/agent-activity", response_model=list[AgentStatusItem])
```

**Service responsibilities** (`dashboard_service.py`):
- All queries are read-only aggregations over investigations, agents, event_log tables
- `summary`: COUNT investigations WHERE status IN ('open','investigating'); AVG duration_minutes WHERE status='resolved'; health % = (total - critical - degraded) / total * 100
- `investigations_trend`: GROUP BY DATE(created_at) for last N days
- `incidents_by_service`: GROUP BY service for last N days
- `activity_stream`: UNION of recent investigation status changes, agent completions, deploys from event_log — ordered by created_at desc

---

## Schemas by Domain

### `schemas/common.py`
```python
from pydantic import BaseModel
from typing import Generic, TypeVar

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int

class ErrorResponse(BaseModel):
    detail: str
    code: str | None = None
    field: str | None = None
```

### `schemas/auth.py`
```python
RegisterRequest, LoginRequest, AuthResponse, TokenResponse,
RefreshRequest, LogoutRequest
```

### `schemas/user.py`
```python
UserProfileResponse, UserProfileUpdate,
ApiKeyResponse, ApiKeyCreate, ApiKeyCreatedResponse, ApiKeyListResponse
```

### `schemas/org.py`
```python
OrgCreate, OrgUpdate, OrgResponse, OrgDetailResponse, OrgListResponse,
OrgMemberResponse, AddMemberRequest, UpdateMemberRoleRequest, OrgMemberListResponse
```

### `schemas/domain.py`
```python
DomainCreate, DomainUpdate, DomainResponse, DomainListResponse
```

### `schemas/project.py`
```python
ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListItem, ProjectListResponse,
ProjectDataSource, ProjectDataSourceUpdate, ProjectComponent, ProjectComponentCreate,
ProjectNotificationConfig
```

### `schemas/investigation.py`
```python
InvestigationCreate, InvestigationUpdate, InvestigationResponse,
InvestigationListItem, InvestigationListResponse,
ResolveInvestigationRequest, EscalateRequest,
InvestigationEventCreate, InvestigationEventResponse, InvestigationEventsResponse,
InvestigationActionCreate, InvestigationActionUpdate, InvestigationActionResponse,
TimelineResponse, TimelineEvent
```

### `schemas/agent.py`
```python
AgentCreate, AgentUpdate, AgentResponse, AgentListResponse, AgentStatusItem,
AgentLogResponse, AgentLogListResponse
```

### `schemas/chat.py`
```python
ChatSessionCreate, ChatSessionUpdate, ChatSessionResponse,
ChatSessionListItem, ChatSessionListResponse,
ChatMessageCreate, ChatMessageResponse, ChatMessagesResponse,
ChatMessagePairResponse
```

### `schemas/integration.py`
```python
IntegrationCreate, IntegrationUpdate, IntegrationResponse, IntegrationListResponse,
IntegrationTestResponse, IntegrationCatalogItem, IntegrationCatalogCategory,
IntegrationCatalogResponse
```

### `schemas/knowledge.py`
```python
KnowledgeDocCreate, KnowledgeDocUpdate, KnowledgeDocResponse,
KnowledgeDocListResponse, KnowledgeSearchResult, KnowledgeSearchResponse
```

### `schemas/dashboard.py`
```python
DashboardSummary, DayBucket, InvestigationsTrend, ServiceBucket,
IncidentsByService, ServiceHealthItem, ServiceHealthMap,
SloRiskItem, SloRiskPanel, ActivityStreamItem, ActivityStream, AgentStatusItem
```

### `schemas/audit.py`
```python
AuditLogResponse, AuditLogListResponse
```

---

## Dependencies

### `dependencies/auth.py`
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings
from app.repositories.user_repository import UserRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
    repo: UserRepository = Depends(get_user_repo),
):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await repo.get_profile_by_user_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_role(*roles: str):
    async def checker(current_user = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return checker
```

### `dependencies/pagination.py`
```python
from fastapi import Query
from dataclasses import dataclass

@dataclass
class PaginationParams:
    page: int = Query(1, ge=1, description="Page number")
    page_size: int = Query(20, ge=1, le=100, description="Items per page")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size
```

---

## Repository Pattern

### `repositories/base.py`
```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Generic, TypeVar, Type
from uuid import UUID

ModelT = TypeVar("ModelT")

class BaseRepository(Generic[ModelT]):
    def __init__(self, model: Type[ModelT]):
        self.model = model

    async def get(self, db: AsyncSession, id: UUID) -> ModelT | None:
        result = await db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def list(self, db: AsyncSession, offset: int = 0, limit: int = 20) -> tuple[list[ModelT], int]:
        count_q = await db.execute(select(func.count()).select_from(self.model))
        total = count_q.scalar()
        result = await db.execute(select(self.model).offset(offset).limit(limit))
        return result.scalars().all(), total

    async def create(self, db: AsyncSession, obj: ModelT) -> ModelT:
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
        return obj

    async def update(self, db: AsyncSession, obj: ModelT) -> ModelT:
        await db.commit()
        await db.refresh(obj)
        return obj

    async def delete(self, db: AsyncSession, obj: ModelT) -> None:
        await db.delete(obj)
        await db.commit()
```

### Example: `repositories/investigation_repository.py`
```python
from sqlalchemy import select, func, and_
from app.repositories.base import BaseRepository
from app.models.investigation import Investigation

class InvestigationRepository(BaseRepository[Investigation]):
    def __init__(self):
        super().__init__(Investigation)

    async def list_filtered(
        self, db: AsyncSession,
        project_id: UUID | None = None,
        statuses: list[str] | None = None,
        severities: list[str] | None = None,
        service: str | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[Investigation], int]:
        conditions = []
        if project_id:
            conditions.append(Investigation.project_id == project_id)
        if statuses:
            conditions.append(Investigation.status.in_(statuses))
        if severities:
            conditions.append(Investigation.severity.in_(severities))
        if service:
            conditions.append(Investigation.service == service)

        where = and_(*conditions) if conditions else True

        count_q = await db.execute(select(func.count()).select_from(Investigation).where(where))
        total = count_q.scalar()

        result = await db.execute(
            select(Investigation).where(where)
            .order_by(Investigation.created_at.desc())
            .offset(offset).limit(limit)
        )
        return result.scalars().all(), total
```

---

## Integrations Layer

### `integrations/slack.py`
```python
import httpx

class SlackIntegration:
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url

    async def send_message(self, channel: str, text: str, blocks: list | None = None) -> bool:
        async with httpx.AsyncClient() as client:
            payload = {"channel": channel, "text": text}
            if blocks:
                payload["blocks"] = blocks
            resp = await client.post(self.webhook_url, json=payload)
            return resp.status_code == 200

    async def test_connection(self, channel: str) -> dict:
        success = await self.send_message(channel, "Operon test notification")
        return {"success": success, "channel": channel}
```

### `integrations/datadog.py`
```python
class DatadogIntegration:
    def __init__(self, api_key: str, app_key: str, site: str = "datadoghq.com"):
        self.base_url = f"https://api.{site}"
        self.headers = {"DD-API-KEY": api_key, "DD-APPLICATION-KEY": app_key}

    async def get_metrics(self, query: str, from_ts: int, to_ts: int) -> dict:
        ...

    async def test_connection(self) -> dict:
        ...
```

---

## Core Config

### `core/config.py`
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App
    app_name: str = "Operon API"
    debug: bool = False
    allowed_origins: list[str] = ["http://localhost:5173"]

    # Database
    database_url: str  # postgresql+asyncpg://...

    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # Storage
    storage_bucket: str = "operon-knowledge"
    storage_endpoint: str | None = None  # S3/R2 endpoint

    # Optional: LLM for pipeline
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## SSE Pattern for Streaming

Used by: chat pipeline, agent logs.

```python
from sse_starlette.sse import EventSourceResponse
import asyncio

@router.get("/sessions/{session_id}/pipeline")
async def stream_pipeline(session_id: UUID, current_user = Depends(get_current_user)):
    async def event_generator():
        async for event in pipeline_service.run_and_stream(session_id):
            yield {"event": event["type"], "data": json.dumps(event["data"])}
        yield {"event": "done", "data": "{}"}

    return EventSourceResponse(event_generator())
```

Frontend consumes with:
```typescript
const source = new EventSource(`${API_BASE}/chat/sessions/${id}/pipeline`, {
  headers: { Authorization: `Bearer ${token}` }
})
source.addEventListener('agent_start', (e) => { ... })
source.addEventListener('synthesis', (e) => { ... })
source.addEventListener('done', () => source.close())
```

---

## Migration Adapter for Supabase JWT

During phased migration, existing Supabase JWTs can be verified in FastAPI:

```python
# core/security.py
from jose import jwt

def verify_supabase_token(token: str, supabase_jwt_secret: str) -> dict:
    """Validates a Supabase-issued JWT during migration period."""
    return jwt.decode(
        token,
        supabase_jwt_secret,
        algorithms=["HS256"],
        options={"verify_aud": False}
    )

async def get_current_user_compat(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Accepts both Supabase JWTs and native FastAPI JWTs."""
    try:
        # Try native JWT first
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = payload.get("sub")
    except JWTError:
        try:
            # Fall back to Supabase JWT
            payload = verify_supabase_token(token, settings.supabase_jwt_secret)
            user_id = payload.get("sub")
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")

    user = await user_repo.get_profile_by_user_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
```

Remove the Supabase fallback once auth migration is complete.

---

## Audit Log Integration Pattern

Rather than manually calling `audit_service` in every endpoint, use a FastAPI middleware or service layer decorator:

```python
# services/audit_service.py
class AuditService:
    async def log(
        self, db: AsyncSession,
        actor_type: str, actor_name: str,
        action: str, resource_type: str, resource_name: str,
        org_id: UUID | None = None, metadata: dict = {},
        ip_address: str | None = None,
    ) -> None:
        entry = AuditLog(
            org_id=org_id, actor_type=actor_type, actor_name=actor_name,
            action=action, resource_type=resource_type, resource_name=resource_name,
            ip_address=ip_address, metadata=metadata,
        )
        db.add(entry)
        await db.commit()
```

Called explicitly in service methods where audit trail is required:
- `investigation_service.create()` → `audit.log(..., action='created', resource_type='investigation')`
- `investigation_service.resolve()` → `audit.log(..., action='resolved', ...)`
- `project_service.delete()` → `audit.log(..., action='deleted', resource_type='project')`
