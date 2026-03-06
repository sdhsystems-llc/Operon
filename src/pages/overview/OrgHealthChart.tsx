import { useMemo } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { Org, Domain } from '../projects/types'

interface Props {
  orgs: Org[]
  domains: Record<string, Domain[]>
}

const ORG_META: Record<string, { color: string; dash?: string }> = {
  netflix: { color: '#f87171' },
  stripe:  { color: '#818cf8' },
  vercel:  { color: '#34d399' },
}

// Seeded pseudo-random for stable data across re-renders
function sr(seed: number) {
  const x = Math.sin(seed + 1) * 43758.5453
  return x - Math.floor(x)
}

function genOrgSeries(orgId: string, avgHealth: number, incidents: number): number[] {
  const seed = orgId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return Array.from({ length: 24 }, (_, i) => {
    const noise = (sr(seed * 17 + i) - 0.5) * 0.5
    // Create a dip in the middle of the day if there are incidents
    const dipStart = 10, dipEnd = 15
    const dip = incidents > 0 && i >= dipStart && i <= dipEnd
      ? -incidents * 1.5 * (1 - Math.abs((i - 12.5) / 2.5))
      : 0
    return Math.max(88, Math.min(100, avgHealth + noise + dip))
  })
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.625rem 0.875rem', fontSize: '0.75rem' }}>
      <p style={{ color: 'var(--text-muted)', margin: '0 0 0.375rem' }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.125rem' }}>
          <span style={{ width: 8, height: 2, background: p.color, display: 'inline-block', borderRadius: 1 }} />
          <span style={{ color: p.color, fontWeight: 700 }}>{p.value?.toFixed(2)}%</span>
          <span style={{ color: 'var(--text-muted)' }}>{p.dataKey}</span>
        </div>
      ))}
    </div>
  )
}

export function OrgHealthChart({ orgs, domains }: Props) {
  const { data, orgMeta } = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const h = new Date()
      h.setHours(h.getHours() - (23 - i), 0, 0, 0)
      return h.getHours().toString().padStart(2, '0') + ':00'
    })

    const series: Record<string, number[]> = {}
    const meta: { id: string; name: string; color: string; avgHealth: number }[] = []

    for (const org of orgs) {
      const orgDomains = domains[org.id] ?? []
      const projects = orgDomains.flatMap(d => d.projects)
      const scores = projects.map(p => p.healthScore ?? 100)
      const avgH = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 100
      const incidents = projects.reduce((s, p) => s + p.investigations, 0)
      series[org.name] = genOrgSeries(org.id, avgH, incidents)
      meta.push({ id: org.id, name: org.name, color: ORG_META[org.id]?.color ?? '#818cf8', avgHealth: avgH })
    }

    const chartData = hours.map((h, i) => {
      const pt: Record<string, number | string> = { time: h }
      for (const org of orgs) pt[org.name] = +series[org.name][i].toFixed(2)
      return pt
    })

    return { data: chartData, orgMeta: meta }
  }, [orgs, domains])

  const allValues = data.flatMap(d => orgs.map(o => d[o.name] as number))
  const yMin = Math.floor(Math.min(...allValues) - 0.5)
  const yMax = 100

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '0.75rem 1rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexShrink: 0 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>Organization Health — Last 24h</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.125rem 0 0' }}>Avg health score per org · hourly</p>
        </div>
        <div style={{ display: 'flex', gap: '0.875rem' }}>
          {orgMeta.map(o => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ width: 20, height: 2, background: o.color, display: 'inline-block', borderRadius: 1 }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{o.name}</span>
              <span style={{ fontSize: '0.68rem', color: o.color, fontWeight: 700 }}>{o.avgHealth.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              {orgMeta.map(o => (
                <linearGradient key={o.id} id={`grad-${o.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={o.color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={o.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false}
              interval={3} />
            <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false}
              domain={[yMin, yMax]} tickFormatter={v => `${v}%`} width={42} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
            <ReferenceLine y={99} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" label={{ value: 'SLO 99%', fill: '#374151', fontSize: 9, position: 'insideTopRight' }} />
            {orgMeta.map(o => (
              <Area key={`area-${o.id}`} type="monotone" dataKey={o.name} stroke={o.color}
                strokeWidth={2} fill={`url(#grad-${o.id})`} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
