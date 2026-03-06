import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, CheckCircle2, XCircle, Zap, Clock, Filter,
  RefreshCw, ArrowRight, Bot, Activity, Cpu, Shield,
  TrendingUp, Bell, X, ChevronDown, Eye,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────
type AlertStatus = 'processing' | 'noise' | 'real' | 'auto-resolved' | 'escalated'
type Severity = 'p1' | 'p2' | 'p3' | 'p4'

interface TriageAlert {
  id: string
  title: string
  service: string
  source: string
  sourceLogo: string
  severity: Severity
  status: AlertStatus
  receivedAt: string
  triageMs: number
  noiseScore: number       // 0–100, higher = more likely noise
  businessImpact: string
  affectedUsers?: number
  correlatedAlerts: number
  investId?: string
  triageSteps: string[]
  triageComplete: boolean
}

// ── Mock Data ──────────────────────────────────────────────────────────────
const now = Date.now()
const ago = (m: number) => new Date(now - m * 60_000).toISOString()

const MOCK_ALERTS: TriageAlert[] = [
  {
    id: 'alrt-001', title: 'p95 latency > 2s on checkout-service',
    service: 'checkout-service', source: 'Datadog', sourceLogo: '🐕',
    severity: 'p1', status: 'escalated', receivedAt: ago(4),
    triageMs: 8200, noiseScore: 5, businessImpact: 'Revenue-critical — ~$4,200/min impact',
    affectedUsers: 14800, correlatedAlerts: 7, investId: 'inv-001',
    triageSteps: ['Ingested alert payload', 'Queried Datadog metrics (p95, error rate)', 'Correlated 7 related alerts', 'Checked recent deploys (v2.4.1 — 12 min ago)', 'Confirmed revenue impact via business metrics', 'Escalated → Created Investigation inv-001'],
    triageComplete: true,
  },
  {
    id: 'alrt-002', title: 'Payment gateway response time spike',
    service: 'payment-gateway', source: 'PagerDuty', sourceLogo: '📟',
    severity: 'p1', status: 'escalated', receivedAt: ago(7),
    triageMs: 6100, noiseScore: 8, businessImpact: 'Payment failures — ~$8,500/min impact',
    affectedUsers: 3200, correlatedAlerts: 4, investId: 'inv-002',
    triageSteps: ['Received PagerDuty webhook', 'Pulled Stripe API health metrics', 'Identified retry storm pattern', 'Correlated with downstream checkout errors', 'Escalated → Created Investigation inv-002'],
    triageComplete: true,
  },
  {
    id: 'alrt-003', title: 'Redis memory usage > 90%',
    service: 'redis-cache', source: 'AWS CloudWatch', sourceLogo: '☁️',
    severity: 'p2', status: 'real', receivedAt: ago(12),
    triageMs: 4300, noiseScore: 22, businessImpact: 'Session cache degradation — 8% of users affected',
    affectedUsers: 2100, correlatedAlerts: 2, investId: 'inv-004',
    triageSteps: ['Received CloudWatch alarm', 'Queried Redis metrics (memory, eviction rate)', 'Identified key eviction pattern', 'Linked to auth-service slow queries', 'Classified as real incident'],
    triageComplete: true,
  },
  {
    id: 'alrt-004', title: 'CPU spike on product-catalog (pod restart loop)',
    service: 'product-catalog', source: 'Datadog', sourceLogo: '🐕',
    severity: 'p2', status: 'real', receivedAt: ago(18),
    triageMs: 5700, noiseScore: 15, businessImpact: 'Catalog API degraded — product listing failures',
    affectedUsers: 5600, correlatedAlerts: 3,
    triageSteps: ['Alert ingested', 'Queried k8s pod events', 'Found OOMKilled restarts — 6 in last 30 min', 'Identified memory leak in v3.1.2 deploy', 'Classified as real incident'],
    triageComplete: true,
  },
  {
    id: 'alrt-005', title: 'Disk I/O threshold exceeded on db-replica-3',
    service: 'postgres-replica', source: 'Grafana', sourceLogo: '📊',
    severity: 'p3', status: 'noise', receivedAt: ago(25),
    triageMs: 2100, noiseScore: 88,
    businessImpact: 'No business impact detected — routine analytics batch job',
    correlatedAlerts: 0,
    triageSteps: ['Alert ingested', 'Queried disk I/O metrics (last 7 days)', 'Pattern matches weekly analytics job schedule', 'No service degradation detected', 'Classified as noise → suppressed'],
    triageComplete: true,
  },
  {
    id: 'alrt-006', title: '5xx error rate increase on api-gateway',
    service: 'api-gateway', source: 'Splunk', sourceLogo: '🔦',
    severity: 'p2', status: 'auto-resolved', receivedAt: ago(31),
    triageMs: 3400, noiseScore: 45,
    businessImpact: 'Transient — resolved by auto-scaling within 2.4 min',
    correlatedAlerts: 1,
    triageSteps: ['Alert ingested', 'Queried Splunk logs for 5xx patterns', 'Correlated with traffic spike (2.1x normal)', 'Auto-scaling triggered and resolved', 'Marked auto-resolved — no investigation needed'],
    triageComplete: true,
  },
  {
    id: 'alrt-007', title: 'Auth token validation latency degraded',
    service: 'auth-service', source: 'PagerDuty', sourceLogo: '📟',
    severity: 'p3', status: 'noise', receivedAt: ago(40),
    triageMs: 1900, noiseScore: 82,
    businessImpact: 'No user impact — degraded to single AZ, redundancy maintained',
    correlatedAlerts: 0,
    triageSteps: ['Alert ingested', 'Checked auth-service health across AZs', 'us-east-1a degraded but us-east-1b/c healthy', 'Load balancer routing correctly around degraded AZ', 'Classified as noise — no action required'],
    triageComplete: true,
  },
  {
    id: 'alrt-008', title: 'ML recommendation engine CTR drop — 18%',
    service: 'recommendation-engine', source: 'Datadog', sourceLogo: '🐕',
    severity: 'p2', status: 'processing', receivedAt: ago(1),
    triageMs: 0, noiseScore: 0,
    businessImpact: 'Analyzing...',
    correlatedAlerts: 0,
    triageSteps: ['Alert ingested', 'Querying recommendation model metrics...'],
    triageComplete: false,
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────
const SEV: Record<Severity, { label: string; bg: string; text: string; dot: string }> = {
  p1: { label: 'P1', bg: 'rgba(239,68,68,.12)',   text: '#f87171', dot: '#ef4444' },
  p2: { label: 'P2', bg: 'rgba(251,146,60,.12)',  text: '#fb923c', dot: '#f97316' },
  p3: { label: 'P3', bg: 'rgba(251,191,36,.12)',  text: '#fbbf24', dot: '#f59e0b' },
  p4: { label: 'P4', bg: 'rgba(99,102,241,.12)',  text: '#818cf8', dot: '#6366f1' },
}

const STATUS_CFG: Record<AlertStatus, { label: string; icon: any; bg: string; text: string }> = {
  processing:    { label: 'AI Triaging',    icon: Cpu,            bg: 'rgba(99,102,241,.12)',  text: '#818cf8' },
  noise:         { label: 'Noise',          icon: XCircle,        bg: 'rgba(100,116,139,.12)', text: '#94a3b8' },
  real:          { label: 'Real Incident',  icon: AlertTriangle,  bg: 'rgba(245,158,11,.12)',  text: '#fbbf24' },
  'auto-resolved': { label: 'Auto-Resolved', icon: CheckCircle2, bg: 'rgba(16,185,129,.12)',  text: '#34d399' },
  escalated:     { label: 'Escalated',      icon: ArrowRight,     bg: 'rgba(239,68,68,.12)',   text: '#f87171' },
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff}m ago`
  return `${Math.floor(diff / 60)}h ago`
}

// ── Processing animation ───────────────────────────────────────────────────
function ProcessingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: '50%', background: '#818cf8',
          animation: `triageDot 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </span>
  )
}

