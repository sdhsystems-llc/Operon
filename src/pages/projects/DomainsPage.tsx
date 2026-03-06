import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useProjects } from './ProjectsContext'
import { DomainModal } from './components/DomainModal'

const HEALTH_COLOR = (score?: number) => score === undefined ? '#818cf8' : score >= 99 ? '#34d399' : score >= 95 ? '#fbbf24' : '#f87171'

export default function DomainsPage() {
  const { getAllDomains, orgs, addDomain } = useProjects()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [orgFilter, setOrgFilter] = useState<string>('all')

  // Create domain flow
  const [showModal, setShowModal] = useState(false)
  const [showDomainModal, setShowDomainModal] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState(orgs[0]?.id ?? '')

  const allDomains = getAllDomains()
  const filtered = allDomains.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.description.toLowerCase().includes(search.toLowerCase()) || d.owner.toLowerCase().includes(search.toLowerCase())
    const matchOrg = orgFilter === 'all' || d.orgId === orgFilter
    return matchSearch && matchOrg
  })

  const avgHealth = (projects: typeof filtered[0]['projects']) => {
    if (!projects.length) return undefined
    const scores = projects.map(p => p.healthScore ?? 100)
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Domains</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.125rem 0 0' }}>{allDomains.length} domains across {orgs.length} organizations</p>
        </div>
        <select value={orgFilter} onChange={e => setOrgFilter(e.target.value)} style={{ padding: '0.5rem 0.875rem', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
          <option value="all">All Organizations</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search domains..." style={{ padding: '0.5rem 0.875rem', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.875rem', width: 220 }} />
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Domain
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Domain', 'Organization', 'Description', 'Owner', 'Projects', 'Avg Health', 'Incidents', 'Alert Channel'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const health = avgHealth(d.projects)
                const incidents = d.projects.reduce((acc, p) => acc + p.investigations, 0)
                return (
                  <tr key={`${d.orgId}-${d.id}`} onClick={() => navigate(`/orgs/${d.orgId}/domains/${d.id}`)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-hover, rgba(129,140,248,0.05))')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{d.name}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ fontSize: '0.8rem', background: 'rgba(129,140,248,0.1)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.25)', borderRadius: 6, padding: '0.2rem 0.5rem', fontWeight: 600 }}>{d.orgName}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.description}</td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{d.owner}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 6, padding: '0.2rem 0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>{d.projects.length}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      {health !== undefined
                        ? <span style={{ fontSize: '0.875rem', fontWeight: 700, color: HEALTH_COLOR(health) }}>{health}%</span>
                        : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      {incidents > 0
                        ? <span style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, padding: '0.2rem 0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>{incidents}</span>
                        : <span style={{ fontSize: '0.8rem', color: '#34d399' }}>Clear</span>}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#818cf8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{d.notificationChannel}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No domains found</p>}
        </div>
      </div>

      {/* Step 1: Pick Org */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem', width: 400 }}>
            <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>New Domain</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 1.25rem' }}>Select which organization this domain belongs to</p>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>Organization</label>
            <select value={selectedOrgId} onChange={e => setSelectedOrgId(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setShowModal(false); setShowDomainModal(true) }}
                disabled={!selectedOrgId}
                style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', background: '#818cf8', color: '#fff', cursor: selectedOrgId ? 'pointer' : 'not-allowed', fontWeight: 600 }}>
                Continue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Domain details */}
      {showDomainModal && (
        <DomainModal
          orgName={orgs.find(o => o.id === selectedOrgId)?.name}
          onClose={() => setShowDomainModal(false)}
          onSave={domain => {
            addDomain(selectedOrgId, domain)
            setShowDomainModal(false)
            navigate(`/orgs/${selectedOrgId}/domains/${domain.id}`)
          }}
        />
      )}
    </div>
  )
}
