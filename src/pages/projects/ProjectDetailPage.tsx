import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjects } from './ProjectsContext'
import { PageBreadcrumb } from './components/PageBreadcrumb'
import { OverviewTab } from './components/tabs/OverviewTab'
import { ProvidersTab } from './components/tabs/ProvidersTab'
import { AgentsTab } from './components/tabs/AgentsTab'
import { KnowledgeTab } from './components/tabs/KnowledgeTab'
import { AlertsTab } from './components/tabs/AlertsTab'
import { ConfirmModal } from './components/ConfirmModal'
import { Slab } from './components/Slab'
import { INT_CATEGORIES, ENV_STYLE, MOCK_MEMBERS } from './mockData'
import type { Project } from './types'

const TABS = [
  { id: 'overview',      label: 'Overview',   icon: '📊' },
  { id: 'providers',     label: 'Providers',  icon: '🔌' },
  { id: 'knowledge',     label: 'Knowledge',  icon: '📚' },
  { id: 'agents',        label: 'Agents',     icon: '🤖' },
  { id: 'notifications', label: 'Alerts',     icon: '🔔' },
  { id: 'members',       label: 'Members',    icon: '👥' },
  { id: 'settings',      label: 'Settings',   icon: '⚙️' },
] as const

type TabId = typeof TABS[number]['id']

const ENVS = ['production', 'staging', 'development', 'canary']

