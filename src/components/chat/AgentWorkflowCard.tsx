import { useEffect, useState, useRef } from 'react'
import type { Workflow, AgentTask, FindingStatus, Severity } from '../../lib/agentWorkflows'

// ─── Styles + constants ───────────────────────────────────────────────────────
const STATUS_COLOR: Record<FindingStatus, { bg: string; text: string; border: string }> = {
  critical: { bg: 'rgba(248,113,113,0.12)', text: '#f87171', border: 'rgba(248,113,113,0.3)' },
  warning:  { bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  ok:       { bg: 'rgba(52,211,153,0.12)',  text: '#34d399', border: 'rgba(52,211,153,0.3)' },
  info:     { bg: 'rgba(129,140,248,0.12)', text: '#a5b4fc', border: 'rgba(129,140,248,0.25)' },
}

const SEVERITY_META: Record<Severity, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'P1 Critical',  color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.35)' },
  high:     { label: 'P2 High',      color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.35)'  },
  medium:   { label: 'P3 Medium',    color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.35)'  },
  low:      { label: 'Low',          color: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.3)'  },
  healthy:  { label: '✓ Healthy',    color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.3)'   },
}

type AgentStatus = 'idle' | 'working' | 'done'
interface LiveTask extends AgentTask { status: AgentStatus; progress: number }

// ─── Finding Chip ─────────────────────────────────────────────────────────────
function FindingChip({ label, value, status, delta, delay }: {
  label: string; value: string; status: FindingStatus; delta?: string; delay: number
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t) }, [delay])
  const s = STATUS_COLOR[status]
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
      padding: '0.5rem 0.625rem', transition: 'opacity 0.3s, transform 0.3s',
      opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(4px)',
    }}>
      <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 0.125rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: '0.82rem', fontWeight: 800, color: s.text, margin: 0, lineHeight: 1.2 }}>{value}</p>
      {delta && <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', margin: '0.125rem 0 0' }}>{delta}</p>}
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ color, active }: { color: string; active: boolean }) {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    if (!active) return
    const start = Date.now()
    const duration = 1200
    const id = window.setInterval(() => {
      const elapsed = Date.now() - start
      setPct(Math.min(90, (elapsed / duration) * 90))
      if (elapsed >= duration) clearInterval(id)
    }, 40)
    return () => clearInterval(id)
  }, [active])

  return (
    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginTop: '0.5rem' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.1s linear', boxShadow: `0 0 6px ${color}` }} />
    </div>
  )
}

