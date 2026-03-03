import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Agent } from '../types/database'
import { Bot, CircleCheck as CheckCircle, Clock, Cpu } from 'lucide-react'

const typeIcon: Record<string, string> = {
  monitor: '👁',
  investigator: '🔍',
  knowledge: '📚',
  remediation: '🔧',
  reporter: '📝',
  correlator: '🔗',
}

const typeColor: Record<string, string> = {
  monitor: 'text-blue-400 bg-blue-900/30',
  investigator: 'text-amber-400 bg-amber-900/30',
  knowledge: 'text-emerald-400 bg-emerald-900/30',
  remediation: 'text-red-400 bg-red-900/30',
  reporter: 'text-cyan-400 bg-cyan-900/30',
  correlator: 'text-violet-400 bg-violet-900/30',
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('agents').select('*').order('created_at').then(({ data }) => {
      setAgents(data ?? [])
      setLoading(false)
    })
  }, [])

  const activeCount = agents.filter(a => a.status === 'active').length
  const totalTasks = agents.reduce((sum, a) => sum + a.tasks_completed_today, 0)

  if (loading) return <div className="flex items-center justify-center h-full"><div className="text-gray-500 text-sm">Loading...</div></div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">AI Agents</h1>
        <p className="text-sm text-gray-400 mt-0.5">{activeCount} active · {totalTasks} tasks completed today</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map(agent => (
          <div key={agent.id} className="card p-5 hover:border-gray-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${typeColor[agent.type] ?? 'text-gray-400 bg-gray-800'}`}>
                  {typeIcon[agent.type] ?? '🤖'}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{agent.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{agent.type}</p>
                </div>
              </div>
              <span className={agent.status === 'active' ? 'badge-active' : 'badge-idle'}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${agent.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                {agent.status}
              </span>
            </div>

            <div className="space-y-3">
              {agent.current_task ? (
                <div className="bg-gray-800/60 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Cpu className="w-3 h-3 text-blue-400 animate-pulse" />
                    <span className="text-xs text-blue-400 font-medium">Working</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{agent.current_task}</p>
                </div>
              ) : (
                <div className="bg-gray-800/40 rounded-lg p-3 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-600" />
                  <span className="text-xs text-gray-600">Awaiting tasks</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>{agent.tasks_completed_today} tasks today</span>
              </div>

              {agent.capabilities && agent.capabilities.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {agent.capabilities.map((cap: string) => (
                    <span key={cap} className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400 border border-gray-700">
                      {cap}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bot className="w-10 h-10 text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm">No agents configured yet.</p>
        </div>
      )}
    </div>
  )
}
