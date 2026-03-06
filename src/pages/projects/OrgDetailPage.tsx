import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useProjects } from './ProjectsContext'
import { PageBreadcrumb } from './components/PageBreadcrumb'
import { OrgModal } from './components/OrgModal'
import { DomainModal } from './components/DomainModal'
import { ConfirmModal } from './components/ConfirmModal'
import { Slab } from './components/Slab'
import { KnowledgeDocsPanel } from './components/KnowledgeDocsPanel'
import { MOCK_MEMBERS, uid } from './mockData'
import type { Domain, Org, KnowledgeDoc } from './types'

const TABS = ['Overview', 'Domains', 'Knowledge', 'Members', 'Settings'] as const
type Tab = typeof TABS[number]

function OrgSettingsTab({ org, onSave, onDelete }: { org: Org; onSave: (o: Org) => void; onDelete: () => void }) {
  const [name, setName] = useState(org.name)
  const [industry, setIndustry] = useState(org.industry)
  const [timezone, setTimezone] = useState(org.timezone)
  const [plan, setPlan] = useState(org.plan)
  const [confirmDel, setConfirmDel] = useState(false)
  const changed = name !== org.name || industry !== org.industry || timezone !== org.timezone || plan !== org.plan
  const field = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box' as const }
  const label = { fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 as const, display: 'block' as const, marginBottom: '0.25rem' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Slab title="General" subtitle="Basic organization information">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><label style={label}>Organization Name</label><input style={field} value={name} onChange={e => setName(e.target.value)} /></div>
            <div><label style={label}>Industry</label><input style={field} value={industry} onChange={e => setIndustry(e.target.value)} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><label style={label}>Plan</label>
              <select style={field} value={plan} onChange={e => setPlan(e.target.value)}>
                {['Starter', 'Pro', 'Enterprise'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label style={label}>Timezone</label><input style={field} value={timezone} onChange={e => setTimezone(e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => onSave({ ...org, name, industry, timezone, plan })} disabled={!changed || !name}
              className="btn-primary" style={{ opacity: changed && name ? 1 : 0.45, cursor: changed && name ? 'pointer' : 'not-allowed' }}>
              Save Changes
            </button>
          </div>
        </div>
      </Slab>
      <Slab title="Danger Zone" subtitle="Irreversible actions — proceed with caution">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10 }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f87171', margin: '0 0 0.125rem' }}>Delete Organization</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Permanently deletes this org and all its domains and projects.</p>
          </div>
          <button onClick={() => setConfirmDel(true)} style={{ padding: '0.4rem 0.875rem', borderRadius: 8, border: '1px solid rgba(248,113,113,0.4)', background: 'transparent', color: '#f87171', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', marginLeft: '1rem' }}>Delete Org</button>
        </div>
      </Slab>
      {confirmDel && <ConfirmModal title="Delete Organization" message={`Delete "${org.name}" and all its domains and projects? This cannot be undone.`} danger onConfirm={onDelete} onCancel={() => setConfirmDel(false)} />}
    </div>
  )
}

const HEALTH_COLOR = (score?: number) => score === undefined ? '#818cf8' : score >= 99 ? '#34d399' : score >= 95 ? '#fbbf24' : '#f87171'

export default function OrgDetailPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const { getOrg, domains, getAllProjects, addDomain, updateDomain, deleteDomain, updateOrg, deleteOrg } = useProjects()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('Overview')
  const [domainModal, setDomainModal] = useState<'add' | 'edit' | null>(null)
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)
  const [orgEditOpen, setOrgEditOpen] = useState(false)

  const org = getOrg(orgId!)
  if (!org) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Organization not found</div>

  const orgDomains = domains[org.id] ?? []
  const allProjects = getAllProjects().filter(p => p.orgId === org.id)
  const activeIncidents = allProjects.reduce((acc, p) => acc + p.investigations, 0)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
        <PageBreadcrumb crumbs={[{ label: 'Organizations', to: '/orgs' }, { label: org.name }]} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', color: '#818cf8' }}>{org.name[0]}</div>
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{org.name}</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{org.industry} · {org.plan} · {org.timezone}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', padding: '0.75rem 1.5rem 0', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '0.5rem 1rem', borderRadius: '8px 8px 0 0', border: `1px solid ${tab === t ? 'var(--border)' : 'transparent'}`, borderBottom: tab === t ? '1px solid var(--bg-base)' : '1px solid transparent', background: tab === t ? 'var(--bg-base)' : 'transparent', color: tab === t ? '#818cf8' : 'var(--text-muted)', cursor: 'pointer', fontWeight: tab === t ? 700 : 400, fontSize: '0.875rem', marginBottom: -1 }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
        {tab === 'Overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '0.75rem' }}>
              {[
                { label: 'Domains', value: orgDomains.length, color: '#60a5fa' },
                { label: 'Projects', value: allProjects.length, color: '#34d399' },
                { label: 'Active Incidents', value: activeIncidents, color: activeIncidents ? '#f87171' : '#34d399' },
                { label: 'AI Agents', value: [...new Set(allProjects.flatMap(p => p.agents))].length, color: '#818cf8' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.875rem 1rem' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{s.label}</p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, margin: '0.25rem 0 0' }}>{s.value}</p>
                </div>
              ))}
            </div>
            <Slab title="Project Health" subtitle="All projects across this organization">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {allProjects.map(p => (
                  <div key={p.id} onClick={() => navigate(`/orgs/${org.id}/domains/${p.domainId}/projects/${p.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}
                    onMouseOver={e => (e.currentTarget.style.borderColor = '#818cf8')}
                    onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: HEALTH_COLOR(p.healthScore), flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{p.domainName}</p>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: HEALTH_COLOR(p.healthScore) }}>{p.healthScore ?? '–'}%</span>
                    {p.investigations > 0 && <span style={{ fontSize: '0.72rem', background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 5, padding: '0.1rem 0.4rem' }}>{p.investigations} incident{p.investigations > 1 ? 's' : ''}</span>}
                  </div>
                ))}
              </div>
            </Slab>
            {org.knowledge.length > 0 && (
              <Slab title="Org-Level Knowledge" subtitle="Documents scoped to this entire organization">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {org.knowledge.map(k => (
                    <div key={k.id} style={{ padding: '0.75rem', background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>{k.title}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{k.summary}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>{k.author} · {k.updatedAt}</p>
                    </div>
                  ))}
                </div>
              </Slab>
            )}
          </div>
        )}

        {tab === 'Domains' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { setEditingDomain(null); setDomainModal('add') }} className="btn-primary"><Plus className="w-4 h-4" /> New Domain</button>
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Domain', 'Description', 'Owner', 'Projects', 'Notification Channel', 'Actions'].map(h => <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {orgDomains.map(d => (
                    <tr key={d.id} onClick={() => navigate(`/orgs/${org.id}/domains/${d.id}`)}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-hover, rgba(129,140,248,0.05))')}
                      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{d.name}</td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.description}</td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d.owner}</td>
                      <td style={{ padding: '0.875rem 1rem' }}><span style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 6, padding: '0.2rem 0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>{d.projects.length}</span></td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#818cf8', fontFamily: 'monospace' }}>{d.notificationChannel}</td>
                      <td style={{ padding: '0.875rem 1rem' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button onClick={() => { setEditingDomain(d); setDomainModal('edit') }} style={{ padding: '0.3rem 0.625rem', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem' }}>Edit</button>
                          <button onClick={() => setConfirm(d.id)} style={{ padding: '0.3rem 0.625rem', borderRadius: 6, border: '1px solid rgba(248,113,113,0.3)', background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: '0.78rem' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orgDomains.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No domains yet</p>}
            </div>
          </div>
        )}

        {tab === 'Knowledge' && (
          <KnowledgeDocsPanel
            docs={org.knowledge}
            title="Organization Knowledge"
            subtitle="Docs scoped to all teams and projects in this organization"
            onAdd={(doc: KnowledgeDoc) => updateOrg({ ...org, knowledge: [...org.knowledge, doc] })}
            onRemove={(id: string) => updateOrg({ ...org, knowledge: org.knowledge.filter(d => d.id !== id) })}
          />
        )}

        {tab === 'Members' && (
          <Slab title="Team Members" subtitle="Members with access to this organization"
            action={<button className="btn-primary" onClick={() => setOrgEditOpen(true)} style={{ fontSize: '0.8rem', padding: '0.35rem 0.875rem' }}><Plus className="w-3 h-3" /> Invite</button>}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {MOCK_MEMBERS.map(m => (
                <div key={m.email} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.active ? 'rgba(129,140,248,0.15)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: m.active ? '#818cf8' : 'var(--text-muted)', fontSize: '0.9rem' }}>{m.avatar}</div>
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
          <OrgSettingsTab org={org}
            onSave={updated => { updateOrg(updated); }}
            onDelete={() => { deleteOrg(org.id); navigate('/orgs') }}
          />
        )}
      </div>

      {orgEditOpen && (
        <OrgModal existing={org}
          onSave={o => { updateOrg({ ...o, knowledge: org.knowledge }); setOrgEditOpen(false) }}
          onClose={() => setOrgEditOpen(false)}
        />
      )}
      {(domainModal === 'add' || domainModal === 'edit') && (
        <DomainModal existing={editingDomain ?? undefined} orgName={org.name}
          onSave={d => { domainModal === 'edit' ? updateDomain(org.id, { ...editingDomain!, ...d }) : addDomain(org.id, d); setDomainModal(null) }}
          onClose={() => setDomainModal(null)}
        />
      )}
      {confirm && (
        <ConfirmModal title="Delete Domain" message="All projects in this domain will also be deleted." danger
          onConfirm={() => { deleteDomain(org.id, confirm); setConfirm(null) }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