function ProjectSettingsTab({ project, onSave, onDelete }: { project: Project; onSave: (p: Project) => void; onDelete: () => void }) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description)
  const [environment, setEnvironment] = useState(project.environment)
  const [serviceUrl, setServiceUrl] = useState(project.serviceUrl ?? '')
  const [repoUrl, setRepoUrl] = useState(project.repoUrl ?? '')
  const [sloTarget, setSloTarget] = useState(project.sloTarget ?? '')
  const [confirmDel, setConfirmDel] = useState(false)
  const changed = name !== project.name || description !== project.description || environment !== project.environment || serviceUrl !== (project.serviceUrl ?? '') || repoUrl !== (project.repoUrl ?? '') || sloTarget !== (project.sloTarget ?? '')
  const field = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box' as const }
  const lbl = { fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 as const, display: 'block' as const, marginBottom: '0.25rem' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Slab title="Project Settings" subtitle="Update this project's configuration">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><label style={lbl}>Project Name</label><input style={field} value={name} onChange={e => setName(e.target.value)} /></div>
            <div>
              <label style={lbl}>Environment</label>
              <select style={field} value={environment} onChange={e => setEnvironment(e.target.value)}>
                {ENVS.map(env => <option key={env}>{env}</option>)}
              </select>
            </div>
          </div>
          <div><label style={lbl}>Description</label><textarea style={{ ...field, minHeight: 68, resize: 'vertical' as const }} value={description} onChange={e => setDescription(e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div><label style={lbl}>SLO Target</label><input style={field} value={sloTarget} onChange={e => setSloTarget(e.target.value)} placeholder="e.g. 99.9%" /></div>
            <div><label style={lbl}>Service URL</label><input style={field} value={serviceUrl} onChange={e => setServiceUrl(e.target.value)} placeholder="https://..." /></div>
            <div><label style={lbl}>Repository URL</label><input style={field} value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="github.com/org/repo" /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => onSave({ ...project, name, description, environment, serviceUrl, repoUrl, sloTarget })}
              disabled={!changed || !name} className="btn-primary"
              style={{ opacity: changed && name ? 1 : 0.45, cursor: changed && name ? 'pointer' : 'not-allowed' }}>
              Save Changes
            </button>
          </div>
        </div>
      </Slab>
      <Slab title="Danger Zone" subtitle="Irreversible actions — proceed with caution">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10 }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f87171', margin: '0 0 0.125rem' }}>Delete Project</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Permanently removes this project and all its data.</p>
          </div>
          <button onClick={() => setConfirmDel(true)} style={{ padding: '0.4rem 0.875rem', borderRadius: 8, border: '1px solid rgba(248,113,113,0.4)', background: 'transparent', color: '#f87171', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', marginLeft: '1rem' }}>Delete Project</button>
        </div>
      </Slab>
      {confirmDel && <ConfirmModal title="Delete Project" message={`Delete "${project.name}"? This cannot be undone.`} danger onConfirm={onDelete} onCancel={() => setConfirmDel(false)} />}
    </div>
  )
}

const HEALTH_COLOR = (s?: number) => s === undefined ? '#818cf8' : s >= 99 ? '#34d399' : s >= 95 ? '#fbbf24' : '#f87171'

export default function ProjectDetailPage() {
  const { orgId, domainId, projectId } = useParams<{ orgId: string; domainId: string; projectId: string }>()
  const { getOrg, getDomain, getProject, updateProject, deleteProject } = useProjects()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabId>('overview')

  const org = getOrg(orgId!)
  const domain = getDomain(orgId!, domainId!)
  const project = getProject(orgId!, domainId!, projectId!)

  if (!org || !domain || !project) {
    return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Project not found</div>
  }

  const onUpdate = (updated: typeof project) => updateProject(org.id, domain.id, updated)
  const envStyle = ENV_STYLE[project.environment] ?? ENV_STYLE['production']

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <PageBreadcrumb crumbs={[
          { label: 'Organizations', to: '/orgs' },
          { label: org.name, to: `/orgs/${org.id}` },
          { label: domain.name, to: `/orgs/${org.id}/domains/${domain.id}` },
          { label: project.name },
        ]} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{project.name}</h1>
              <span style={{ ...envStyle, borderRadius: 6, padding: '0.2rem 0.625rem', fontSize: '0.75rem', fontWeight: 700 }}>{project.environment}</span>
              {project.investigations > 0 && (
                <span style={{ fontSize: '0.75rem', background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, padding: '0.2rem 0.625rem', fontWeight: 700 }}>
                  {project.investigations} active incident{project.investigations > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{project.description}</p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: HEALTH_COLOR(project.healthScore), margin: 0 }}>{project.healthScore ?? '—'}%</p>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Health</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0 }}>{project.sloActual ?? '—'}</p>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>SLO / {project.sloTarget ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.25rem', padding: '0.75rem 1.5rem 0', borderBottom: '1px solid var(--border)', flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', borderRadius: '8px 8px 0 0', border: `1px solid ${tab === t.id ? 'var(--border)' : 'transparent'}`, borderBottom: tab === t.id ? '1px solid var(--bg-base)' : '1px solid transparent', background: tab === t.id ? 'var(--bg-base)' : 'transparent', color: tab === t.id ? '#818cf8' : 'var(--text-muted)', cursor: 'pointer', fontWeight: tab === t.id ? 700 : 400, fontSize: '0.875rem', whiteSpace: 'nowrap', marginBottom: -1 }}
          >
            <span style={{ fontSize: '0.875rem' }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
        {tab === 'overview'      && <OverviewTab   project={project} onUpdate={onUpdate} />}
        {tab === 'providers'     && <ProvidersTab  project={project} intCategories={INT_CATEGORIES} onUpdate={onUpdate} />}
        {tab === 'knowledge'     && <KnowledgeTab  project={project} onUpdate={onUpdate} />}
        {tab === 'agents'        && <AgentsTab     project={project} onUpdate={onUpdate} />}
        {tab === 'notifications' && <AlertsTab     project={project} onUpdate={onUpdate} />}

        {tab === 'members' && (
          <Slab title="Project Members" subtitle="Team members assigned to this project">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {MOCK_MEMBERS.slice(0, 4).map(m => (
                <div key={m.email} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.active ? 'rgba(129,140,248,0.15)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: m.active ? '#818cf8' : 'var(--text-muted)', fontSize: '0.9rem', flexShrink: 0 }}>{m.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>{m.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{m.email}</p>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(129,140,248,0.12)', color: '#818cf8', borderRadius: 6, padding: '0.2rem 0.5rem', fontWeight: 600 }}>{m.role}</span>
                  <span style={{ fontSize: '0.68rem', color: m.active ? '#34d399' : 'var(--text-muted)' }}>● {m.active ? 'Active' : 'Inactive'}</span>
                </div>
              ))}
            </div>
          </Slab>
        )}

        {tab === 'settings' && (
          <ProjectSettingsTab project={project}
            onSave={updated => onUpdate(updated)}
            onDelete={() => { deleteProject(org.id, domain.id, project.id); navigate(`/orgs/${org.id}/domains/${domain.id}`) }}
          />
        )}
      </div>
    </div>
  )
}
