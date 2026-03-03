import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Investigation, Agent, Project } from '../types/database'
import { AlertTriangle, Bot, FolderOpen, Activity, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls: Record<string, string> = {
    p1: 'badge-p1',
    p2: 'badge-p2',
    p3: 'badge-p3',
    p4: 'badge-p4',
  }
  return <span className={cls[severity] ?? 'badge-p4'}>{severity.toUpperCase()}</span>
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    open: 'badge-open',
    investigating: 'badge-investigating',
    resolved: 'badge-resolved',
  }
  return <span className={cls[status] ?? 'badge-open'}>{status}</span>
}

export default function DashboardPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('investigations').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('agents').select('*').limit(6),
      supabase.from('projects').select('*').limit(10),
    ]).then(([inv, ags, proj]) => {
      setInvestigations(inv.data ?? [])
      setAgents(ags.data ?? [])
      setProjects(proj.data ?? [])
      setLoading(false)
    })
  }, [])

  const openCount = investigations.filter(i => i.status !== 'resolved').length
  const activeAgents = agents.filter(a => a.status === 'active').length
  const p1Count = investigations.filter(i => i.severity === 'p1' && i.status !== 'resolved').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Production overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Open Incidents" value={openCount} icon={AlertTriangle} color="bg-red-900/40 text-red-400" />
        <StatCard label="P1 Critical" value={p1Count} icon={Activity} color="bg-orange-900/40 text-orange-400" />
        <StatCard label="Active Agents" value={`${activeAgents}/${agents.length}`} icon={Bot} color="bg-blue-900/40 text-blue-400" />
        <StatCard label="Projects" value={projects.length} icon={FolderOpen} color="bg-emerald-900/40 text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 className="text-sm font-medium text-white">Recent Investigations</h2>
              <Link to="/investigations" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-800">
              {investigations.map(inv => (
                <div key={inv.id} className="px-5 py-3.5 hover:bg-gray-800/40 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 truncate">{inv.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{inv.service} · {formatDistanceToNow(new Date(inv.created_at!), { addSuffix: true })}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <SeverityBadge severity={inv.severity} />
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 className="text-sm font-medium text-white">AI Agents</h2>
              <Link to="/agents" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-800">
              {agents.slice(0, 5).map(agent => (
                <div key={agent.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-200 font-medium">{agent.name}</span>
                    <span className={agent.status === 'active' ? 'badge-active' : 'badge-idle'}>
                      {agent.status}
                    </span>
                  </div>
                  {agent.current_task ? (
                    <p className="text-xs text-gray-500 truncate">{agent.current_task}</p>
                  ) : (
                    <p className="text-xs text-gray-600">No active task</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