// ─── Single Agent Card ────────────────────────────────────────────────────────
function AgentCard({ task, visible }: { task: LiveTask; visible: boolean }) {
  return (
    <div style={{
      background: '#161821', border: `1px solid ${task.status === 'done' ? `${task.agentColor}30` : '#1f2133'}`,
      borderRadius: 14, overflow: 'hidden', transition: 'all 0.3s ease',
      opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(8px)',
    }}>
      {/* Card Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.7rem 0.875rem', borderBottom: '1px solid #1f2133', background: task.status === 'done' ? `${task.agentColor}0d` : 'transparent' }}>
        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{task.agentIcon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '0.8rem', color: task.agentColor, margin: 0, lineHeight: 1.2 }}>{task.agentName}</p>
          <p style={{ fontSize: '0.65rem', color: '#4b5563', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.taskLabel}</p>
        </div>
        {task.status === 'working' && (
          <span style={{ fontSize: '0.65rem', color: task.agentColor, display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: task.agentColor, animation: 'pulseDot 1.2s infinite' }} />
            Working
          </span>
        )}
        {task.status === 'done' && (
          <span style={{ fontSize: '0.65rem', color: '#34d399', flexShrink: 0, fontWeight: 600 }}>✓ Done</span>
        )}
      </div>

      {/* Working state */}
      {task.status === 'working' && (
        <div style={{ padding: '0.75rem 0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>Querying</span>
            <span style={{ fontSize: '0.65rem', color: '#6b7280', background: '#1f2937', borderRadius: 4, padding: '0.1rem 0.375rem', fontFamily: 'monospace' }}>{task.dataSource}</span>
          </div>
          <ProgressBar color={task.agentColor} active />
          <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.625rem' }}>
            {[0, 1, 2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: task.agentColor, opacity: 0.5, animation: `bounceDot 0.9s infinite ${i * 0.15}s` }} />)}
          </div>
        </div>
      )}

      {/* Done state: findings grid + insight */}
      {task.status === 'done' && (
        <div style={{ padding: '0.75rem 0.875rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', marginBottom: '0.625rem' }}>
            {task.findings.map((f, i) => (
              <FindingChip key={f.label} {...f} delay={i * 80} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.04)', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.72rem', flexShrink: 0, marginTop: 1 }}>💡</span>
            <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>{task.insight}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Synthesis Card ───────────────────────────────────────────────────────────
function SynthesisCard({ synthesis, sources, visible }: {
  synthesis: Workflow['synthesis']; sources: string[]; visible: boolean
}) {
  const sev = SEVERITY_META[synthesis.severity]
  const PRIORITY_STYLE = {
    urgent:  { icon: '🔴', color: '#f87171' },
    monitor: { icon: '🟡', color: '#fbbf24' },
    done:    { icon: '✅', color: '#34d399' },
    info:    { icon: '📌', color: '#818cf8' },
  }

  return (
    <div style={{
      border: `1px solid ${sev.border}`, borderRadius: 14, overflow: 'hidden',
      background: sev.bg, transition: 'all 0.4s ease',
      opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(10px)',
    }}>
      {/* Header */}
      <div style={{ padding: '0.875rem 1rem', borderBottom: `1px solid ${sev.border}`, display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.125rem', marginTop: 1 }}>✨</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', margin: 0 }}>{synthesis.headline}</p>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`, borderRadius: 20, padding: '0.15rem 0.625rem' }}>{sev.label}</span>
          </div>
          <p style={{ fontSize: '0.65rem', color: '#4b5563', margin: 0 }}>Operon AI · Final Analysis</p>
        </div>
        {synthesis.eta && (
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <p style={{ fontSize: '0.6rem', color: '#4b5563', margin: '0 0 0.125rem' }}>ETA</p>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: sev.color, margin: 0, whiteSpace: 'nowrap' }}>{synthesis.eta}</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div style={{ padding: '0.875rem 1rem', borderBottom: `1px solid ${sev.border}` }}>
        <p style={{ fontSize: '0.8rem', color: '#d1d5db', margin: 0, lineHeight: 1.65 }}>{synthesis.summary}</p>
      </div>

      {/* Action Items */}
      <div style={{ padding: '0.75rem 1rem' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.5rem' }}>Actions</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {synthesis.actions.map((a, i) => {
            const ps = PRIORITY_STYLE[a.priority]
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.5rem 0.625rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '0.8rem', flexShrink: 0, marginTop: 1 }}>{ps.icon}</span>
                <p style={{ fontSize: '0.78rem', color: a.done ? '#6b7280' : '#d1d5db', margin: 0, lineHeight: 1.45, textDecoration: a.done ? 'line-through' : 'none' }}>{a.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sources */}
      {sources.length > 0 && (
        <div style={{ padding: '0.5rem 1rem', borderTop: `1px solid ${sev.border}`, display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.6rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Sources</span>
          {sources.map(s => <span key={s} style={{ fontSize: '0.65rem', color: '#6b7280', background: '#1a1d26', border: '1px solid #1f2133', borderRadius: 20, padding: '0.1rem 0.5rem' }}>{s}</span>)}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props { workflow: Workflow; onComplete: (synthesis: string) => void }

export function AgentWorkflowCard({ workflow, onComplete }: Props) {
  const [planVisible, setPlanVisible] = useState(false)
  const [planItemCount, setPlanItemCount] = useState(0)
  const [tasks, setTasks] = useState<LiveTask[]>(workflow.tasks.map(t => ({ ...t, status: 'idle' as AgentStatus, progress: 0 })))
  const [agentsVisible, setAgentsVisible] = useState<boolean[]>(workflow.tasks.map(() => false))
  const [showSynthesis, setShowSynthesis] = useState(false)
  const completeCalled = useRef(false)
  const isMounted = useRef(true)

  useEffect(() => { isMounted.current = true; return () => { isMounted.current = false } }, [])

  // ── Phase 1: Plan reveal ──
  useEffect(() => {
    const t = setTimeout(() => {
      if (!isMounted.current) return
      setPlanVisible(true)
      workflow.planItems.forEach((_, i) => {
        setTimeout(() => { if (isMounted.current) setPlanItemCount(c => Math.max(c, i + 1)) }, i * 250 + 200)
      })
    }, 300)
    return () => clearTimeout(t)
  }, [workflow.planItems])

  // ── Phase 2: Sequential agents after plan done ──
  useEffect(() => {
    if (planItemCount < workflow.planItems.length) return
    const timers: number[] = []
    let elapsed = 400

    workflow.tasks.forEach((task, idx) => {
      // Show card
      timers.push(window.setTimeout(() => {
        if (!isMounted.current) return
        setAgentsVisible(prev => { const n = [...prev]; n[idx] = true; return n })
        setTasks(prev => prev.map((t, i) => i === idx ? { ...t, status: 'working' } : t))
      }, elapsed))
      elapsed += task.duration

      // Flip to done
      timers.push(window.setTimeout(() => {
        if (!isMounted.current) return
        setTasks(prev => prev.map((t, i) => i === idx ? { ...t, status: 'done' } : t))
      }, elapsed))
      elapsed += 400
    })

    // Synthesis
    timers.push(window.setTimeout(() => {
      if (!isMounted.current) return
      setShowSynthesis(true)
      if (!completeCalled.current) {
        completeCalled.current = true
        setTimeout(() => { if (isMounted.current) onComplete(workflow.synthesis.summary) }, 600)
      }
    }, elapsed + 300))

    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planItemCount, workflow.planItems.length])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: 720 }}>

      {/* Planning Card */}
      {planVisible && (
        <div style={{ background: '#161821', border: '1px solid #1f2133', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.875rem', borderBottom: '1px solid #1f2133', background: 'rgba(99,102,241,0.06)' }}>
            <span style={{ fontSize: '0.75rem' }}>📋</span>
            <p style={{ fontWeight: 700, fontSize: '0.78rem', color: '#a5b4fc', margin: 0, flex: 1 }}>Operon AI — Planning</p>
            {planItemCount >= workflow.planItems.length
              ? <span style={{ fontSize: '0.62rem', color: '#34d399', fontWeight: 600 }}>✓ Ready · {workflow.tasks.length} agents dispatched</span>
              : <span style={{ fontSize: '0.62rem', color: '#6366f1', animation: 'pulseDot 1.5s infinite' }}>Analyzing...</span>}
          </div>
          <div style={{ padding: '0.625rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {workflow.planItems.slice(0, planItemCount).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'fadeUp 0.25s ease' }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: planItemCount >= workflow.planItems.length ? 'rgba(52,211,153,0.15)' : 'rgba(99,102,241,0.15)', border: `1px solid ${planItemCount >= workflow.planItems.length ? 'rgba(52,211,153,0.3)' : 'rgba(99,102,241,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', color: planItemCount >= workflow.planItems.length ? '#34d399' : '#a5b4fc', flexShrink: 0, fontWeight: 700 }}>
                  {planItemCount >= workflow.planItems.length ? '✓' : i + 1}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Cards — 2 column grid */}
      {tasks.some((_, i) => agentsVisible[i]) && (
        <div style={{ display: 'grid', gridTemplateColumns: workflow.tasks.length === 1 ? '1fr' : 'repeat(2,1fr)', gap: '0.625rem' }}>
          {tasks.map((task, i) => (
            agentsVisible[i]
              ? <AgentCard key={task.id} task={task} visible={agentsVisible[i]} />
              : null
          ))}
        </div>
      )}

      {/* Synthesis Card */}
      {showSynthesis && (
        <SynthesisCard synthesis={workflow.synthesis} sources={workflow.sources} visible={showSynthesis} />
      )}

      <style>{`
        @keyframes fadeUp    { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
        @keyframes pulseDot  { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes bounceDot { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      `}</style>
    </div>
  )
}
