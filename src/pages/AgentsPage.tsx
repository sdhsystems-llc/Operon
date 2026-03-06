import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import type { Agent } from '../types/database'
import { Bot, CircleCheck as CheckCircle, Clock, Cpu, ScrollText, Plus } from 'lucide-react'
import { LogsPanel } from './agents/LogsPanel'
import { DeployWizard } from './agents/DeployWizard'
import { generateMockLogs } from './agents/mockData'
import type { AgentLog } from './agents/types'

const typeIcon: Record<string, string> = {
  monitor:      '👁',
  investigator: '🔍',
  knowledge:    '📚',
  remediation:  '🔧',
  reporter:     '📝',
  correlator:   '🔗',
  triage:       '🚦',
}

const typeColors: Record<string, { bg: string; color: string }> = {
  monitor:      { bg: 'rgba(96,165,250,0.15)',   color: '#60a5fa' },
  investigator: { bg: 'rgba(251,191,36,0.15)',   color: '#fbbf24' },
  knowledge:    { bg: 'rgba(52,211,153,0.15)',   color: '#34d399' },
  remediation:  { bg: 'rgba(248,113,113,0.15)',  color: '#f87171' },
  reporter:     { bg: 'rgba(34,211,238,0.15)',   color: '#22d3ee' },
  correlator:   { bg: 'rgba(167,139,250,0.15)',  color: '#a78bfa' },
  triage:       { bg: 'rgba(251,146,60,0.15)',   color: '#fb923c' },
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    supabase.from('agents').select('*').order('created_at').then(({ data }) => {
      setAgents(data ?? [])
      setLoading(false)
    })
  }, [])

  const handleViewLogs = (agent: Agent) => {
    setSelectedAgent(agent)
    setLogs(generateMockLogs(agent.type, agent.id))
  }

  const handleDeploy = async (data: { name: string; type: string; capabilities: string[] }) => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .maybeSingle()

    const orgId = profile?.org_id ?? null

    const { data: newAgent } = await supabase
      .from('agents')
      .insert({
        name: data.name,
        type: data.type,
        status: 'idle',
        capabilities: data.capabilities,
        tasks_completed_today: 0,
        current_task: null,
        org_id: orgId,
      })
      .select()
      .single()

    if (newAgent) setAgents(prev => [...prev, newAgent])
    setShowWizard(false)
  }

  const activeCount = agents.filter(a => a.status === 'active').length
  const totalTasks = agents.reduce((sum, a) => sum + a.tasks_completed_today, 0)

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</div>
    </div>
  )

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>AI Agents</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {activeCount} active · {totalTasks} tasks completed today
            </p>
          </div>
          <button onClick={() => setShowWizard(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Deploy New Agent
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map(agent => {
            const tc = typeColors[agent.type] ?? { bg: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
            return (
              <div key={agent.id} className="card p-5 flex flex-col transition-colors"
                style={{ '--hover-border': 'var(--border)' } as React.CSSProperties}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--card-border)')}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: tc.bg }}>
                      {typeIcon[agent.type] ?? '🤖'}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{agent.name}</h3>
                      <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{agent.type}</p>
                    </div>
                  </div>
                  <span className={agent.status === 'active' ? 'badge-active' : agent.status === 'error' ? 'badge-p1' : 'badge-idle'}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${
                      agent.status === 'active' ? 'bg-emerald-400 animate-pulse' :
                      agent.status === 'error'  ? 'bg-red-400' : 'bg-gray-500'
                    }`} />
                    {agent.status}
                  </span>
                </div>

                {/* Task / idle */}
                <div className="space-y-3 flex-1">
                  {agent.current_task ? (
                    <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Cpu className="w-3 h-3 animate-pulse" style={{ color: tc.color }} />
                        <span className="text-xs font-medium" style={{ color: tc.color }}>Working</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{agent.current_task}</p>
                    </div>
                  ) : (
                    <div className="rounded-lg p-3 flex items-center gap-2" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                      <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Awaiting tasks</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <CheckCircle className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
                    <span>{agent.tasks_completed_today} tasks today</span>
                  </div>

                  {agent.capabilities && agent.capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {agent.capabilities.map((cap: string) => (
                        <span key={cap} className="px-2 py-0.5 rounded text-xs"
                          style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                          {cap}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* View Logs button */}
                <button
                  onClick={() => handleViewLogs(agent)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = tc.bg
                    ;(e.currentTarget as HTMLButtonElement).style.color = tc.color
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = tc.color
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-elevated)'
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                  }}
                >
                  <ScrollText className="w-3.5 h-3.5" />
                  View Logs
                </button>
              </div>
            )
          })}
        </div>

        {agents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bot className="w-10 h-10 mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No agents configured yet.</p>
          </div>
        )}
      </div>

      {/* Logs slide-over */}
      <AnimatePresence>
        {selectedAgent && (
          <LogsPanel
            agent={selectedAgent as any}
            logs={logs}
            onClose={() => setSelectedAgent(null)}
          />
        )}
      </AnimatePresence>

      {/* Deploy wizard modal */}
      <AnimatePresence>
        {showWizard && (
          <DeployWizard
            onClose={() => setShowWizard(false)}
            onDeploy={handleDeploy}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
