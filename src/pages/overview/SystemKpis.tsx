import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FlatProject } from '../projects/types'

// Tiny sparkline — last 12 ticks
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 72, H = 28
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - ((v - min) / range) * H}`)
  return (
    <svg width={W} height={H} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${H} ${pts.join(' ')} ${W},${H}`} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  )
}

interface KpiProps { projects: FlatProject[] }

function seeded(seed: number, offset = 0) {
  const x = Math.sin(seed * 9301 + offset * 49297 + 233) * 10000
  return x - Math.floor(x)
}

export function SystemKpis({ projects }: KpiProps) {
  const navigate = useNavigate()
  const [tick, setTick] = useState(0)
  const [history, setHistory] = useState<number[][]>([[], [], [], [], []])

  // Derived real values from project data
  const totalProjects = projects.length
  const activeIncidents = projects.reduce((s, p) => s + p.investigations, 0)
  const scores = projects.map(p => p.healthScore ?? 100)
  const avgHealth = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 100
  const agentCoverage = Math.round((projects.filter(p => p.agents.length > 0).length / Math.max(1, totalProjects)) * 100)
  const sloRisk = projects.filter(p => {
    if (!p.sloActual || !p.sloTarget) return false
    return parseFloat(p.sloActual) < parseFloat(p.sloTarget)
  }).length

  // Simulated live metrics that subtly tick
  const liveHealth   = Math.max(90, Math.min(100, avgHealth    + (seeded(tick, 0) - 0.5) * 0.06))
  const liveMttd     = Math.max(1.2, 1.8 + (seeded(tick, 1) - 0.5) * 0.2)
  const liveMttr     = Math.max(10, 28  + (seeded(tick, 2) - 0.5) * 4)

  useEffect(() => {
    const id = window.setInterval(() => setTick(t => t + 1), 4000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setHistory(prev => [
      [...prev[0].slice(-11), liveHealth],
      [...prev[1].slice(-11), activeIncidents],
      [...prev[2].slice(-11), liveMttd],
      [...prev[3].slice(-11), liveMttr],
      [...prev[4].slice(-11), agentCoverage],
    ])
  }, [tick]) // eslint-disable-line

  const hColor = liveHealth >= 99 ? '#34d399' : liveHealth >= 95 ? '#fbbf24' : '#f87171'
  const iColor = activeIncidents === 0 ? '#34d399' : activeIncidents <= 2 ? '#fbbf24' : '#f87171'

  const KPIS = [
    {
      label: 'System Health', value: `${liveHealth.toFixed(2)}%`,
      sub: `${totalProjects} services`, color: hColor, spark: 0,
      live: true, onClick: () => navigate('/projects'),
    },
    {
      label: 'Active Incidents', value: String(activeIncidents),
      sub: activeIncidents === 0 ? 'All clear ✓' : `${sloRisk} at SLO risk`,
      color: iColor, spark: 1, live: true, onClick: () => navigate('/investigations'),
    },
    {
      label: 'MTTD', value: `${liveMttd.toFixed(1)}m`,
      sub: 'mean time to detect', color: '#818cf8', spark: 2,
      live: true, onClick: undefined,
    },
    {
      label: 'MTTR', value: `${Math.round(liveMttr)}m`,
      sub: 'AI-assisted resolution', color: '#60a5fa', spark: 3,
      live: true, onClick: undefined,
    },
    {
      label: 'Agent Coverage', value: `${agentCoverage}%`,
      sub: `${projects.filter(p => p.agents.length > 0).length}/${totalProjects} projects`,
      color: '#a78bfa', spark: 4, live: false, onClick: () => navigate('/agents'),
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0.75rem' }}>
      {KPIS.map((kpi, i) => (
        <div key={kpi.label}
          onClick={kpi.onClick}
          style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12,
            padding: '0.75rem 1rem', cursor: kpi.onClick ? 'pointer' : 'default',
            transition: 'border-color 0.15s',
          }}
          onMouseOver={e => { if (kpi.onClick) (e.currentTarget as HTMLDivElement).style.borderColor = kpi.color }}
          onMouseOut={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                <p style={{ fontSize: '0.64rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', margin: 0 }}>{kpi.label}</p>
                {kpi.live && <span style={{ width: 4, height: 4, borderRadius: '50%', background: kpi.color, animation: 'pulse 2s infinite', flexShrink: 0 }} />}
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: 900, color: kpi.color, margin: 0, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>{kpi.sub}</p>
            </div>
            <Sparkline values={history[i]} color={kpi.color} />
          </div>
        </div>
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
