import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Investigation, Project } from '../types/database'
import { formatDistanceToNow } from 'date-fns'
import { Search, Filter } from 'lucide-react'

function SeverityBadge({ s }: { s: string }) {
  const m: Record<string, string> = { p1: 'badge-p1', p2: 'badge-p2', p3: 'badge-p3', p4: 'badge-p4' }
  return <span className={m[s] ?? 'badge-p4'}>{s.toUpperCase()}</span>
}

function StatusBadge({ s }: { s: string }) {
  const m: Record<string, string> = { open: 'badge-open', investigating: 'badge-investigating', resolved: 'badge-resolved' }
  return <span className={m[s] ?? 'badge-open'}>{s}</span>
}

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([])
  const [projects, setProjects] = useState<Pick<Project, 'id' | 'name'>[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')

  useEffect(() => {
    Promise.all([
      supabase.from('investigations').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name'),
    ]).then(([inv, proj]) => {
      setInvestigations(inv.data ?? [])
      setProjects(proj.data ?? [])
      setLoading(false)
    })
  }, [])

  const projectName = (id: string) => projects.find(p => p.id === id)?.name ?? '—'

  const filtered = investigations.filter(inv => {
    const matchSearch = inv.title.toLowerCase().includes(search.toLowerCase()) || inv.service.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter
    const matchSeverity = severityFilter === 'all' || inv.severity === severityFilter
    return matchSearch && matchStatus && matchSeverity
  })

  if (loading) return <div className="flex items-center justify-center h-full"><div className="text-gray-500 text-sm">Loading...</div></div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Investigations</h1>
        <p className="text-sm text-gray-400 mt-0.5">{investigations.length} total incidents tracked</p>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map(inv => (
              <tr key={inv.id} className="hover:bg-gray-800/40 transition-colors cursor-pointer">
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
                  {inv.created_at ? formatDistanceToNow(new Date(inv.created_at), { addSuffix: true }) : '—'}
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
  )
}
