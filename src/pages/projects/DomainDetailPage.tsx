import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useProjects } from './ProjectsContext'
import { PageBreadcrumb } from './components/PageBreadcrumb'
import { DomainModal } from './components/DomainModal'
import { ProjectModal } from './components/ProjectModal'
import { ConfirmModal } from './components/ConfirmModal'
import { Slab } from './components/Slab'
import { KnowledgeDocsPanel } from './components/KnowledgeDocsPanel'
import { ENV_STYLE, MOCK_MEMBERS } from './mockData'
import type { Domain, Project, KnowledgeDoc } from './types'

const TABS = ['Overview', 'Projects', 'Knowledge', 'Members', 'Settings'] as const
type Tab = typeof TABS[number]
const HEALTH_COLOR = (s?: number) => s === undefined ? '#818cf8' : s >= 99 ? '#34d399' : s >= 95 ? '#fbbf24' : '#f87171'

function DomainSettingsTab({ domain, orgId, onSave, onDelete }: { domain: Domain; orgId: string; onSave: (d: Domain) => void; onDelete: () => void }) {
  const [name, setName] = useState(domain.name)
  const [description, setDescription] = useState(domain.description)
  const [owner, setOwner] = useState(domain.owner)
  const [channel, setChannel] = useState(domain.notificationChannel)
  const [confirmDel, setConfirmDel] = useState(false)
  const changed = name !== domain.name || description !== domain.description || owner !== domain.owner || channel !== domain.notificationChannel
  const field = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box' as const }
  const lbl = { fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 as const, display: 'block' as const, marginBottom: '0.25rem' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Slab title="Domain Settings" subtitle="Update this domain's configuration">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><label style={lbl}>Domain Name</label><input style={field} value={name} onChange={e => setName(e.target.value)} /></div>
            <div><label style={lbl}>Owner / Team</label><input style={field} value={owner} onChange={e => setOwner(e.target.value)} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><label style={lbl}>Description</label><input style={field} value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div><label style={lbl}>Notification Channel</label><input style={field} value={channel} onChange={e => setChannel(e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => onSave({ ...domain, name, description, owner, notificationChannel: channel })}
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
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f87171', margin: '0 0 0.125rem' }}>Delete Domain</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Permanently deletes this domain and all its projects.</p>
          </div>
          <button onClick={() => setConfirmDel(true)} style={{ padding: '0.4rem 0.875rem', borderRadius: 8, border: '1px solid rgba(248,113,113,0.4)', background: 'transparent', color: '#f87171', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', marginLeft: '1rem' }}>Delete Domain</button>
        </div>
      </Slab>
      {confirmDel && <ConfirmModal title="Delete Domain" message={`Delete "${domain.name}" and all its projects? This cannot be undone.`} danger onConfirm={onDelete} onCancel={() => setConfirmDel(false)} />}
    </div>
  )
}

export default function DomainDetailPage() {
  const { orgId, domainId } = useParams<{ orgId: string; domainId: string }>()
  const { getOrg, getDomain, addProject, updateProject, deleteProject, updateDomain, deleteDomain } = useProjects()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('Overview')
  const [projectModal, setProjectModal] = useState(false)
  const [domainEditModal, setDomainEditModal] = useState(false)
  const [confirm, setConfirm] = useState<string | null>(null)

  const org = getOrg(orgId!)
  const domain = getDomain(orgId!, domainId!)
  if (!org || !domain) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Domain not found</div>

  const incidents = domain.projects.reduce((acc, p) => acc + p.investigations, 0)
  const scores = domain.projects.map(p => p.healthScore ?? 100)
  const avgHealth = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : undefined

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
        <PageBreadcrumb crumbs={[{ label: 'Organizations', to: '/orgs' }, { label: org.name, to: `/orgs/${org.id}` }, { label: domain.name }]} />
        <div style={{ marginTop: '0.75rem' }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.125rem' }}>{domain.name}</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{domain.description} · Owner: <strong>{domain.owner}</strong></p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', padding: '0.75rem 1.5rem 0', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '0.5rem 1rem', borderRadius: '8px 8px 0 0', border: `1px solid ${tab === t ? 'var(--border)' : 'transparent'}`, borderBottom: tab === t ? '1px solid var(--bg-base)' : '1px solid transparent', background: tab === t ? 'var(--bg-base)' : 'transparent', color: tab === t ? '#818cf8' : 'var(--text-muted)', cursor: 'pointer', fontWeight: tab === t ? 700 : 400, fontSize: '0.875rem', marginBottom: -1 }}>{t}</button>)}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
        {tab === 'Overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '0.75rem' }}>
              {[
                { label: 'Projects', value: domain.projects.length, color: '#34d399' },
                { label: 'Avg Health', value: avgHealth !== undefined ? `${avgHealth}%` : '—', color: HEALTH_COLOR(avgHealth) },
                { label: 'Active Incidents', value: incidents, color: incidents ? '#f87171' : '#34d399' },
                { label: 'Agents', value: [...new Set(domain.projects.flatMap(p => p.agents))].length, color: '#818cf8' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.875rem 1rem' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{s.label}</p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, margin: '0.25rem 0 0' }}>{s.value}</p>
                </div>
              ))}
            </div>
            <Slab title="Projects" subtitle={`${domain.projects.length} services in the ${domain.name} domain`}
              action={<button onClick={() => setProjectModal(true)} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.875rem' }}><Plus className="w-3 h-3" /> New Project</button>}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {domain.projects.map(p => {
                  const envStyle = ENV_STYLE[p.environment] ?? ENV_STYLE['production']
                  return (
                    <div key={p.id} onClick={() => navigate(`/orgs/${org.id}/domains/${domain.id}/projects/${p.id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.875rem', background: 'var(--bg-base)', borderRadius: 9, border: '1px solid var(--border)', cursor: 'pointer' }}
                      onMouseOver={e => (e.currentTarget.style.borderColor = '#818cf8')}
                      onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: HEALTH_COLOR(p.healthScore), flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</p>
                      </div>
                      <span style={{ ...envStyle, borderRadius: 6, padding: '0.2rem 0.5rem', fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{p.environment}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: HEALTH_COLOR(p.healthScore), whiteSpace: 'nowrap' }}>{p.healthScore ?? '—'}%</span>
                      {p.investigations > 0 && <span style={{ fontSize: '0.7rem', background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 5, padding: '0.15rem 0.4rem', whiteSpace: 'nowrap' }}>{p.investigations} open</span>}
                    </div>
                  )
                })}
                {domain.projects.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>No projects yet</p>}
              </div>
            </Slab>
          </div>
        )}

        {tab === 'Projects' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setProjectModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Project</button>
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Project', 'Description', 'Environment', 'Health', 'SLO', 'Incidents', 'Agents', 'Actions'].map(h => <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {domain.projects.map(p => {
                    const envStyle = ENV_STYLE[p.environment] ?? ENV_STYLE['production']
                    return (
                      <tr key={p.id} onClick={() => navigate(`/orgs/${org.id}/domains/${domain.id}/projects/${p.id}`)}
                        style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                        onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-hover, rgba(129,140,248,0.05))')}
                        onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{p.name}</td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</td>
                        <td style={{ padding: '0.875rem 1rem' }}><span style={{ ...envStyle, borderRadius: 6, padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>{p.environment}</span></td>
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: HEALTH_COLOR(p.healthScore), whiteSpace: 'nowrap' }}>{p.healthScore ?? '—'}%</td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.sloActual ?? '—'} / {p.sloTarget ?? '—'}</td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          {p.investigations > 0
                            ? <span style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, padding: '0.2rem 0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>{p.investigations}</span>
                            : <span style={{ fontSize: '0.8rem', color: '#34d399' }}>Clear</span>}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.agents.length > 0 ? p.agents.join(', ') : '—'}</td>
                        <td style={{ padding: '0.875rem 1rem' }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => setConfirm(p.id)} style={{ padding: '0.3rem 0.625rem', borderRadius: 6, border: '1px solid rgba(248,113,113,0.3)', background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: '0.78rem' }}>Delete</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {domain.projects.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No projects yet</p>}
            </div>
          </div>
        )}

        {tab === 'Knowledge' && (
          <KnowledgeDocsPanel
            docs={domain.knowledge}
            title="Domain Knowledge"
            subtitle="Docs scoped to all projects in this domain"
            onAdd={(doc: KnowledgeDoc) => updateDomain(org.id, { ...domain, knowledge: [...domain.knowledge, doc] })}
            onRemove={(id: string) => updateDomain(org.id, { ...domain, knowledge: domain.knowledge.filter(d => d.id !== id) })}
          />
        )}
        {tab === 'Members' && (
          <Slab title="Domain Team" subtitle="Members responsible for this domain">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {MOCK_MEMBERS.slice(0, 5).map(m => (
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

        {tab === 'Settings' && (
          <DomainSettingsTab domain={domain} orgId={org.id}
            onSave={updated => updateDomain(org.id, updated)}
            onDelete={() => { deleteDomain(org.id, domain.id); navigate(`/orgs/${org.id}`) }}
          />
        )}
      </div>

      {domainEditModal && (
        <DomainModal existing={domain} orgName={org.name}
          onSave={d => { updateDomain(org.id, { ...domain, ...d }); setDomainEditModal(false) }}
          onClose={() => setDomainEditModal(false)}
        />
      )}
      {projectModal && (
        <ProjectModal domainName={domain.name}
          onSave={p => { addProject(org.id, domain.id, p); setProjectModal(false) }}
          onClose={() => setProjectModal(false)}
        />
      )}
      {confirm && (
        <ConfirmModal title="Delete Project" message="This project and all its data will be permanently deleted." danger
          onConfirm={() => { deleteProject(org.id, domain.id, confirm); setConfirm(null) }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
