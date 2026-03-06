import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FlatProject } from '../projects/types'

interface StreamEvent {
  id: string
  kind: 'incident' | 'deploy' | 'agent' | 'resolved' | 'alert'
  project: string
  org: string
  label: string
  time: string
  orgId: string
  domainId: string
  projectId: string
}

const KIND_META = {
  incident: { icon: '🔴', color: '#f87171', bg: 'rgba(248,113,113,0.1)', label: 'INCIDENT' },
  deploy:   { icon: '🚀', color: '#34d399', bg: 'rgba(52,211,153,0.1)',  label: 'DEPLOY'  },
  agent:    { icon: '🤖', color: '#818cf8', bg: 'rgba(129,140,248,0.1)', label: 'AGENT'   },
  resolved: { icon: '✅', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  label: 'RESOLVED'},
  alert:    { icon: '⚠️', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  label: 'ALERT'   },
}

// Simulated live events that appear periodically
const LIVE_EVENTS = [
  { label: 'Sentinel: P99 latency normalized — billing-service queue draining', kind: 'resolved' as const, project: 'Billing Service', org: 'Netflix', orgId: 'netflix', domainId: 'consumer-products', projectId: 'billing-service' },
  { label: 'Cortex scaled recommendation feature store replica +2 nodes', kind: 'agent' as const, project: 'Recommendation Engine', org: 'Netflix', orgId: 'netflix', domainId: 'data-science', projectId: 'recommendation-engine' },
  { label: 'Deploy chg-902 — Charges API: improved 3DS retry logic', kind: 'deploy' as const, project: 'Charges API', org: 'Stripe', orgId: 'stripe', domainId: 'core-payments', projectId: 'charges-api' },
  { label: 'Arbiter: TLS cert auto-rotated on api.stripe.com (eu-central-1)', kind: 'agent' as const, project: 'API Gateway', org: 'Stripe', orgId: 'stripe', domainId: 'developer-platform', projectId: 'api-gateway-stripe' },
  { label: 'Deploy edge-v2.9.1 — Edge Runtime: V8 isolate memory limit tuning', kind: 'deploy' as const, project: 'Edge Functions Runtime', org: 'Vercel', orgId: 'vercel', domainId: 'edge-network', projectId: 'edge-functions' },
  { label: 'Sentinel: CDN Router APAC cache hit ratio recovering → 97.4%', kind: 'resolved' as const, project: 'CDN Router', org: 'Vercel', orgId: 'vercel', domainId: 'edge-network', projectId: 'cdn-router' },
  { label: 'Navigator: Radar fraud model scoring drift detected — within threshold', kind: 'alert' as const, project: 'Radar Engine', org: 'Stripe', orgId: 'stripe', domainId: 'risk-fraud', projectId: 'radar-engine' },
]

let liveIdx = 0

interface Props { projects: FlatProject[] }

export function LiveActivityStream({ projects }: Props) {
  const navigate = useNavigate()

  // Build initial events from project recentActivity
  const initial: StreamEvent[] = projects
    .flatMap(p =>
      (p.recentActivity ?? []).slice(0, 2).map(a => ({
        id: a.id,
        kind: a.kind,
        project: p.name,
        org: p.orgName,
        label: a.label,
        time: a.time,
        orgId: p.orgId,
        domainId: p.domainId,
        projectId: p.id,
      }))
    )
    .slice(0, 14)

  const [events, setEvents] = useState<StreamEvent[]>(initial)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())

  // Inject a new live event every 7s
  useEffect(() => {
    const id = window.setInterval(() => {
      const ev = LIVE_EVENTS[liveIdx % LIVE_EVENTS.length]
      liveIdx++
      const newEvent: StreamEvent = {
        id: `live-${Date.now()}`,
        ...ev,
        time: 'just now',
      }
      setEvents(prev => [newEvent, ...prev.slice(0, 19)])
      setNewIds(prev => new Set([...prev, newEvent.id]))
      setTimeout(() => setNewIds(prev => { const n = new Set(prev); n.delete(newEvent.id); return n }), 2000)
    }, 7000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>Live Activity Stream</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.125rem 0 0' }}>Real-time events across all organizations</p>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.68rem', color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 20, padding: '0.2rem 0.625rem', fontWeight: 600 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', animation: 'streamPulse 1.5s infinite' }} />
          Live
        </span>
      </div>

      {/* Events */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {events.map(ev => {
          const m = KIND_META[ev.kind] ?? KIND_META.alert
          const isNew = newIds.has(ev.id)
          return (
            <div key={ev.id}
              onClick={() => navigate(`/orgs/${ev.orgId}/domains/${ev.domainId}/projects/${ev.projectId}`)}
              style={{
                display: 'flex', gap: '0.75rem', padding: '0.625rem 1.125rem',
                borderBottom: '1px solid var(--border)', cursor: 'pointer',
                background: isNew ? m.bg : 'transparent',
                transition: 'background 1.5s ease',
              }}
              onMouseOver={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'}
              onMouseOut={e => (e.currentTarget as HTMLDivElement).style.background = isNew ? m.bg : 'transparent'}
            >
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', paddingTop: 2 }}>
                <span style={{ fontSize: '0.875rem' }}>{m.icon}</span>
                <span style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 1 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, background: m.bg, color: m.color, borderRadius: 4, padding: '0.1rem 0.375rem' }}>{m.label}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>{ev.project}</span>
                  <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)' }}>·</span>
                  <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)' }}>{ev.org}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.label}</p>
              </div>
              <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', flexShrink: 0, paddingTop: 2 }}>{ev.time}</span>
            </div>
          )
        })}
      </div>
      <style>{`@keyframes streamPulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
