import { useEffect, useRef, useState } from 'react'
import type { Pipeline } from '../../lib/agentPipeline'
import { AgentExecCard } from './pipeline/AgentExecCard'
import { InvestigationReport } from './pipeline/InvestigationReport'

// ── Phase definitions (order matters) ────────────────────────────────────────
const PHASES = ['intake', 'orchestration', 'context', 'dispatch', 'execution', 'correlation', 'hypothesis', 'impact', 'report'] as const
type Phase = typeof PHASES[number]

const PHASE_PROGRESS: Record<Phase, number> = {
  intake: 10, orchestration: 22, context: 34, dispatch: 44,
  execution: 72, correlation: 82, hypothesis: 89, impact: 94, report: 100,
}

const PHASE_META: Record<Phase, { icon: string; label: string; color: string }> = {
  intake:        { icon: '📥', label: 'INTAKE',        color: '#818cf8' },
  orchestration: { icon: '🎯', label: 'ORCHESTRATION', color: '#a78bfa' },
  context:       { icon: '🔍', label: 'CONTEXT LOAD',  color: '#60a5fa' },
  dispatch:      { icon: '⚡', label: 'AGENT DISPATCH', color: '#fbbf24' },
  execution:     { icon: '🤖', label: 'EXECUTION',     color: '#34d399' },
  correlation:   { icon: '🔗', label: 'CORRELATION',   color: '#22d3ee' },
  hypothesis:    { icon: '💡', label: 'HYPOTHESIS',    color: '#f472b6' },
  impact:        { icon: '💥', label: 'IMPACT',        color: '#fb923c' },
  report:        { icon: '📋', label: 'REPORT',        color: '#34d399' },
}

