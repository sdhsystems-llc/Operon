import { useNavigate } from 'react-router-dom'
import type { FlatProject } from '../projects/types'

interface SloRow {
  project: FlatProject
  target: number
  actual: number
  gap: number       // actual - target (negative = at risk)
  burnPct: number   // how much of error budget consumed
}

function parsePct(s?: string): number | null {
  if (!s) return null
  return parseFloat(s.replace('%', ''))
}

interface Props { projects: FlatProject[] }

export function SloRiskPanel({ projects }: Props) {
  const navigate = useNavigate()

  const rows: SloRow[] = projects
    .map(p => {
      const target = parsePct(p.sloTarget)
      const actual = parsePct(p.sloActual)
      if (target == null || actual == null) return null
      const gap = actual - target
      // Error budget: e.g. 99.9% target → 0.1% allowed downtime. If actual=99.76%, consumed (0.1-0.24)/0.1 = -140%
      const allowedError = 100 - target
      const actualError = 100 - actual
      const burnPct = allowedError > 0 ? Math.min(150, (actualError / allowedError) * 100) : 0
      return { project: p, target, actual, gap, burnPct }
    })
    .filter((r): r is SloRow => r !== null)
    .sort((a, b) => a.gap - b.gap) // worst first

  const atRisk = rows.filter(r => r.gap < 0).length
  const healthy = rows.filter(r => r.gap >= 0.2).length

  const rowColor = (gap: number) => {
    if (gap < 0)    return { bar: '#f87171', text: '#f87171', bg: 'rgba(248,113,113,0.08)' }
    if (gap < 0.1)  return { bar: '#fbbf24', text: '#fbbf24', bg: 'rgba(251,191,36,0.08)' }
    return           { bar: '#34d399', text: '#34d399', bg: 'transparent' }
  }

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <div style={{ padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>SLO Tracker</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.125rem 0 0' }}>Error budget consumption · all services</p>
          </div>
          <div style={{ display: 'flex', gap: '0.625rem' }}>
            {atRisk > 0 && <span style={{ fontSize: '0.68rem', fontWeight: 700, background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 20, padding: '0.15rem 0.625rem' }}>⚠ {atRisk} at risk</span>}
            <span style={{ fontSize: '0.68rem', fontWeight: 600, background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 20, padding: '0.15rem 0.625rem' }}>✓ {healthy} healthy</span>
          </div>
        </div>
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {rows.map(row => {
          const c = rowColor(row.gap)
          return (
            <div key={`${row.project.orgId}-${row.project.id}`}
              onClick={() => navigate(`/orgs/${row.project.orgId}/domains/${row.project.domainId}/projects/${row.project.id}`)}
              style={{ padding: '0.625rem 1.125rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: c.bg, transition: 'filter 0.15s' }}
              onMouseOver={e => (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1.15)'}
              onMouseOut={e => (e.currentTarget as HTMLDivElement).style.filter = 'none'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.project.name}</p>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', flexShrink: 0 }}>{row.project.orgName}</span>
                  </div>
                  {/* Error budget bar */}
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: '0.25rem' }}>
                    <div style={{
                      height: '100%', borderRadius: 2, transition: 'width 0.8s ease',
                      width: `${Math.min(100, row.burnPct)}%`,
                      background: row.burnPct >= 100 ? '#f87171' : row.burnPct >= 70 ? '#fbbf24' : '#34d399',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                      Budget burned: <strong style={{ color: c.text }}>{Math.min(150, Math.round(row.burnPct))}%</strong>
                    </span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{row.actual}% / {row.target}%</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 800, color: c.text, margin: 0, lineHeight: 1 }}>
                    {row.gap >= 0 ? '+' : ''}{row.gap.toFixed(2)}pp
                  </p>
                  <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', margin: '0.125rem 0 0' }}>
                    {row.gap < 0 ? 'BREACH' : row.gap < 0.1 ? 'AT RISK' : 'OK'}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        {rows.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No SLO data available</p>}
      </div>
    </div>
  )
}
