import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useProjects } from './ProjectsContext'
import { OrgModal } from './components/OrgModal'
import { ConfirmModal } from './components/ConfirmModal'
import type { Org } from './types'

const PLAN_COLOR: Record<string, string> = { Enterprise: '#818cf8', Pro: '#34d399', Starter: '#60a5fa' }

export default function OrgsPage() {
  const { orgs, domains, addOrg, updateOrg, deleteOrg } = useProjects()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Org | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.industry.toLowerCase().includes(search.toLowerCase())
  )

  const allProjects = (orgId: string) => (domains[orgId] ?? []).reduce((acc, d) => acc + d.projects.length, 0)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Organizations</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.125rem 0 0' }}>{orgs.length} organization{orgs.length !== 1 ? 's' : ''}</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search organizations..." style={{ padding: '0.5rem 0.875rem', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.875rem', width: 240 }} />
        <button onClick={() => { setEditing(null); setModal('add') }} className="btn-primary">
          <Plus className="w-4 h-4" /> New Organization
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Organization', 'Industry', 'Domains', 'Projects', 'Plan', 'Timezone', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(org => {
                const domCount = (domains[org.id] ?? []).length
                const projCount = allProjects(org.id)
                const planColor = PLAN_COLOR[org.plan] ?? '#818cf8'
                return (
                  <tr key={org.id} onClick={() => navigate(`/orgs/${org.id}`)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-hover, rgba(129,140,248,0.05))')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem', color: '#818cf8', flexShrink: 0 }}>{org.name[0]}</div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{org.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{org.industry}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 6, padding: '0.2rem 0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>{domCount}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 6, padding: '0.2rem 0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>{projCount}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ background: `${planColor}15`, color: planColor, border: `1px solid ${planColor}40`, borderRadius: 6, padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>{org.plan}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{org.timezone}</td>
                    <td style={{ padding: '0.875rem 1rem' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button onClick={() => { setEditing(org); setModal('edit') }} style={{ padding: '0.3rem 0.625rem', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem' }}>Edit</button>
                        <button onClick={() => setConfirm(org.id)} style={{ padding: '0.3rem 0.625rem', borderRadius: 6, border: '1px solid rgba(248,113,113,0.3)', background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: '0.78rem' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No organizations found</p>}
        </div>
      </div>

      {/* Modals */}
      {(modal === 'add' || modal === 'edit') && (
        <OrgModal existing={editing ?? undefined}
          onSave={o => { modal === 'edit' ? updateOrg({ ...o, knowledge: editing?.knowledge ?? [] }) : addOrg(o); setModal(null) }}
          onClose={() => setModal(null)}
        />
      )}
      {confirm && (
        <ConfirmModal title="Delete Organization" message="This will permanently delete the organization and all its domains and projects." danger
          onConfirm={() => { deleteOrg(confirm); setConfirm(null) }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
