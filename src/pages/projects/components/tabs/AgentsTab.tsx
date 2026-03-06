import type { Project } from '../../types'
import { ALL_AGENTS } from '../../mockData'
import { Slab } from '../Slab'

const AGENT_META: Record<string, { icon: string; desc: string; color: string }> = {
  'Operon AI':  { icon: '🤖', desc: 'Root cause analysis, automated investigation triage, and remediation suggestions', color: '#818cf8' },
  'Sentinel':   { icon: '🛡️', desc: 'Continuous health monitoring, anomaly detection, and escalation management', color: '#34d399' },
  'Patcher':    { icon: '🔧', desc: 'Auto-generates fix PRs and config patches based on investigation findings', color: '#fb923c' },
  'Navigator':  { icon: '🧭', desc: 'ML model drift detection, feature pipeline monitoring, and experiment analysis', color: '#22d3ee' },
  'Cortex':     { icon: '🧠', desc: 'Capacity planning, predictive scaling, and infrastructure optimization insights', color: '#f472b6' },
  'Arbiter':    { icon: '⚖️',  desc: 'Change correlation — links incidents to deploys, feature flags, and config changes', color: '#fbbf24' },
}

export function AgentsTab({ project, onUpdate }: { project: Project; onUpdate: (p: Project) => void }) {
  const assigned = project.agents
  const available = ALL_AGENTS.filter(a => !assigned.includes(a))

  const assign = (agent: string) => onUpdate({ ...project, agents: [...assigned, agent] })
  const remove = (agent: string) => onUpdate({ ...project, agents: assigned.filter(a => a !== agent) })

  const AgentCard = ({ name, active }: { name: string; active: boolean }) => {
    const meta = AGENT_META[name] ?? { icon: '🤖', desc: '', color: '#818cf8' }
    return (
      <div style={{ display: 'flex', gap: '0.875rem', padding: '1rem', background: 'var(--bg-base)', borderRadius: 10, border: `1px solid ${active ? `${meta.color}55` : 'var(--border)'}`, alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${meta.color}20`, border: `1px solid ${meta.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
          {meta.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>{name}</p>
            {active && <span style={{ fontSize: '0.68rem', background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}40`, borderRadius: 5, padding: '0.1rem 0.4rem' }}>Assigned</span>}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{meta.desc}</p>
        </div>
        {active
          ? <button onClick={() => remove(name)} style={{ padding: '0.375rem 0.75rem', borderRadius: 7, border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.1)', color: '#f87171', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Remove</button>
          : <button onClick={() => assign(name)} style={{ padding: '0.375rem 0.75rem', borderRadius: 7, border: '1px solid rgba(129,140,248,0.4)', background: 'rgba(129,140,248,0.1)', color: '#818cf8', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Assign</button>
        }
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Slab title="Assigned Agents" subtitle={`${assigned.length} agent${assigned.length !== 1 ? 's' : ''} actively monitoring this project`}>
        {assigned.length === 0
          ? <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>No agents assigned — add one from the list below</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>{assigned.map(a => <AgentCard key={a} name={a} active />)}</div>
        }
      </Slab>
      {available.length > 0 && (
        <Slab title="Available Agents" subtitle="All Operon agents — assign to extend monitoring coverage">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>{available.map(a => <AgentCard key={a} name={a} active={false} />)}</div>
        </Slab>
      )}
    </div>
  )
}