// ── Triage Steps Panel ────────────────────────────────────────────────────
function TriageSteps({ alert, open }: { alert: TriageAlert; open: boolean }) {
  if (!open) return null
  return (
    <div style={{
      margin: '0 0 0 0', padding: '12px 16px',
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-base)',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
        AI Triage Steps
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {alert.triageSteps.map((step, i) => {
          const isLast = i === alert.triageSteps.length - 1
          const isProcessing = !alert.triageComplete && isLast
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                background: isProcessing ? 'rgba(99,102,241,.15)' : 'rgba(16,185,129,.12)',
                border: `1px solid ${isProcessing ? 'rgba(99,102,241,.3)' : 'rgba(16,185,129,.25)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isProcessing
                  ? <Cpu style={{ width: 9, height: 9, color: '#818cf8' }} />
                  : <CheckCircle2 style={{ width: 10, height: 10, color: '#34d399' }} />
                }
              </div>
              <span style={{ fontSize: 12.5, color: isProcessing ? '#818cf8' : 'var(--text-secondary)', lineHeight: 1.5 }}>
                {step}{isProcessing && <> <ProcessingDots /></>}
              </span>
            </div>
          )
        })}
      </div>
      {alert.triageComplete && (
        <div style={{ marginTop: 10, padding: '6px 10px', borderRadius: 6, background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)' }}>
          <p style={{ fontSize: 11.5, color: '#34d399' }}>
            ✓ Triage completed in {(alert.triageMs / 1000).toFixed(1)}s
          </p>
        </div>
      )}
    </div>
  )
}

// ── Alert Row ─────────────────────────────────────────────────────────────
function AlertRow({ alert, onViewInvestigation }: { alert: TriageAlert; onViewInvestigation: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const sev = SEV[alert.severity]
  const st = STATUS_CFG[alert.status]
  const StatusIcon = st.icon

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 10,
      overflow: 'hidden',
      background: alert.status === 'escalated' ? 'rgba(239,68,68,.02)' : 'var(--bg-surface)',
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
        onClick={() => setExpanded(v => !v)}>

        {/* Source logo */}
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
        }}>{alert.sourceLogo}</div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: sev.bg, color: sev.text }}>
              {sev.label}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: st.bg, color: st.text }}>
              <StatusIcon style={{ width: 11, height: 11 }} />
              {st.label}
              {alert.status === 'processing' && <ProcessingDots />}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{alert.source}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>·</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(alert.receivedAt)}</span>
          </div>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {alert.title}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {alert.businessImpact}
          </p>
        </div>

        {/* Right side stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          {alert.affectedUsers != null && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{alert.affectedUsers.toLocaleString()}</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>users</p>
            </div>
          )}
          {alert.correlatedAlerts > 0 && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{alert.correlatedAlerts}</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>correlated</p>
            </div>
          )}
          {alert.triageComplete && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{(alert.triageMs / 1000).toFixed(1)}s</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>triage</p>
            </div>
          )}

          {/* Noise bar */}
          {alert.triageComplete && alert.status !== 'processing' && (
            <div style={{ width: 72 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>noise</span>
                <span style={{ fontSize: 9.5, color: alert.noiseScore > 60 ? '#94a3b8' : '#f87171' }}>{alert.noiseScore}%</span>
              </div>
              <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${alert.noiseScore}%`, borderRadius: 2, background: alert.noiseScore > 60 ? '#475569' : '#ef4444', transition: 'width 0.6s' }} />
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6 }}>
            {alert.investId && (
              <button onClick={e => { e.stopPropagation(); onViewInvestigation(alert.investId!) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6,
                  background: 'var(--accent-light)', border: '1px solid rgba(99,102,241,.25)', color: 'var(--accent)',
                  fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                }}>
                <Eye style={{ width: 11, height: 11 }} /> View
              </button>
            )}
            <button onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
              style={{
                display: 'flex', alignItems: 'center', padding: '5px 8px', borderRadius: 6,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)',
                fontSize: 11, cursor: 'pointer',
              }}>
              <ChevronDown style={{ width: 13, height: 13, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
          </div>
        </div>
      </div>

      <TriageSteps alert={alert} open={expanded} />
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub: string; color: string }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12,
      padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 18, height: 18, color }} />
      </div>
      <div>
        <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{label}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</p>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AlertTriagePage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | AlertStatus>('all')
  const [alerts, setAlerts] = useState<TriageAlert[]>(MOCK_ALERTS)
  const [live, setLive] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Simulate incoming alert finishing triage
  useEffect(() => {
    if (!live) return
    const processing = alerts.find(a => a.status === 'processing')
    if (!processing) return
    timerRef.current = setTimeout(() => {
      setAlerts(prev => prev.map(a => a.id === processing.id
        ? { ...a, status: 'real', triageMs: 7300, noiseScore: 18, businessImpact: 'CTR drop 18% — recommendation engine degraded, ~3,200 users affected', affectedUsers: 3200, correlatedAlerts: 2, triageSteps: [...a.triageSteps, 'Queried recommendation model metrics (CTR, precision)', 'Correlated with Flink pipeline latency spike', 'Identified stale feature store causing model staleness', 'Classified as real incident — creating investigation'], triageComplete: true }
        : a
      ))
    }, 6000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [alerts, live])

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.status === filter)

  const real = alerts.filter(a => a.status === 'real' || a.status === 'escalated').length
  const noise = alerts.filter(a => a.status === 'noise').length
  const autoRes = alerts.filter(a => a.status === 'auto-resolved').length
  const avgTriage = Math.round(alerts.filter(a => a.triageMs > 0).reduce((s, a) => s + a.triageMs, 0) / alerts.filter(a => a.triageMs > 0).length / 100) / 10

  const filterBtns: { key: 'all' | AlertStatus; label: string; count: number }[] = [
    { key: 'all',           label: 'All',           count: alerts.length },
    { key: 'escalated',     label: 'Escalated',     count: alerts.filter(a => a.status === 'escalated').length },
    { key: 'real',          label: 'Real Incidents', count: alerts.filter(a => a.status === 'real').length },
    { key: 'noise',         label: 'Noise',          count: noise },
    { key: 'auto-resolved', label: 'Auto-Resolved',  count: autoRes },
    { key: 'processing',    label: 'Processing',     count: alerts.filter(a => a.status === 'processing').length },
  ]

  return (
    <div className="h-full overflow-y-auto">
      <style>{`
        @keyframes triageDot { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
        @keyframes triagePulse { 0%,100%{opacity:.6} 50%{opacity:1} }
      `}</style>

      <div style={{ padding: '24px 28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell style={{ width: 16, height: 16, color: '#f87171' }} />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Alert Triage</h1>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)', color: '#34d399' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'triagePulse 2s ease-in-out infinite' }} />
                Live
              </span>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
              AI triages every alert — correlates signals, filters noise, and escalates real incidents before your team starts looking.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setLive(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: live ? 'var(--accent-light)' : 'var(--bg-surface)', color: live ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <RefreshCw style={{ width: 13, height: 13 }} /> {live ? 'Live' : 'Paused'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          <StatCard icon={Bell}        label="Total Alerts"    value={alerts.length}  sub="last 2 hours"           color="#818cf8" />
          <StatCard icon={AlertTriangle} label="Real Incidents" value={real}           sub="escalated to investigation" color="#f87171" />
          <StatCard icon={X}           label="Noise Filtered"  value={noise}          sub={`${Math.round(noise / alerts.length * 100)}% noise rate`} color="#94a3b8" />
          <StatCard icon={Zap}         label="Avg Triage Time" value={`${avgTriage}s`} sub="from alert to classification" color="#34d399" />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          <Filter style={{ width: 14, height: 14, color: 'var(--text-muted)', flexShrink: 0 }} />
          {filterBtns.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{
                padding: '5px 12px', borderRadius: 100, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: filter === f.key ? 'var(--accent-light)' : 'var(--bg-surface)',
                borderColor: filter === f.key ? 'var(--accent)' : 'var(--border)',
                color: filter === f.key ? 'var(--accent)' : 'var(--text-secondary)',
              }}>
              {f.label} <span style={{ opacity: 0.7 }}>({f.count})</span>
            </button>
          ))}
        </div>

        {/* Alert List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              <Activity style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
              <p>No alerts in this category</p>
            </div>
          )}
          {filtered.map(alert => (
            <AlertRow key={alert.id} alert={alert} onViewInvestigation={id => navigate(`/investigations/${id}`, { state: { from: { label: 'Alert Triage', to: '/alerts' } } })} />
          ))}
        </div>

        {/* Learning note */}
        <div style={{ marginTop: 24, padding: '14px 18px', borderRadius: 10, background: 'rgba(99,102,241,.05)', border: '1px solid rgba(99,102,241,.15)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Bot style={{ width: 18, height: 18, color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>AI is learning from these classifications</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Every triage decision improves future noise detection. This week: 73% noise filtered, saving ~4.2 engineer-hours of on-call interruptions. Operon identified that disk I/O alerts on db-replica-* during 02:00–04:00 UTC are always analytics batch jobs — now auto-suppressed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
