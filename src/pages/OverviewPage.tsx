import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, TrendingDown, Bot, ArrowRight, Zap } from 'lucide-react'
import { useProjects } from './projects/ProjectsContext'
import { SystemKpis } from './overview/SystemKpis'
import { OrgHealthChart } from './overview/OrgHealthChart'
import { ServiceHealthMap } from './overview/ServiceHealthMap'
import { SloRiskPanel } from './overview/SloRiskPanel'
import { LiveActivityStream } from './overview/LiveActivityStream'
import { AgentActivityPanel } from './overview/AgentActivityPanel'
import { LiveIncidentFeed } from './overview/LiveIncidentFeed'

// ── Inline Alert Triage Widget ─────────────────────────────────────────────
function AlertTriageWidget() {
  const navigate = useNavigate()
  const items = [
    { severity: 'p1', title: 'p95 latency > 2s on checkout-service', status: 'escalated', statusColor: '#f87171', ago: '4m ago', source: '🐕' },
    { severity: 'p1', title: 'Payment gateway timeout spike',          status: 'escalated', statusColor: '#f87171', ago: '7m ago', source: '📟' },
    { severity: 'p2', title: 'Redis memory usage > 90%',              status: 'real',      statusColor: '#fbbf24', ago: '12m ago', source: '☁️' },
    { severity: 'p3', title: 'Disk I/O threshold — db-replica-3',     status: 'noise',     statusColor: '#64748b', ago: '25m ago', source: '📊' },
    { severity: 'p2', title: '5xx error rate on api-gateway',         status: 'auto-resolved', statusColor: '#34d399', ago: '31m ago', source: '🔦' },
  ]
  const sevColor: Record<string, string> = { p1: '#f87171', p2: '#fb923c', p3: '#fbbf24', p4: '#818cf8' }
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell style={{ width: 14, height: 14, color: '#f87171' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Alert Triage</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 100, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)', color: '#34d399' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', animation: 'ovPulse 2s infinite' }} />Live
          </span>
        </div>
        <button onClick={() => navigate('/alerts')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          View all <ArrowRight style={{ width: 11, height: 11 }} />
        </button>
      </div>
      <div>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
            onClick={() => navigate('/alerts')}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--hover-overlay)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}>
            <span style={{ fontSize: 14 }}>{item.source}</span>
            <span style={{ fontSize: 10.5, fontWeight: 800, padding: '1px 5px', borderRadius: 100, background: `${sevColor[item.severity]}15`, color: sevColor[item.severity], flexShrink: 0 }}>{item.severity.toUpperCase()}</span>
            <p style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: item.statusColor, flexShrink: 0 }}>{item.status}</span>
            <span style={{ fontSize: 10.5, color: 'var(--text-muted)', flexShrink: 0 }}>{item.ago}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 16 }}>
        {[['2', 'escalated', '#f87171'], ['1', 'processing', '#818cf8'], ['2', 'noise filtered', '#64748b']].map(([count, label, color]) => (
          <span key={label} style={{ fontSize: 11, color: color as string }}>
            <strong>{count}</strong> {label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── AI Learning Feed Widget ────────────────────────────────────────────────
function LearningFeedWidget() {
  const navigate = useNavigate()
  const items = [
    { icon: '🔇', title: 'Noise pattern auto-suppressed',     body: 'Disk I/O alerts on db-replica-* at 02:00–04:00 UTC are now automatically suppressed — identified as analytics batch jobs.', time: '2h ago',  color: '#22c55e' },
    { icon: '⚡', title: 'New correlation rule learned',       body: 'checkout-service p95 spikes within 15 min of deploy → 91% probability it\'s deploy-caused. Now pre-ranked in triage.', time: '6h ago',  color: '#818cf8' },
    { icon: '📖', title: 'Runbook gap closed',                 body: 'Redis eviction + auth slow query cluster now has a saved runbook: increase memory + set max-memory-policy allkeys-lru.', time: '1d ago',  color: '#fbbf24' },
    { icon: '🚀', title: 'Agent handoff optimized',           body: 'Sentinel → Arbiter handoff for P1s is now 40% faster. Sentinel pre-fetches deploy diffs during initial triage.', time: '2d ago',  color: '#34d399' },
  ]
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bot style={{ width: 14, height: 14, color: 'var(--accent)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>AI Learning Feed</span>
        </div>
        <button onClick={() => navigate('/analytics')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Analytics <ArrowRight style={{ width: 11, height: 11 }} />
        </button>
      </div>
      <div>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 16px', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: item.color }}>{item.title}</p>
                <span style={{ fontSize: 10.5, color: 'var(--text-muted)', flexShrink: 0 }}>{item.time}</span>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const OverviewPage = () => {
  const { orgs, domains, getAllProjects } = useProjects()
  const projects = getAllProjects()

  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const activeIncidents = projects.reduce((s, p) => s + p.investigations, 0)

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-base)' }}>
      <div style={{ padding: '1rem 1.25rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Platform Overview
            </h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>
              {orgs.length} orgs · {domains ? Object.values(domains).flat().length : 0} domains · {projects.length} services
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeIncidents > 0 ? '#f87171' : '#34d399', animation: 'ovPulse 2s infinite' }} />
              <span style={{ fontSize: '0.7rem', color: activeIncidents > 0 ? '#f87171' : '#34d399', fontWeight: 700 }}>
                {activeIncidents > 0 ? `${activeIncidents} active incident${activeIncidents > 1 ? 's' : ''}` : 'All systems operational'}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
              {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>

        {/* ── Row 1: KPI cards ── */}
        <SystemKpis projects={projects} />

        {/* ── Row 2: Org Health Chart + SLO Risk + Agent Panel ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px 260px', gap: '0.75rem', height: 260 }}>
          <OrgHealthChart orgs={orgs} domains={domains} />
          <SloRiskPanel projects={projects} />
          <AgentActivityPanel />
        </div>

        {/* ── Row 3: Service Health Map + Live Activity ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '0.75rem', height: 300 }}>
          <ServiceHealthMap projects={projects} />
          <LiveActivityStream projects={projects} />
        </div>

        {/* ── Row 4: Alert Triage Widget + AI Learning Feed ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '0.75rem' }}>
          <AlertTriageWidget />
          <LearningFeedWidget />
        </div>

        {/* ── Row 5: Incident Feed (capped height) ── */}
        <div style={{ maxHeight: 280, overflow: 'hidden', borderRadius: 14 }}>
          <LiveIncidentFeed />
        </div>

      </div>
      <style>{`@keyframes ovPulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
    </div>
  )
}