// ── Collapsed Phase Summary ───────────────────────────────────────────────────
function CollapsedPhase({ phase, summary }: { phase: Phase; summary: string }) {
  const m = PHASE_META[phase]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.375rem 0', borderBottom: '1px solid #1a1d27' }}>
      <span style={{ fontSize: '0.75rem', width: 18, textAlign: 'center', flexShrink: 0 }}>{m.icon}</span>
      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: m.color, minWidth: 90, letterSpacing: '0.05em' }}>{m.label}</span>
      <span style={{ fontSize: '0.62rem', color: '#374151' }}>·</span>
      <span style={{ fontSize: '0.68rem', color: '#6b7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary}</span>
      <span style={{ fontSize: '0.65rem', color: '#34d399', flexShrink: 0 }}>✓</span>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
interface Props {
  pipeline: Pipeline
  onComplete: (summary: string) => void
  onFollowUp?: (text: string) => void
}

export function InvestigationPipeline({ pipeline, onComplete, onFollowUp }: Props) {
  const [activePhase, setActivePhase] = useState<Phase>('intake')
  const [donePhases, setDonePhases] = useState<Phase[]>([])
  const [progress, setProgress] = useState(0)
  const [eta, setEta] = useState(14)
  const [collapsed, setCollapsed] = useState(false)
  const [agentStatus, setAgentStatus] = useState<Record<string, 'queued' | 'working' | 'done'>>(() =>
    Object.fromEntries(pipeline.agents.map(a => [a.id, 'queued']))
  )
  const [agentStartTime, setAgentStartTime] = useState<Record<string, number>>({})
  const [completedCount, setCompletedCount] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const etaTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const markDone = (phase: Phase, next: Phase | null) => {
    setDonePhases(p => [...p, phase])
    if (next) setActivePhase(next)
    setProgress(PHASE_PROGRESS[phase])
  }

  const DISPATCH_END = 3400 // ms when dispatch phase finishes

  useEffect(() => {
    const t = timers.current

    // ETA countdown
    etaTimer.current = setInterval(() => setEta(e => Math.max(0, e - 1)), 1000)

    // ── INTAKE (immediate) ──
    setActivePhase('intake')
    setProgress(4)
    t.push(setTimeout(() => markDone('intake', 'orchestration'), 600))

    // ── ORCHESTRATION (600ms) ──
    t.push(setTimeout(() => markDone('orchestration', 'context'), 2000))

    // ── CONTEXT LOAD (2000ms) ──
    t.push(setTimeout(() => markDone('context', 'dispatch'), 3000))

    // ── DISPATCH (3000ms) ──
    t.push(setTimeout(() => markDone('dispatch', 'execution'), DISPATCH_END))

    // ── EXECUTION: stagger agent starts ──
    let lastAgentDone = DISPATCH_END
    pipeline.agents.forEach((agent, i) => {
      const start = DISPATCH_END + agent.startOffset
      const done = start + agent.duration
      if (done > lastAgentDone) lastAgentDone = done

      t.push(setTimeout(() => {
        setAgentStatus(prev => ({ ...prev, [agent.id]: 'working' }))
        setAgentStartTime(prev => ({ ...prev, [agent.id]: Date.now() }))
      }, start))

      t.push(setTimeout(() => {
        setAgentStatus(prev => ({ ...prev, [agent.id]: 'done' }))
        setCompletedCount(c => c + 1)
      }, done))
    })

    // ── CORRELATION (after all agents done) ──
    const corrStart = lastAgentDone + 500
    t.push(setTimeout(() => markDone('execution', 'correlation'), corrStart))
    t.push(setTimeout(() => markDone('correlation', 'hypothesis'), corrStart + 1200))

    // ── HYPOTHESIS ──
    t.push(setTimeout(() => markDone('hypothesis', 'impact'), corrStart + 2000))

    // ── IMPACT ──
    t.push(setTimeout(() => markDone('impact', 'report'), corrStart + 2600))

    // ── REPORT ──
    t.push(setTimeout(() => {
      setDonePhases(p => [...p, 'report'])
      setActivePhase('report')
      setProgress(100)
      if (etaTimer.current) clearInterval(etaTimer.current)
      setEta(0)
      const summary = `## ${pipeline.report.headline}\n\n**Root Cause (${pipeline.report.confidence}% confidence):** ${pipeline.report.rootCause}\n\n${pipeline.report.summary}\n\n**Actions:**\n${pipeline.report.actions.map(a => `- [${a.done ? '✓' : a.priority.toUpperCase()}] ${a.label}`).join('\n')}`
      onComplete(summary)
    }, corrStart + 3400))

    return () => {
      t.forEach(clearTimeout)
      if (etaTimer.current) clearInterval(etaTimer.current)
    }
  }, []) // eslint-disable-line

  const isDone = (p: Phase) => donePhases.includes(p)
  const totalAgents = pipeline.agents.length
  const isComplete = isDone('report')

  // Auto-collapse steps the moment the report appears
  useEffect(() => {
    if (isComplete) setCollapsed(true)
  }, [isComplete])

  const PHASE_SUMMARIES: Record<Phase, string> = {
    intake:        `${pipeline.intent.service} · ${pipeline.intent.org} · ${pipeline.intent.timeWindow}`,
    orchestration: `${pipeline.intent.type} · ${pipeline.intent.confidence}% confidence · ${pipeline.intent.severityEstimate.toUpperCase()}`,
    context:       `${pipeline.context.length} context items loaded · ${pipeline.context.filter(c => c.flag).length} flagged`,
    dispatch:      `${totalAgents} specialist agents spawned`,
    execution:     `${completedCount}/${totalAgents} agents completed · evidence collected`,
    correlation:   `${pipeline.correlation.sourcesCount} sources · ${pipeline.correlation.quality} evidence`,
    hypothesis:    `${pipeline.hypotheses[0]?.text.slice(0, 55)}… (${pipeline.hypotheses[0]?.probability}%)`,
    impact:        `${pipeline.impact.services.join(', ')}${pipeline.impact.users ? ` · ${pipeline.impact.users}` : ''}`,
    report:        pipeline.report.headline,
  }

  // ── The pipeline steps section (live while running, collapsible when done) ──
  const pipelineSteps = (
    <div style={{ background: '#0d1117', border: '1px solid #1f2133', borderRadius: 10, overflow: 'hidden', marginBottom: '0.5rem' }}>
      <div style={{ padding: '0.75rem 0.875rem' }}>
        {/* Completed phases */}
        {PHASES.filter(p => p !== 'execution' && p !== 'report' && isDone(p)).map(p => (
          <CollapsedPhase key={p} phase={p} summary={PHASE_SUMMARIES[p]} />
        ))}

        {/* INTAKE active */}
        {activePhase === 'intake' && !isDone('intake') && (
          <ActivePhaseBlock phase="intake" title="Request received" loading>
            <p style={infoStyle}>Routing to Orchestration Agent...</p>
            <p style={{ ...infoStyle, color: '#6366f1', fontFamily: 'monospace', marginTop: 4 }}>"{pipeline.intent.service}" · {pipeline.intent.org} · {pipeline.intent.timeWindow}</p>
          </ActivePhaseBlock>
        )}

        {/* ORCHESTRATION active */}
        {activePhase === 'orchestration' && !isDone('orchestration') && (
          <ActivePhaseBlock phase="orchestration" title="Orchestration Agent analyzing intent" loading>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: 6 }}>
              <Chip label="Type" value={pipeline.intent.type} color="#818cf8" />
              <Chip label="Service" value={pipeline.intent.service} color="#60a5fa" />
              <Chip label="Org" value={pipeline.intent.org} color="#22d3ee" />
              <Chip label="Confidence" value={`${pipeline.intent.confidence}%`} color="#34d399" />
              <Chip label="Severity Est." value={pipeline.intent.severityEstimate.toUpperCase()} color="#fb923c" />
            </div>
          </ActivePhaseBlock>
        )}

        {/* CONTEXT active */}
        {activePhase === 'context' && !isDone('context') && (
          <ActivePhaseBlock phase="context" title="Loading service context & telemetry baseline" loading>
            {pipeline.context.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0' }}>
                <span style={{ fontSize: '0.75rem', flexShrink: 0 }}>{c.icon}</span>
                <span style={{ fontSize: '0.68rem', color: '#6b7280', minWidth: 90 }}>{c.label}</span>
                <span style={{ fontSize: '0.68rem', color: c.flag ? '#fbbf24' : '#9ca3af' }}>{c.value}</span>
                {c.flag && <span style={{ fontSize: '0.6rem', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 4, padding: '0.05rem 0.35rem' }}>FLAGGED</span>}
              </div>
            ))}
          </ActivePhaseBlock>
        )}

        {/* DISPATCH active */}
        {activePhase === 'dispatch' && !isDone('dispatch') && (
          <ActivePhaseBlock phase="dispatch" title={`Spawning ${totalAgents} specialist agents`} loading>
            {pipeline.agents.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.25rem 0', borderBottom: '1px solid #1a1d27' }}>
                <span style={{ fontSize: '0.9rem' }}>{a.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: a.color }}>{a.name}</span>
                  <span style={{ fontSize: '0.65rem', color: '#4b5563', marginLeft: '0.5rem' }}>→ {a.mission}</span>
                </div>
                <span style={{ fontSize: '0.62rem', color: '#374151' }}>{a.dataSource}</span>
              </div>
            ))}
          </ActivePhaseBlock>
        )}

        {/* EXECUTION collapsed */}
        {isDone('execution') && <CollapsedPhase phase="execution" summary={PHASE_SUMMARIES.execution} />}

        {/* EXECUTION active */}
        {(activePhase === 'execution' || (!isDone('execution') && donePhases.includes('dispatch'))) && !isDone('execution') && (
          <ActivePhaseBlock phase="execution" title={`${completedCount}/${totalAgents} agents working`} loading={completedCount < totalAgents}>
            <div style={{ display: 'grid', gridTemplateColumns: totalAgents === 1 ? '1fr' : '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
              {pipeline.agents.map(a => (
                <AgentExecCard key={a.id} agent={a} status={agentStatus[a.id]} triggerAt={agentStartTime[a.id] ?? 0} />
              ))}
            </div>
          </ActivePhaseBlock>
        )}

        {/* CORRELATION active */}
        {activePhase === 'correlation' && !isDone('correlation') && (
          <ActivePhaseBlock phase="correlation" title="Correlating evidence across all agents" loading>
            {pipeline.correlation.crossRefs.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.25rem 0' }}>
                <span style={{ color: '#34d399', fontSize: '0.75rem', flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{r}</span>
              </div>
            ))}
            <div style={{ marginTop: 8, display: 'flex', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: pipeline.correlation.quality === 'STRONG' ? '#34d399' : '#fbbf24', background: pipeline.correlation.quality === 'STRONG' ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)', padding: '0.15rem 0.5rem', borderRadius: 4 }}>
                {pipeline.correlation.quality} EVIDENCE
              </span>
              <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>{pipeline.correlation.sourcesCount} independent sources confirmed</span>
            </div>
          </ActivePhaseBlock>
        )}

        {/* HYPOTHESIS active */}
        {activePhase === 'hypothesis' && !isDone('hypothesis') && (
          <ActivePhaseBlock phase="hypothesis" title="Hypothesis Agent — ranked root causes">
            {pipeline.hypotheses.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.3rem 0', borderBottom: '1px solid #1a1d27' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: i === 0 ? '#f472b6' : '#374151', minWidth: 28, textAlign: 'right' }}>{h.probability}%</span>
                <div style={{ flex: 1, height: 4, background: '#1f2133', borderRadius: 2, overflow: 'hidden', maxWidth: 60 }}>
                  <div style={{ height: '100%', width: `${h.probability}%`, background: i === 0 ? '#f472b6' : '#374151', borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: '0.7rem', color: i === 0 ? '#d1d5db' : '#4b5563', flex: 1 }}>{h.text}</span>
                {i === 0 && <span style={{ fontSize: '0.6rem', color: '#f472b6', fontWeight: 700 }}>SELECTED</span>}
              </div>
            ))}
          </ActivePhaseBlock>
        )}

        {/* IMPACT active */}
        {activePhase === 'impact' && !isDone('impact') && (
          <ActivePhaseBlock phase="impact" title="Assessing blast radius and SLO impact">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: 6 }}>
              {pipeline.impact.services.map((s, i) => <Chip key={i} label={i === 0 ? 'Primary' : 'Downstream'} value={s} color={i === 0 ? '#fb923c' : '#6b7280'} />)}
              {pipeline.impact.users && <Chip label="Users" value={pipeline.impact.users} color="#f87171" />}
              {pipeline.impact.revenue && <Chip label="Revenue" value={pipeline.impact.revenue} color="#fbbf24" />}
              {pipeline.impact.sloGap && <Chip label="SLO" value={pipeline.impact.sloGap} color={pipeline.impact.sloBreached ? '#f87171' : '#fbbf24'} />}
            </div>
          </ActivePhaseBlock>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ flex: 1, minWidth: 0 }}>

      {/* ── While running: live progress bar ── */}
      {!isComplete && (
        <div style={{ background: '#111318', border: '1px solid #1f2133', borderRadius: 10, padding: '0.5rem 0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: 3, background: '#1f2133', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #22d3ee)', borderRadius: 2, transition: 'width 0.8s ease' }} />
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#818cf8', minWidth: 28 }}>{progress}%</span>
          <span style={{ fontSize: '0.6rem', color: '#374151' }}>·</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.62rem', color: '#34d399' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', animation: 'ipPulse 1.5s infinite' }} />
            ~{eta}s remaining
          </span>
          <span style={{ fontSize: '0.6rem', color: '#374151' }}>·</span>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: PHASE_META[activePhase].color }}>
            {PHASE_META[activePhase].icon} {PHASE_META[activePhase].label}
          </span>
        </div>
      )}

      {/* ── While running: pipeline steps always visible ── */}
      {!isComplete && pipelineSteps}

      {/* ── When done: collapsible steps toggle ── */}
      {isComplete && (
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
            background: '#111318', border: '1px solid #1f2133', borderRadius: collapsed ? 8 : '8px 8px 0 0',
            padding: '0.4rem 0.75rem', cursor: 'pointer', marginBottom: collapsed ? '0.5rem' : 0,
            transition: 'background 0.15s', userSelect: 'none',
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#161821')}
          onMouseOut={e => (e.currentTarget.style.background = '#111318')}
        >
          <span style={{ fontSize: '0.7rem' }}>📋</span>
          <span style={{ fontSize: '0.68rem', color: '#6b7280', flex: 1, textAlign: 'left' }}>
            {donePhases.filter(p => p !== 'report').length} investigation phases · {totalAgents} agents · {pipeline.correlation.quality} evidence
          </span>
          <span style={{ fontSize: '0.68rem', color: '#4b5563' }}>{collapsed ? 'View steps' : 'Hide steps'}</span>
          <span style={{ fontSize: '0.8rem', color: '#374151', display: 'inline-block', transition: 'transform 0.2s', transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}>▾</span>
        </button>
      )}

      {/* ── Collapsible pipeline steps (only when done) ── */}
      {isComplete && (
        <div style={{
          overflow: 'hidden',
          maxHeight: collapsed ? 0 : 2000,
          opacity: collapsed ? 0 : 1,
          transition: 'max-height 0.35s ease, opacity 0.25s ease',
          marginBottom: collapsed ? 0 : '0.5rem',
        }}>
          <div style={{ border: '1px solid #1f2133', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
            {pipelineSteps}
          </div>
        </div>
      )}

      {/* ── Final report — always visible once complete, outside collapsible ── */}
      {isComplete && <InvestigationReport report={pipeline.report} onFollowUp={onFollowUp} />}

      <style>{`
        @keyframes ipPulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes ipSpin{to{transform:rotate(360deg)}}
        @keyframes ipFadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
      `}</style>
    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────
const infoStyle: React.CSSProperties = { fontSize: '0.72rem', color: '#6b7280', margin: 0 }

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: color + '15', border: `1px solid ${color}35`, borderRadius: 6, padding: '0.2rem 0.5rem' }}>
      <span style={{ fontSize: '0.58rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label} </span>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color }}>{value}</span>
    </div>
  )
}

function ActivePhaseBlock({ phase, title, loading = false, children }: {
  phase: Phase; title: string; loading?: boolean; children: React.ReactNode
}) {
  const m = PHASE_META[phase]
  return (
    <div style={{ padding: '0.625rem 0', animation: 'ipFadeUp 0.25s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
        <span style={{ fontSize: '0.85rem' }}>{m.icon}</span>
        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: m.color, letterSpacing: '0.06em' }}>{m.label}</span>
        <span style={{ fontSize: '0.65rem', color: '#6b7280', flex: 1 }}>· {title}</span>
        {loading && <span style={{ width: 10, height: 10, border: `2px solid ${m.color}40`, borderTopColor: m.color, borderRadius: '50%', animation: 'ipSpin 0.8s linear infinite', flexShrink: 0 }} />}
      </div>
      <div style={{ paddingLeft: '1.5rem' }}>{children}</div>
    </div>
  )
}
