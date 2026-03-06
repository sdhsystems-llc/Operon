import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface ReportJob {
  id: string
  title: string
  severity: string
  service: string
  startedAt: number
  status: 'generating' | 'done'
  reportHtml?: string
}

interface ReportContextType {
  jobs: ReportJob[]
  startReport: (inv: { id: string; title: string; severity: string; service: string }) => void
  dismissReport: (id: string) => void
  isGenerating: (id: string) => boolean
}

const ReportContext = createContext<ReportContextType | null>(null)

// ── mock HTML report generator ────────────────────────────────────────────────
function generateReportHtml(job: ReportJob): string {
  const severityColor: Record<string, string> = {
    p1: '#ef4444', p2: '#f97316', p3: '#eab308', p4: '#22c55e',
  }
  const color = severityColor[job.severity] ?? '#818cf8'
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
  const duration = Math.round((Date.now() - job.startedAt) / 1000)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Investigation Report — ${job.title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; padding: 2rem; }
  .header { border-bottom: 2px solid #1e293b; padding-bottom: 1.5rem; margin-bottom: 2rem; }
  .logo { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #818cf8; margin-bottom: 0.5rem; }
  h1 { font-size: 1.75rem; font-weight: 800; color: #f1f5f9; margin-bottom: 0.5rem; }
  .meta { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.75rem; }
  .badge { display: inline-flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 999px; border: 1px solid; }
  .sev { background: ${color}15; color: ${color}; border-color: ${color}40; }
  .status-r { background: #22c55e15; color: #22c55e; border-color: #22c55e40; }
  .section { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.25rem; }
  .section-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 1rem; }
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; }
  .kpi { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 1rem; }
  .kpi-val { font-size: 1.5rem; font-weight: 800; color: #818cf8; }
  .kpi-lbl { font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.125rem; }
  .timeline { display: flex; flex-direction: column; gap: 0.75rem; }
  .tl-row { display: flex; gap: 1rem; align-items: flex-start; }
  .tl-dot { width: 10px; height: 10px; border-radius: 50%; background: #818cf8; flex-shrink: 0; margin-top: 0.35rem; }
  .tl-dot.red { background: #ef4444; }
  .tl-dot.green { background: #22c55e; }
  .tl-dot.amber { background: #f59e0b; }
  .tl-time { font-size: 0.75rem; color: #64748b; white-space: nowrap; min-width: 60px; margin-top: 0.1rem; }
  .tl-text { font-size: 0.875rem; color: #e2e8f0; }
  .tl-sub { font-size: 0.75rem; color: #64748b; margin-top: 0.125rem; }
  .action-list { display: flex; flex-direction: column; gap: 0.625rem; }
  .action-row { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem; background: #0f172a; border-radius: 8px; border: 1px solid #334155; }
  .action-icon { font-size: 1rem; flex-shrink: 0; }
  .action-text { font-size: 0.875rem; }
  .action-priority { font-size: 0.68rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 4px; margin-top: 0.125rem; display: inline-block; }
  .p-urgent { background: #ef444415; color: #ef4444; }
  .p-monitor { background: #f59e0b15; color: #f59e0b; }
  .p-done { background: #22c55e15; color: #22c55e; }
  .confidence-bar { height: 8px; background: #334155; border-radius: 4px; overflow: hidden; margin-top: 0.5rem; }
  .confidence-fill { height: 100%; background: linear-gradient(90deg, #818cf8, #6366f1); border-radius: 4px; }
  .agents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
  .agent-card { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 0.875rem; }
  .agent-name { font-size: 0.8rem; font-weight: 700; color: #e2e8f0; margin-bottom: 0.25rem; }
  .agent-stat { font-size: 0.72rem; color: #64748b; }
  .agent-finding { font-size: 0.75rem; color: #94a3b8; margin-top: 0.375rem; padding: 0.375rem; background: #1e293b; border-radius: 5px; }
  .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #1e293b; font-size: 0.72rem; color: #475569; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
  .root-cause { font-size: 0.95rem; color: #f1f5f9; font-weight: 500; line-height: 1.6; padding: 1rem; background: #0f172a; border-left: 3px solid #818cf8; border-radius: 0 8px 8px 0; margin-bottom: 1rem; }
</style>
</head>
<body>

<div class="header">
  <div class="logo">Operon · AI Investigation Report</div>
  <h1>${job.title}</h1>
  <div class="meta">
    <span class="badge sev">${job.severity.toUpperCase()} Severity</span>
    <span class="badge status-r">✓ Resolved</span>
    <span style="font-size:0.8rem;color:#64748b;align-self:center">Generated: ${now}</span>
  </div>
</div>

<!-- KPIs -->
<div class="section">
  <div class="section-title">Investigation Summary</div>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-val">7</div><div class="kpi-lbl">AI Agents Deployed</div></div>
    <div class="kpi"><div class="kpi-val">${duration}s</div><div class="kpi-lbl">Analysis Duration</div></div>
    <div class="kpi"><div class="kpi-val">94%</div><div class="kpi-lbl">Root Cause Confidence</div></div>
    <div class="kpi"><div class="kpi-val">3</div><div class="kpi-lbl">Services Impacted</div></div>
    <div class="kpi"><div class="kpi-val">12.4K</div><div class="kpi-lbl">Log Lines Analyzed</div></div>
    <div class="kpi"><div class="kpi-val">4</div><div class="kpi-lbl">Action Items</div></div>
  </div>
</div>

<!-- Root Cause -->
<div class="section">
  <div class="section-title">Root Cause Analysis</div>
  <div class="root-cause">
    Deploy <strong>${job.service}-v2.1.4</strong> introduced a misconfigured connection pool (max_connections: 5 → 500), causing a thundering herd on database reconnect after a transient network blip. The pool exhaustion cascaded to upstream request timeouts within 90 seconds of the deploy completing. Rollback to v2.1.3 restored normal operation.
  </div>
  <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:0.375rem">Root Cause Confidence</div>
  <div class="confidence-bar"><div class="confidence-fill" style="width:94%"></div></div>
  <div style="font-size:0.72rem;color:#64748b;margin-top:0.25rem">94% — Strong signal correlation across logs, metrics, and traces</div>
</div>

<!-- Timeline -->
<div class="section">
  <div class="section-title">Incident Timeline</div>
  <div class="timeline">
    <div class="tl-row"><div class="tl-dot amber"></div><div class="tl-time">T+0:00</div><div><div class="tl-text">Deploy <strong>${job.service}-v2.1.4</strong> completed</div><div class="tl-sub">Automated canary passed — 0 errors in first 60s</div></div></div>
    <div class="tl-row"><div class="tl-dot red"></div><div class="tl-time">T+1:32</div><div><div class="tl-text">Error rate spike detected — 5xx responses up 1,400%</div><div class="tl-sub">PagerDuty fired P${job.severity.slice(1)} alert; on-call engaged</div></div></div>
    <div class="tl-row"><div class="tl-dot red"></div><div class="tl-time">T+2:10</div><div><div class="tl-text">Database connection pool exhausted — all workers blocked</div><div class="tl-sub">Downstream services: checkout, cart, auth all affected</div></div></div>
    <div class="tl-row"><div class="tl-dot"></div><div class="tl-time">T+3:45</div><div><div class="tl-text">Operon AI investigation started — 7 agents dispatched</div><div class="tl-sub">Logs, traces, metrics, and deployment history ingested</div></div></div>
    <div class="tl-row"><div class="tl-dot"></div><div class="tl-time">T+5:12</div><div><div class="tl-text">Root cause identified: connection pool misconfiguration</div><div class="tl-sub">94% confidence — corroborated by 3 independent agents</div></div></div>
    <div class="tl-row"><div class="tl-dot green"></div><div class="tl-time">T+8:30</div><div><div class="tl-text">Rollback to v2.1.3 initiated and completed</div><div class="tl-sub">Error rate normalized within 45 seconds of rollback</div></div></div>
    <div class="tl-row"><div class="tl-dot green"></div><div class="tl-time">T+9:15</div><div><div class="tl-text">Full recovery confirmed — all services green</div><div class="tl-sub">Total customer impact window: ~8 minutes</div></div></div>
  </div>
</div>

<!-- AI Agents -->
<div class="section">
  <div class="section-title">AI Agent Findings</div>
  <div class="agents-grid">
    <div class="agent-card"><div class="agent-name">🔍 Log Forensics Agent</div><div class="agent-stat">12,400 log lines · 2.3s</div><div class="agent-finding">Connection timeout errors spiked 1,400% at T+1:32. Stack trace points to pool.acquire() timeout after 5000ms.</div></div>
    <div class="agent-card"><div class="agent-name">📊 Metrics Correlation Agent</div><div class="agent-stat">847 time-series · 1.8s</div><div class="agent-finding">DB active_connections hit ceiling (500) at exact moment of error spike. CPU and memory stayed nominal — pool exhaustion only.</div></div>
    <div class="agent-card"><div class="agent-name">🚀 Deploy Diff Agent</div><div class="agent-stat">34 files changed · 0.9s</div><div class="agent-finding">v2.1.4 changed DB_MAX_POOL from env var (5) to hardcoded 500. No review comment flagged this change.</div></div>
    <div class="agent-card"><div class="agent-name">🔗 Trace Dependency Agent</div><div class="agent-stat">2,100 spans · 1.4s</div><div class="agent-finding">All upstream timeouts originate from db.query() spans. No network or DNS anomalies detected.</div></div>
    <div class="agent-card"><div class="agent-name">📖 Runbook Agent</div><div class="agent-stat">14 docs indexed · 0.6s</div><div class="agent-finding">Matched "connection pool exhaustion" runbook. Recommended immediate rollback — executed at T+8:30.</div></div>
    <div class="agent-card"><div class="agent-name">🧠 Hypothesis Agent</div><div class="agent-stat">6 hypotheses · 2.1s</div><div class="agent-finding">Ranked: (1) Pool config change 94%, (2) DB failover 4%, (3) Network partition 2%. Hypothesis 1 confirmed.</div></div>
    <div class="agent-card"><div class="agent-name">💥 Impact Assessment Agent</div><div class="agent-stat">3 services · 1.2s</div><div class="agent-finding">~8,400 users affected over 8 min. Estimated revenue impact: $12,000–$18,000. SLO breach: 99.94% → 99.82% (monthly).</div></div>
  </div>
</div>

<!-- Actions -->
<div class="section">
  <div class="section-title">Action Plan</div>
  <div class="action-list">
    <div class="action-row"><div class="action-icon">✅</div><div><div class="action-text">Rollback to v2.1.3 — completed at T+8:30</div><div class="action-priority p-done">DONE</div></div></div>
    <div class="action-row"><div class="action-icon">🚨</div><div><div class="action-text">Add PR lint rule to flag hardcoded DB pool values — assign to platform-eng</div><div class="action-priority p-urgent">URGENT · Due in 24h</div></div></div>
    <div class="action-row"><div class="action-icon">👁</div><div><div class="action-text">Add alerting on db.active_connections &gt; 80% of pool limit for early warning</div><div class="action-priority p-monitor">MONITOR · Due in 48h</div></div></div>
    <div class="action-row"><div class="action-icon">📋</div><div><div class="action-text">Conduct blameless postmortem — schedule within 5 business days</div><div class="action-priority p-monitor">FOLLOW-UP</div></div></div>
  </div>
</div>

<div class="footer">
  <span>Operon AI Investigation Platform · Auto-generated report</span>
  <span>Investigation ID: ${job.id} · Service: ${job.service}</span>
</div>

</body>
</html>`
}

// ── provider ──────────────────────────────────────────────────────────────────
export function ReportProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<ReportJob[]>([])

  const startReport = useCallback((inv: { id: string; title: string; severity: string; service: string }) => {
    // Don't start if already running
    setJobs(prev => {
      if (prev.some(j => j.id === inv.id && j.status === 'generating')) return prev
      return [...prev, { ...inv, startedAt: Date.now(), status: 'generating' }]
    })

    setTimeout(() => {
      setJobs(prev => prev.map(j =>
        j.id === inv.id && j.status === 'generating'
          ? { ...j, status: 'done', reportHtml: generateReportHtml({ ...j, status: 'done' }) }
          : j
      ))
    }, 40_000)
  }, [])

  const dismissReport = useCallback((id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id))
  }, [])

  const isGenerating = useCallback((id: string) =>
    jobs.some(j => j.id === id && j.status === 'generating'), [jobs])

  return (
    <ReportContext.Provider value={{ jobs, startReport, dismissReport, isGenerating }}>
      {children}
    </ReportContext.Provider>
  )
}

export function useReports() {
  const ctx = useContext(ReportContext)
  if (!ctx) throw new Error('useReports must be used inside ReportProvider')
  return ctx
}
