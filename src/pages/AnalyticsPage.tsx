import { useState } from 'react'
import {
  TrendingDown, TrendingUp, Clock, AlertTriangle,
  BarChart2, Activity, Zap, Bot, Shield,
} from 'lucide-react'

// ── Mini sparkline ─────────────────────────────────────────────────────────
function Sparkline({ data, color, height = 36 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 120; const h = height
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  const area = `0,${h} ` + pts + ` ${w},${h}`
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Horizontal bar (for Pareto) ────────────────────────────────────────────
function HBar({ label, count, max, color, pct }: { label: string; count: number; max: number; color: string; pct: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', width: 180, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 10, background: 'var(--bg-elevated)', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: color, borderRadius: 5, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', width: 30, textAlign: 'right' }}>{count}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 36, textAlign: 'right' }}>{pct}%</span>
    </div>
  )
}

// ── KPI card ──────────────────────────────────────────────────────────────
function KpiCard({ label, value, unit, delta, deltaLabel, sparkData, color, icon: Icon }: {
  label: string; value: number; unit: string; delta: number; deltaLabel: string
  sparkData: number[]; color: string; icon: any
}) {
  const up = delta > 0
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{unit}</span>
          </div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 17, height: 17, color }} />
        </div>
      </div>
      <Sparkline data={sparkData} color={color} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
        {up
          ? <TrendingUp style={{ width: 12, height: 12, color: '#f87171' }} />
          : <TrendingDown style={{ width: 12, height: 12, color: '#34d399' }} />
        }
        <span style={{ fontSize: 12, fontWeight: 600, color: up ? '#f87171' : '#34d399' }}>{Math.abs(delta)}%</span>
        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{deltaLabel}</span>
      </div>
    </div>
  )
}

// ── MTTR trend bars ────────────────────────────────────────────────────────
function MttrBars({ data }: { data: { week: string; mttr: number; mttd: number }[] }) {
  const maxVal = Math.max(...data.flatMap(d => [d.mttr, d.mttd]))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 96 }}>
            <div style={{ flex: 1, borderRadius: '3px 3px 0 0', background: '#6366f1', height: `${(d.mttr / maxVal) * 96}px`, minHeight: 4, transition: 'height 0.6s ease' }} title={`MTTR: ${d.mttr}m`} />
            <div style={{ flex: 1, borderRadius: '3px 3px 0 0', background: '#f59e0b', height: `${(d.mttd / maxVal) * 96}px`, minHeight: 4, transition: 'height 0.6s ease' }} title={`MTTD: ${d.mttd}m`} />
          </div>
          <span style={{ fontSize: 9.5, color: 'var(--text-muted)', textAlign: 'center' }}>{d.week}</span>
        </div>
      ))}
    </div>
  )
}

