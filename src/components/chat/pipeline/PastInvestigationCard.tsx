import { useState } from 'react'
import type { Pipeline } from '../../../lib/agentPipeline'
import { InvestigationReport } from './InvestigationReport'

const SEV_META = {
  critical: { color: '#f87171', bg: 'rgba(248,113,113,0.08)', icon: '🔴' },
  high:     { color: '#fb923c', bg: 'rgba(251,146,60,0.07)',  icon: '🟠' },
  medium:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.07)',  icon: '🟡' },
  low:      { color: '#34d399', bg: 'rgba(52,211,153,0.07)',  icon: '🟢' },
  healthy:  { color: '#34d399', bg: 'rgba(52,211,153,0.07)',  icon: '✅' },
}

const PHASE_ICONS: Record<string, string> = {
  intake: '📥', orchestration: '🎯', context: '🔍', dispatch: '⚡',
  execution: '🤖', correlation: '🔗', hypothesis: '💡', impact: '💥',
}
const PHASE_COLORS: Record<string, string> = {
  intake: '#818cf8', orchestration: '#a78bfa', context: '#60a5fa', dispatch: '#fbbf24',
  execution: '#34d399', correlation: '#22d3ee', hypothesis: '#f472b6', impact: '#fb923c',
}

interface Props {
  pipeline: Pipeline
  onFollowUp?: (text: string) => void
}

export function PastInvestigationCard({ pipeline, onFollowUp }: Props) {
  const [stepsOpen, setStepsOpen] = useState(false)
  const sev = SEV_META[pipeline.report.severity]
  const totalPhases = 8 // intake → impact (excluding 'report')

  // Static phase summaries for the expandable view
  const summaries = [
    { key: 'intake',        label: 'INTAKE',        summary: `${pipeline.intent.service} · ${pipeline.intent.org} · ${pipeline.intent.timeWindow}` },
    { key: 'orchestration', label: 'ORCHESTRATION', summary: `${pipeline.intent.type} · ${pipeline.intent.confidence}% confidence · ${pipeline.intent.severityEstimate.toUpperCase()}` },
    { key: 'context',       label: 'CONTEXT LOAD',  summary: `${pipeline.context.length} context items loaded · ${pipeline.context.filter(c => c.flag).length} flagged` },
    { key: 'dispatch',      label: 'AGENT DISPATCH',summary: `${pipeline.agents.length} specialist agents spawned` },
    { key: 'execution',     label: 'EXECUTION',     summary: `${pipeline.agents.length}/${pipeline.agents.length} agents completed · evidence collected` },
    { key: 'correlation',   label: 'CORRELATION',   summary: `${pipeline.correlation.sourcesCount} sources · ${pipeline.correlation.quality} evidence` },
    { key: 'hypothesis',    label: 'HYPOTHESIS',    summary: `${pipeline.hypotheses[0]?.text.slice(0, 58)}… (${pipeline.hypotheses[0]?.probability}%)` },
    { key: 'impact',        label: 'IMPACT',        summary: `${pipeline.impact.services.join(', ')}${pipeline.impact.users ? ` · ${pipeline.impact.users}` : ''}` },
  ]

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* ── Steps toggle ── */}
      <button
        onClick={() => setStepsOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
          background: '#111318', border: '1px solid #1f2133',
          borderRadius: stepsOpen ? '8px 8px 0 0' : 8,
          padding: '0.4rem 0.75rem', cursor: 'pointer', marginBottom: stepsOpen ? 0 : '0.5rem',
          userSelect: 'none', transition: 'background 0.15s',
        }}
        onMouseOver={e => (e.currentTarget.style.background = '#161821')}
        onMouseOut={e => (e.currentTarget.style.background = '#111318')}
      >
        <span style={{ fontSize: '0.7rem' }}>📋</span>
        <span style={{ fontSize: '0.68rem', color: '#6b7280', flex: 1, textAlign: 'left' }}>
          {totalPhases} investigation phases · {pipeline.agents.length} agents · {pipeline.correlation.quality} evidence
        </span>
        <span style={{ fontSize: '0.68rem', color: '#4b5563' }}>{stepsOpen ? 'Hide steps' : 'View steps'}</span>
        <span style={{
          fontSize: '0.8rem', color: '#374151',
          display: 'inline-block', transition: 'transform 0.2s',
          transform: stepsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>▾</span>
      </button>

      {/* ── Expandable steps (static, no animation) ── */}
      <div style={{
        overflow: 'hidden',
        maxHeight: stepsOpen ? 1200 : 0,
        opacity: stepsOpen ? 1 : 0,
        transition: 'max-height 0.35s ease, opacity 0.25s ease',
        marginBottom: stepsOpen ? '0.5rem' : 0,
      }}>
        <div style={{ background: '#0d1117', border: '1px solid #1f2133', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '0.625rem 0.875rem' }}>
          {summaries.map(s => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.35rem 0', borderBottom: '1px solid #1a1d27' }}>
              <span style={{ fontSize: '0.75rem', width: 18, textAlign: 'center', flexShrink: 0 }}>{PHASE_ICONS[s.key]}</span>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: PHASE_COLORS[s.key], minWidth: 90, letterSpacing: '0.05em' }}>{s.label}</span>
              <span style={{ fontSize: '0.62rem', color: '#374151' }}>·</span>
              <span style={{ fontSize: '0.68rem', color: '#6b7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.summary}</span>
              <span style={{ fontSize: '0.65rem', color: '#34d399', flexShrink: 0 }}>✓</span>
            </div>
          ))}

          {/* Agent details */}
          <div style={{ marginTop: '0.5rem' }}>
            <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.375rem' }}>Agent findings</p>
            <div style={{ display: 'grid', gridTemplateColumns: pipeline.agents.length === 1 ? '1fr' : '1fr 1fr', gap: '0.375rem' }}>
              {pipeline.agents.map(a => (
                <div key={a.id} style={{ background: '#111318', border: `1px solid ${a.color}30`, borderRadius: 8, padding: '0.5rem 0.625rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem' }}>{a.icon}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: a.color }}>{a.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: '#34d399', fontWeight: 700 }}>✓ DONE</span>
                  </div>
                  <p style={{ fontSize: '0.65rem', color: '#9ca3af', margin: '0 0 0.25rem', lineHeight: 1.4 }}>{a.insight}</p>
                  <p style={{ fontSize: '0.58rem', color: '#374151', margin: 0 }}>{a.stats}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Final report — always visible ── */}
      <InvestigationReport report={pipeline.report} onFollowUp={onFollowUp} />
    </div>
  )
}
