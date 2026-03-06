import { useEffect, useState } from 'react'
import type { PipelineAgent } from '../../../lib/agentPipeline'

type AgentStatus = 'queued' | 'working' | 'done'

const STATUS_META = {
  queued:  { label: 'QUEUED',  dot: '#374151', bg: '#111318', textColor: '#4b5563' },
  working: { label: 'WORKING', dot: '#fbbf24', bg: '#0d0f14', textColor: '#fbbf24' },
  done:    { label: 'DONE',    dot: '#34d399', bg: '#0d0f14', textColor: '#34d399' },
}

const FINDING_COLORS = {
  critical: { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', text: '#f87171' },
  warning:  { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)',  text: '#fbbf24' },
  ok:       { bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)',  text: '#34d399' },
  info:     { bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.25)', text: '#818cf8' },
}

interface Props {
  agent: PipelineAgent
  status: AgentStatus
  triggerAt: number   // timestamp when this card should start working
}

export function AgentExecCard({ agent, status, triggerAt }: Props) {
  const [pct, setPct] = useState(0)
  const [queryIdx, setQueryIdx] = useState(0)

  // Animate progress bar while working
  useEffect(() => {
    if (status !== 'working') return
    const start = triggerAt
    const end = triggerAt + agent.duration
    const tick = () => {
      const now = Date.now()
      const elapsed = now - start
      const p = Math.min(100, (elapsed / agent.duration) * 100)
      setPct(p)
      if (p < 100) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    // Cycle through queries shown during work
    if (agent.queries.length > 1) {
      const id = window.setInterval(() => setQueryIdx(i => (i + 1) % agent.queries.length), 2200)
      return () => clearInterval(id)
    }
  }, [status]) // eslint-disable-line

  const s = STATUS_META[status]

  return (
    <div style={{
      background: s.bg, border: `1px solid ${status === 'done' ? agent.color + '35' : '#1f2133'}`,
      borderRadius: 12, padding: '0.875rem', transition: 'border-color 0.4s, background 0.4s',
      opacity: status === 'queued' ? 0.45 : 1,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>{agent.icon}</span>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>{agent.name}</p>
            <p style={{ fontSize: '0.62rem', color: '#4b5563', margin: 0 }}>{agent.dataSource}</p>
          </div>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.6rem', fontWeight: 800, color: s.textColor }}>
          {status === 'working' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, animation: 'agPulse 1s infinite' }} />}
          {status === 'done' && <span style={{ fontSize: '0.7rem' }}>✓</span>}
          {s.label}
        </span>
      </div>

      {/* Working state */}
      {status === 'working' && (
        <>
          <div style={{ height: 3, background: '#1f2133', borderRadius: 2, overflow: 'hidden', marginBottom: '0.5rem' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${agent.color}60, ${agent.color})`, borderRadius: 2, transition: 'width 0.3s linear' }} />
          </div>
          <p style={{ fontSize: '0.65rem', color: '#4b5563', margin: 0, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            ▶ {agent.queries[queryIdx % agent.queries.length]}
          </p>
          <p style={{ fontSize: '0.62rem', color: '#374151', margin: '0.25rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {agent.mission}
          </p>
        </>
      )}

      {/* Queued state */}
      {status === 'queued' && (
        <p style={{ fontSize: '0.68rem', color: '#374151', margin: 0 }}>Waiting for dispatch...</p>
      )}

      {/* Done state — findings grid */}
      {status === 'done' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem', marginBottom: '0.5rem' }}>
            {agent.findings.map((f, i) => {
              const c = FINDING_COLORS[f.status]
              return (
                <div key={i} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 6, padding: '0.3rem 0.5rem' }}>
                  <p style={{ fontSize: '0.58rem', color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</p>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: c.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.value}</p>
                  {f.delta && <p style={{ fontSize: '0.55rem', color: c.text, opacity: 0.7, margin: 0 }}>{f.delta}</p>}
                </div>
              )
            })}
          </div>
          <div style={{ borderTop: `1px solid ${agent.color}25`, paddingTop: '0.375rem' }}>
            <p style={{ fontSize: '0.65rem', color: '#9ca3af', margin: 0, lineHeight: 1.4 }}>
              <span style={{ color: agent.color, fontWeight: 700 }}>→ </span>{agent.insight}
            </p>
            <p style={{ fontSize: '0.58rem', color: '#374151', margin: '0.25rem 0 0' }}>{agent.stats}</p>
          </div>
        </>
      )}

      <style>{`@keyframes agPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.5)}}`}</style>
    </div>
  )
}
