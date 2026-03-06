import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useProjects } from './ProjectsContext'
import { ENV_STYLE } from './mockData'
import { ProjectModal } from './components/ProjectModal'

const HEALTH_COLOR = (s?: number) => s === undefined ? '#818cf8' : s >= 99 ? '#34d399' : s >= 95 ? '#fbbf24' : '#f87171'

export default function ProjectsListPage() {
  const { getAllProjects, orgs, domains, addProject } = useProjects()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [orgFilter, setOrgFilter] = useState('all')
  const [envFilter, setEnvFilter] = useState('all')

  // Create project flow
  const [step, setStep] = useState<'none' | 'pick' | 'create'>('none')
  const [newOrgId, setNewOrgId] = useState(orgs[0]?.id ?? '')
  const [newDomainId, setNewDomainId] = useState('')

  const orgDomains = domains[newOrgId] ?? []

  const all = getAllProjects()
  const filtered = all.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())
    const matchOrg = orgFilter === 'all' || p.orgId === orgFilter
    const matchEnv = envFilter === 'all' || p.environment === envFilter
    return matchSearch && matchOrg && matchEnv
  })

  const envs = [...new Set(all.map(p => p.environment))]
  const totalIncidents = filtered.reduce((acc, p) => acc + p.investigations, 0)
  const healthy = filtered.filter(p => (p.healthScore ?? 100) >= 99).length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Projects</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.125rem 0 0' }}>{all.length} projects across {orgs.length} organizations</p>
          </div>
          <select value={orgFilter} onChange={e => setOrgFilter(e.target.value)} style={{ padding: '0.5rem 0.875rem', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
            <option value="all">All Organizations</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select value={envFilter} onChange={e => setEnvFilter(e.target.value)} style={{ padding: '0.5rem 0.875rem', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
            <option value="all">All Environments</option>
            {envs.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." style={{ padding: '0.5rem 0.875rem', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.875rem', width: 220 }} />
          <button onClick={() => { setNewOrgId(orgs[0]?.id ?? ''); setNewDomainId(''); setStep('pick') }} className="btn-primary">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
        {/* Summary bar */}
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem' }}>
          {[
            { label: 'Total', value: filtered.length, color: 'var(--text-primary)' },
            { label: 'Healthy (≥99%)', value: healthy, color: '#34d399' },
            { label: 'Active Incidents', value: totalIncidents, color: totalIncidents ? '#f87171' : '#34d399' },
          ].map(s => <span key={s.label} style={{ color: 'var(--text-muted)' }}>{s.label}: <strong style={{ color: s.color }}>{s.value}</strong></span>)}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Project', 'Organization', 'Domain', 'Environment', 'Health', 'SLO Actual', 'Incidents', 'Agents', 'Last Deploy'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const envStyle = ENV_STYLE[p.environment] ?? ENV_STYLE['production']
                return (
                  <tr key={`${p.orgId}-${p.domainId}-${p.id}`}
                    onClick={() => navigate(`/orgs/${p.orgId}/domains/${p.domainId}/projects/${p.id}`)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-hover, rgba(129,140,248,0.05))')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: HEALTH_COLOR(p.healthScore), flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ fontSize: '0.78rem', background: 'rgba(129,140,248,0.1)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.25)', borderRadius: 6, padding: '0.2rem 0.5rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{p.orgName}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.domainName}</td>
                    <td style={{ padding: '0.875rem 1rem' }}><span style={{ ...envStyle, borderRadius: 6, padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{p.environment}</span></td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 800, color: HEALTH_COLOR(p.healthScore), whiteSpace: 'nowrap' }}>{p.healthScore ?? '—'}%</td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.sloActual ?? '—'}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      {p.investigations > 0
                        ? <span style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, padding: '0.2rem 0.5rem', fontSize: '0.78rem', fontWeight: 600 }}>{p.investigations}</span>
                        : <span style={{ fontSize: '0.78rem', color: '#34d399' }}>Clear</span>}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.agents.length > 0 ? p.agents.slice(0, 2).join(', ') + (p.agents.length > 2 ? ' +' + (p.agents.length - 2) : '') : '—'}</td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {p.lastDeploy ? `${p.lastDeploy.commit} · ${p.lastDeploy.when}` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No projects found</p>}
        </div>
      </div>

      {/* Step 1: Pick org + domain */}
      {step === 'pick' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem', width: 440 }}>
            <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>New Project</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 1.25rem' }}>Choose the organization and domain for this project</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>Organization</label>
                <select value={newOrgId} onChange={e => { setNewOrgId(e.target.value); setNewDomainId('') }}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>Domain</label>
                <select value={newDomainId} onChange={e => setNewDomainId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                  <option value="">— Select domain —</option>
                  {orgDomains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                {orgDomains.length === 0 && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.375rem' }}>No domains in this org yet — create one first</p>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setStep('none')} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => setStep('create')}
                disabled={!newDomainId}
                style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', background: newDomainId ? '#818cf8' : '#4b5563', color: '#fff', cursor: newDomainId ? 'pointer' : 'not-allowed', fontWeight: 600 }}>
                Continue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Project details */}
      {step === 'create' && (
        <ProjectModal
          domainName={orgDomains.find(d => d.id === newDomainId)?.name}
          onClose={() => setStep('none')}
          onSave={partial => {
            addProject(newOrgId, newDomainId, partial)
            setStep('none')
          }}
        />
      )}
    </div>
  )
}
