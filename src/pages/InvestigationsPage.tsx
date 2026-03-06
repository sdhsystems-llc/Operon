import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Investigation } from '../types/database'
import { MOCK_INVESTIGATIONS } from '../lib/mockData'
import { Search, Filter, Plus, FileText, Loader2, Download } from 'lucide-react'
import { useReports } from '../context/ReportContext'
import { ReportModal } from '../components/layout/ReportModal'
import type { ReportJob } from '../context/ReportContext'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function SeverityBadge({ s }: { s: string }) {
  const m: Record<string, string> = { p1: 'badge-p1', p2: 'badge-p2', p3: 'badge-p3', p4: 'badge-p4' }
  return <span className={m[s] ?? 'badge-p4'}>{s.toUpperCase()}</span>
}

function StatusBadge({ s }: { s: string }) {
  const m: Record<string, string> = { open: 'badge-open', investigating: 'badge-investigating', resolved: 'badge-resolved' }
  return <span className={m[s] ?? 'badge-open'}>{s}</span>
}

const PROJECT_NAMES: Record<string, string> = {
  checkout: 'Checkout Service', catalog: 'Product Catalog', cart: 'Cart API',
  payment: 'Payment Gateway', auth: 'Auth Service', gateway: 'API Gateway',
  lb: 'Load Balancer', pipeline: 'Data Pipeline', analytics: 'Analytics API',
}

export default function InvestigationsPage() {
  const navigate = useNavigate()
  const { startReport, isGenerating, jobs } = useReports()
  const [viewingJob, setViewingJob] = useState<ReportJob | null>(null)
  const [investigations, setInvestigations] = useState<Investigation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')

  useEffect(() => {
    supabase.from('investigations').select('*').order('created_at', { ascending: false })
      .then(({ data }) => {
        setInvestigations((data && data.length > 0 ? data : MOCK_INVESTIGATIONS) as unknown as Investigation[])
        setLoading(false)
      })
  }, [])

  const projectName = (id: string) => PROJECT_NAMES[id] ?? id

  const filtered = investigations.filter(inv => {
    const matchSearch = inv.title.toLowerCase().includes(search.toLowerCase()) || inv.service.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter
    const matchSeverity = severityFilter === 'all' || inv.severity === severityFilter
    return matchSearch && matchStatus && matchSeverity
  })

  if (loading) return <div className="flex items-center justify-center h-full"><div className="text-gray-500 text-sm">Loading...</div></div>

  return (
    <>
    <div className="h-full overflow-y-auto">
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Investigations</h1>
          <p className="text-sm text-gray-400 mt-0.5">{investigations.length} total incidents tracked</p>
        </div>
        <Link to="/investigations/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Investigation
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search incidents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          <select
            className="input py-2 pr-8 w-36"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            className="input py-2 pr-8 w-36"
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
          >
            <option value="all">All Severity</option>
            <option value="p1">P1</option>
            <option value="p2">P2</option>
            <option value="p3">P3</option>
            <option value="p4">P4</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Incident</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Project</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Severity</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Status</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Agent</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Opened</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Report</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map(inv => (
              <tr key={inv.id} className="transition-colors cursor-pointer"
                onClick={() => navigate(`/investigations/${inv.id}`, { state: { from: { label: 'Investigations', to: '/investigations' } } })}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--hover-overlay)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
              >
                <td className="px-5 py-3.5">
                  <div>
                    <p className="text-gray-200 font-medium">{inv.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{inv.service}</p>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">{projectName(inv.project_id)}</td>
                <td className="px-5 py-3.5"><SeverityBadge s={inv.severity} /></td>
                <td className="px-5 py-3.5"><StatusBadge s={inv.status} /></td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">{inv.assigned_agent ?? '—'}</td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">
                  {inv.created_at ? timeAgo(inv.created_at) : '—'}
                </td>
                <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                  {(() => {
                    const generating = isGenerating(inv.id)
                    const done = jobs.find(j => j.id === inv.id && j.status === 'done')
                    if (done) return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <button onClick={() => setViewingJob(done)} style={{
                          display: 'flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.3rem 0.625rem', borderRadius: 6,
                          border: '1px solid rgba(34,197,94,0.35)',
                          background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                          cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
                        }}>
                          <FileText size={11} /> View
                        </button>
                        <button onClick={() => {
                          const blob = new Blob([done.reportHtml ?? ''], { type: 'text/html' })
                          const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
                          a.download = `report-${done.id}.html`; a.click()
                        }} title="Download report" style={{
                          display: 'flex', alignItems: 'center', padding: '0.3rem', borderRadius: 6,
                          border: '1px solid #334155', background: 'transparent',
                          color: '#64748b', cursor: 'pointer',
                        }}
                          onMouseOver={e => (e.currentTarget.style.color = '#94a3b8')}
                          onMouseOut={e => (e.currentTarget.style.color = '#64748b')}
                        >
                          <Download size={11} />
                        </button>
                      </div>
                    )
                    return (
                      <button
                        disabled={generating}
                        onClick={() => startReport({ id: inv.id, title: inv.title, severity: inv.severity, service: inv.service })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.3rem 0.625rem', borderRadius: 6,
                          border: `1px solid ${generating ? '#334155' : '#4338ca50'}`,
                          background: generating ? 'transparent' : 'rgba(99,102,241,0.08)',
                          color: generating ? '#475569' : '#818cf8',
                          cursor: generating ? 'not-allowed' : 'pointer',
                          fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap',
                        }}
                      >
                        {generating
                          ? <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
                          : <><FileText size={11} /> Generate</>
                        }
                      </button>
                    )
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">No investigations match your filters.</div>
        )}
      </div>
    </div>
    </div>

    {viewingJob && viewingJob.reportHtml && (
      <ReportModal job={viewingJob} onClose={() => setViewingJob(null)} />
    )}
    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  )
}