// ── Agent efficiency table ─────────────────────────────────────────────────
function AgentRow({ name, type, resolved, avgTime, accuracy, color }: { name: string; type: string; resolved: number; avgTime: string; accuracy: number; color: string }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--hover-overlay)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}>
      <td style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot style={{ width: 13, height: 13, color }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{type}</p>
          </div>
        </div>
      </td>
      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>{resolved}</td>
      <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>{avgTime}</td>
      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
          <div style={{ width: 60, height: 5, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${accuracy}%`, background: accuracy >= 90 ? '#22c55e' : accuracy >= 75 ? '#f59e0b' : '#ef4444', borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{accuracy}%</span>
        </div>
      </td>
    </tr>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d')

  const paretoData = [
    { label: 'Timeout / Connection Pool',   count: 34, color: '#ef4444', pct: 28 },
    { label: 'Deploy Regression',           count: 27, color: '#f97316', pct: 22 },
    { label: 'Dependency / Third-party',    count: 19, color: '#f59e0b', pct: 16 },
    { label: 'Memory Leak / OOM',           count: 14, color: '#eab308', pct: 11 },
    { label: 'Config / Feature Flag',       count: 12, color: '#84cc16', pct: 10 },
    { label: 'DB Schema Migration',         count: 8,  color: '#22c55e', pct: 7 },
    { label: 'Network / DNS',              count: 5,  color: '#14b8a6', pct: 4 },
    { label: 'Other',                       count: 3,  color: '#6366f1', pct: 2 },
  ]

  const mttrTrend = [
    { week: 'W1', mttr: 64, mttd: 28 },
    { week: 'W2', mttr: 57, mttd: 24 },
    { week: 'W3', mttr: 71, mttd: 31 },
    { week: 'W4', mttr: 48, mttd: 19 },
    { week: 'W5', mttr: 42, mttd: 16 },
    { week: 'W6', mttr: 38, mttd: 14 },
    { week: 'W7', mttr: 35, mttd: 12 },
    { week: 'W8', mttr: 29, mttd: 9  },
  ]

  const topServices = [
    { name: 'checkout-service', incidents: 18, p1: 4, resolved: 15 },
    { name: 'payment-gateway',  incidents: 14, p1: 3, resolved: 12 },
    { name: 'product-catalog',  incidents: 11, p1: 1, resolved: 10 },
    { name: 'auth-service',     incidents: 9,  p1: 0, resolved: 9  },
    { name: 'api-gateway',      incidents: 7,  p1: 1, resolved: 6  },
  ]

  const agents = [
    { name: 'Sentinel',  type: 'monitor',       resolved: 47, avgTime: '4.2m', accuracy: 94, color: '#6366f1' },
    { name: 'Arbiter',   type: 'investigator',  resolved: 39, avgTime: '6.8m', accuracy: 91, color: '#f59e0b' },
    { name: 'Navigator', type: 'correlator',    resolved: 31, avgTime: '3.1m', accuracy: 88, color: '#22c55e' },
    { name: 'Cortex',    type: 'remediator',    resolved: 28, avgTime: '8.4m', accuracy: 85, color: '#a78bfa' },
    { name: 'Patcher',   type: 'knowledge',     resolved: 22, avgTime: '2.9m', accuracy: 96, color: '#34d399' },
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div style={{ padding: '24px 28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 style={{ width: 16, height: 16, color: 'var(--accent)' }} />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Analytics</h1>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Incident trends, MTTR/MTTD benchmarks, root cause patterns and agent performance.</p>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['7d', '30d', '90d'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                style={{
                  padding: '6px 12px', borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                  background: range === r ? 'var(--accent-light)' : 'var(--bg-surface)',
                  borderColor: range === r ? 'var(--accent)' : 'var(--border)',
                  color: range === r ? 'var(--accent)' : 'var(--text-secondary)',
                }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          <KpiCard label="MTTR" value={29} unit="min" delta={-38} deltaLabel="vs last period" sparkData={[64,57,71,48,42,38,35,29]} color="#6366f1" icon={Clock} />
          <KpiCard label="MTTD" value={9}  unit="min" delta={-68} deltaLabel="vs last period" sparkData={[28,24,31,19,16,14,12,9]} color="#22c55e" icon={Zap} />
          <KpiCard label="Total Incidents" value={122} unit="" delta={12} deltaLabel="vs last period" sparkData={[14,18,11,16,13,17,15,18]} color="#f59e0b" icon={AlertTriangle} />
          <KpiCard label="AI Resolution Rate" value={78} unit="%" delta={-15} deltaLabel="improvement" sparkData={[52,55,58,61,65,69,74,78]} color="#a78bfa" icon={Bot} />
        </div>

        {/* Row 2: MTTR trend + Top services */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* MTTR / MTTD trend */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>MTTR & MTTD Trend</h2>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Weekly averages (minutes)</p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#6366f1' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>MTTR</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>MTTD</span>
                </div>
              </div>
            </div>
            <MttrBars data={mttrTrend} />
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 7, background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingDown style={{ width: 13, height: 13, color: '#22c55e' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>MTTR improved <strong style={{ color: '#22c55e' }}>38%</strong> over 8 weeks — AI root cause acceleration driving reduction.</span>
            </div>
          </div>

          {/* Top services */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Top Services by Incidents</h2>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 16 }}>Most affected services this period</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topServices.map((s, i) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', width: 16 }}>{i + 1}</span>
                  <code style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, background: 'var(--bg-elevated)', padding: '2px 7px', borderRadius: 4 }}>{s.name}</code>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {s.p1 > 0 && (
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 100, background: 'rgba(239,68,68,.12)', color: '#f87171' }}>{s.p1} P1</span>
                    )}
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{s.incidents}</span>
                    <div style={{ width: 60, height: 5, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(s.resolved / s.incidents) * 100}%`, background: '#22c55e', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 10.5, color: '#34d399' }}>{Math.round((s.resolved / s.incidents) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Pareto + Agent performance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Pareto */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Root Cause Pareto</h2>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 16 }}>
              Top failure categories by incident count — the "vital few" driving most pain
            </p>
            {paretoData.map(d => (
              <HBar key={d.label} label={d.label} count={d.count} max={paretoData[0].count} color={d.color} pct={d.pct} />
            ))}
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 7, background: 'rgba(99,102,241,.05)', border: '1px solid rgba(99,102,241,.15)' }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Top 3 categories</strong> account for <strong style={{ color: 'var(--accent)' }}>66%</strong> of all incidents. Fix timeout/pool configuration and add deploy regression gates to eliminate the majority of pages.
              </p>
            </div>
          </div>

          {/* Agent performance */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Agent Performance</h2>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 14 }}>Resolution count, avg investigation time, and accuracy this period</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Agent', 'Resolved', 'Avg Time', 'Accuracy'].map(h => (
                    <th key={h} style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: h === 'Agent' ? 'left' : 'center', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agents.map(a => <AgentRow key={a.name} {...a} />)}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 4: SLO Health + Learning insights */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
          {/* SLO summary */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>SLO Summary</h2>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 16 }}>Current period burn rates</p>
            {[
              { name: 'checkout-service', target: 99.9, actual: 99.74, risk: true },
              { name: 'payment-gateway',  target: 99.99, actual: 99.97, risk: false },
              { name: 'auth-service',     target: 99.9, actual: 99.92, risk: false },
              { name: 'api-gateway',      target: 99.5, actual: 99.41, risk: true },
              { name: 'product-catalog',  target: 99.5, actual: 99.68, risk: false },
            ].map(s => (
              <div key={s.name} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.risk ? '#f87171' : '#34d399' }}>{s.actual}%</span>
                </div>
                <div style={{ height: 5, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: `${s.target - 98}%`, top: 0, bottom: 0, width: 1, background: 'rgba(99,102,241,.5)', zIndex: 1 }} />
                  <div style={{ height: '100%', width: `${((s.actual - 98) / 2) * 100}%`, background: s.risk ? '#ef4444' : '#22c55e', borderRadius: 3 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Target: {s.target}%</span>
                  {s.risk && <span style={{ fontSize: 10, color: '#f87171', fontWeight: 600 }}>⚠ At risk</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Learning insights */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Bot style={{ width: 16, height: 16, color: 'var(--accent)' }} />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>AI Learning Insights</h2>
              <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: 'rgba(99,102,241,.12)', color: 'var(--accent)', border: '1px solid rgba(99,102,241,.2)' }}>This period</span>
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 16 }}>Patterns learned from {range} of investigations — incorporated into future triage and RCA</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { icon: Shield,   color: '#22c55e', title: 'Noise pattern learned', body: 'Disk I/O alerts on db-replica-* at 02:00–04:00 UTC are always analytics batch jobs. Auto-suppressed going forward.' },
                { icon: Zap,      color: '#6366f1', title: 'Deploy correlation rule', body: 'checkout-service p95 spikes within 15 min of a new deploy have a 91% chance of being deployment-caused. Prioritized in triage.' },
                { icon: Activity, color: '#f59e0b', title: 'Retry storm signature', body: 'Identified retry storm pattern (error rate + latency spike + constant throughput) as a distinct incident class with known remediation.' },
                { icon: TrendingDown, color: '#a78bfa', title: 'Runbook gap closed', body: 'Redis eviction + auth slow queries cluster identified. Runbook added: "Increase memory + set max-memory-policy allkeys-lru."' },
                { icon: Bot,      color: '#34d399', title: 'Agent handoff optimized', body: 'Sentinel → Arbiter handoff for P1s now 40% faster after Sentinel pre-fetches deploy diffs during initial triage.' },
                { icon: Clock,    color: '#fb923c', title: 'MTTD improvement', body: 'Detecting connection pool exhaustion 8 min earlier by monitoring waiting_count metric as a leading indicator (was trailing).' },
              ].map(item => (
                <div key={item.title} style={{ padding: '12px 14px', borderRadius: 9, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <item.icon style={{ width: 12, height: 12, color: item.color }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</span>
                  </div>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
