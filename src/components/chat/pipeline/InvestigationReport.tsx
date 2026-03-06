import type { PipelineReport, Severity } from '../../../lib/agentPipeline'

const SEV_META: Record<Severity, { label: string; color: string; bg: string; border: string; icon: string }> = {
  critical: { label: 'CRITICAL', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.35)', icon: '🔴' },
  high:     { label: 'HIGH',     color: '#fb923c', bg: 'rgba(251,146,60,0.10)',  border: 'rgba(251,146,60,0.30)',  icon: '🟠' },
  medium:   { label: 'MEDIUM',   color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.30)',  icon: '🟡' },
  low:      { label: 'LOW',      color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.25)',  icon: '🟢' },
  healthy:  { label: 'HEALTHY',  color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.25)',  icon: '✅' },
}

const ACTION_META = {
  urgent:  { icon: '🔴', color: '#f87171', label: 'URGENT' },
  monitor: { icon: '🟡', color: '#fbbf24', label: 'MONITOR' },
  done:    { icon: '✅', color: '#34d399', label: 'DONE' },
  info:    { icon: '📌', color: '#818cf8', label: 'INFO' },
}

function ConfidenceBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 4, background: '#1f2133', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: '0.72rem', fontWeight: 800, color, minWidth: 36 }}>{pct}%</span>
    </div>
  )
}

interface Props {
  report: PipelineReport
  onFollowUp?: (text: string) => void
}

export function InvestigationReport({ report, onFollowUp }: Props) {
  const s = SEV_META[report.severity]

  return (
    <div style={{ background: '#0d0f14', border: `1px solid ${s.border}`, borderRadius: 14, overflow: 'hidden', marginTop: '0.5rem' }}>
      {/* Top severity banner */}
      <div style={{ background: s.bg, borderBottom: `1px solid ${s.border}`, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 900, background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 4, padding: '0.15rem 0.5rem', letterSpacing: '0.08em' }}>{s.label}</span>
            <span style={{ fontSize: '0.62rem', color: '#6b7280', fontWeight: 600 }}>INVESTIGATION COMPLETE</span>
            <span style={{ fontSize: '0.62rem', color: '#374151' }}>·</span>
            <span style={{ fontSize: '0.62rem', color: '#374151' }}>Operon AI</span>
          </div>
          <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: '0.25rem 0 0', lineHeight: 1.3 }}>{report.headline}</p>
        </div>
      </div>

      <div style={{ padding: '1rem' }}>
        {/* Root cause + confidence */}
        <div style={{ marginBottom: '0.875rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#4b5563', margin: '0 0 0.375rem' }}>Root Cause</p>
          <p style={{ fontSize: '0.8rem', color: '#d1d5db', margin: '0 0 0.5rem', lineHeight: 1.5 }}>{report.rootCause}</p>
          <ConfidenceBar pct={report.confidence} color={s.color} />
        </div>

        {/* Timeline */}
        {report.timeline && (
          <div style={{ marginBottom: '0.875rem', padding: '0.625rem 0.75rem', background: '#111318', border: '1px solid #1f2133', borderRadius: 8 }}>
            <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4b5563', margin: '0 0 0.25rem' }}>Timeline</p>
            <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: 0, lineHeight: 1.5, fontFamily: 'monospace' }}>{report.timeline}</p>
          </div>
        )}

        {/* Summary */}
        <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '0 0 0.875rem', lineHeight: 1.55 }}>{report.summary}</p>

        {/* Actions */}
        <div style={{ marginBottom: '0.875rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#4b5563', margin: '0 0 0.375rem' }}>Action Plan</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {report.actions.map((a, i) => {
              const m = ACTION_META[a.priority]
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.5rem 0.625rem', background: a.done ? 'rgba(52,211,153,0.04)' : '#111318', border: '1px solid #1f2133', borderRadius: 8, opacity: a.done ? 0.65 : 1 }}>
                  <span style={{ fontSize: '0.8rem', flexShrink: 0, marginTop: 1 }}>{m.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.75rem', color: a.done ? '#6b7280' : '#d1d5db', margin: 0, textDecoration: a.done ? 'line-through' : 'none', lineHeight: 1.4 }}>{a.label}</p>
                  </div>
                  <span style={{ fontSize: '0.58rem', fontWeight: 700, color: m.color, flexShrink: 0, paddingTop: 2 }}>{m.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Follow-up suggestions */}
        {report.followUps && report.followUps.length > 0 && onFollowUp && (
          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#4b5563', margin: '0 0 0.375rem' }}>Ask Follow-Up</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {report.followUps.map((f, i) => (
                <button key={i} onClick={() => onFollowUp(f)} style={{ fontSize: '0.72rem', padding: '0.3rem 0.75rem', borderRadius: 20, border: '1px solid #1f2133', background: '#111318', color: '#9ca3af', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = s.color + '60'; e.currentTarget.style.color = '#fff' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#1f2133'; e.currentTarget.style.color = '#9ca3af' }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
