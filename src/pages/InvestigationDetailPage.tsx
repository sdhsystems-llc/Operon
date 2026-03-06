import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Investigation, InvestigationEvent } from '../types/database.types';
import { MOCK_INVESTIGATIONS, MOCK_EVENTS, MOCK_CONFIDENCE, MOCK_REMEDIATIONS } from '../lib/mockData';
import { Breadcrumb } from '../components/Breadcrumb';
import { Skeleton } from '../components/Skeleton';
import {
  Clock, AlertCircle, GitCommit, Flag, Activity, Zap, CheckCircle2, Bot,
  ChevronRight, Server, FileText, TrendingUp, RotateCcw, Terminal,
  GitPullRequest, Shield, MessageSquare, Send, Search, GitBranch,
  Settings, ArrowRight, ExternalLink, HelpCircle,
} from 'lucide-react';

// ── Shared helpers ──────────────────────────────────────────────────────────
const REMEDIATIONS: Record<string, { title: string; description: string; command?: string; risk: 'low' | 'medium' | 'high' }[]> = {
  'postgres-primary': [
    { title: 'Increase Connection Pool Size', description: 'Scale the max_connections setting from 50 to 200 in your PostgreSQL config.', command: 'ALTER SYSTEM SET max_connections = 200;\nSELECT pg_reload_conf();', risk: 'low' },
    { title: 'Add Missing Index', description: 'Create a composite index to eliminate full table scans.', command: 'CREATE INDEX CONCURRENTLY idx_orders_user_created\nON orders(user_id, created_at DESC);', risk: 'low' },
  ],
  'checkout-api': [
    { title: 'Roll Back Feature Flag', description: 'Disable the feature flag causing the latency spike.', command: 'ldcli flags update enable-new-checkout \\\n  --variations false \\\n  --environment production', risk: 'low' },
    { title: 'Scale Checkout Pods', description: 'Increase replica count to handle elevated traffic.', command: 'kubectl scale deployment checkout-api \\\n  --replicas=10 -n production', risk: 'low' },
  ],
  'payment-gateway': [
    { title: 'Implement Retry Logic', description: 'Add exponential backoff retry to payment provider calls.', risk: 'medium' },
    { title: 'Activate Fallback Provider', description: 'Route payment traffic to secondary processor.', risk: 'medium' },
  ],
  'redis-cache': [
    { title: 'Flush Stale Keys', description: 'Clear keys matching the degraded pattern.', command: 'redis-cli --scan --pattern "user:session:*" | xargs redis-cli del', risk: 'high' },
    { title: 'Increase Memory Limit', description: 'Scale Redis memory allocation from 8GB to 16GB.', risk: 'low' },
  ],
};

const getDefaultRemediations = (service: string) =>
  MOCK_REMEDIATIONS[service] || REMEDIATIONS[service] || [
    { title: 'Restart Service', description: `Rolling restart of ${service} to clear transient errors.`, command: `kubectl rollout restart deployment/${service} -n production`, risk: 'low' as const },
    { title: 'Check Recent Deployments', description: 'Review recent deploys to identify potential regression.', risk: 'low' as const },
    { title: 'Scale Horizontally', description: `Add more replicas to ${service} to distribute load.`, command: `kubectl scale deployment/${service} --replicas=5 -n production`, risk: 'low' as const },
  ];

const getEventConfig = (type: string) => {
  const configs: Record<string, { color: string; bg: string; border: string; label: string; Icon: any }> = {
    commit:        { color: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.25)', label: 'Commit',       Icon: GitCommit },
    deploy:        { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.25)',  label: 'Deploy',       Icon: Server },
    feature_flag:  { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.25)',  label: 'Feature Flag', Icon: Flag },
    alert:         { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)', label: 'Alert',        Icon: AlertCircle },
    metric:        { color: '#818cf8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.25)', label: 'Metric',       Icon: TrendingUp },
    log:           { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)', label: 'Log',          Icon: FileText },
    trace:         { color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)',  border: 'rgba(45,212,191,0.25)',  label: 'Trace',        Icon: Activity },
    config_change: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)',  label: 'Config',       Icon: Zap },
  };
  return configs[type] ?? configs.log;
};

const getSeverityConfig = (severity: string) => {
  const cfg: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    p1: { label: 'P1 Critical', bg: 'rgba(239,68,68,0.12)',   text: '#f87171', dot: '#ef4444' },
    p2: { label: 'P2 High',     bg: 'rgba(251,146,60,0.12)',  text: '#fb923c', dot: '#f97316' },
    p3: { label: 'P3 Medium',   bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24', dot: '#f59e0b' },
    p4: { label: 'P4 Low',      bg: 'rgba(99,102,241,0.12)',  text: '#818cf8', dot: '#6366f1' },
  };
  return cfg[severity] ?? cfg.p4;
};

const getStatusConfig = (status: string) => {
  const cfg: Record<string, { label: string; bg: string; text: string }> = {
    open:          { label: 'Open',          bg: 'rgba(100,116,139,0.12)', text: '#94a3b8' },
    investigating: { label: 'Investigating', bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24' },
    resolved:      { label: 'Resolved',      bg: 'rgba(16,185,129,0.12)',  text: '#34d399' },
    escalated:     { label: 'Escalated',     bg: 'rgba(239,68,68,0.12)',   text: '#f87171' },
  };
  return cfg[status] ?? cfg.open;
};

const CONFIDENCE_MAP: Record<string, number> = {
  'postgres-primary': 94, 'checkout-api': 87, 'payment-gateway': 91, 'redis-cache': 78,
  'api-gateway': 85, 'graphql-api': 82, 'fraud-detection': 96, 'load-balancer': 89,
  'webhook-service': 73, 'cdn-service': 88, 'elasticsearch': 76, 'payment-validator': 71,
  ...MOCK_CONFIDENCE,
};

const formatDuration = (minutes: number | null) => {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// ── Change Intelligence data ─────────────────────────────────────────────────
const CHANGE_INTEL = [
  { type: 'deploy',       rank: 1, title: 'checkout-service v2.4.1 deployed',     who: 'ci-bot',        ago: '12 min before incident',  correlation: 94, branch: 'feat/connection-pool-resize',  commit: 'a3f2c91', risk: 'high',   diff: '+3 files changed — db/pool.config.ts max_connections 50 → 500' },
  { type: 'feature_flag', rank: 2, title: 'enable-new-checkout-flow enabled (10%)',who: 'Sarah Chen',    ago: '8 min before incident',   correlation: 71, branch: null,                           commit: null,     risk: 'medium', diff: 'Rollout 0% → 10% for US-East-1 cohort' },
  { type: 'config',       rank: 3, title: 'DB connection timeout reduced to 3s',   who: 'John Kim',      ago: '34 min before incident',  correlation: 42, branch: null,                           commit: null,     risk: 'medium', diff: 'connect_timeout: 10 → 3 seconds in db-config.yaml' },
  { type: 'deploy',       rank: 4, title: 'payment-gateway v1.9.3 deployed',       who: 'ci-bot',        ago: '2h 14m before incident',  correlation: 18, branch: 'fix/stripe-retry-logic',       commit: 'd91b44f', risk: 'low',    diff: '+1 file — stripe.client.ts retry logic update' },
];

// ── Similar Incidents ────────────────────────────────────────────────────────
const SIMILAR_INCIDENTS = [
  { id: 'inv-prev-1', title: 'Connection Pool Exhausted — Checkout (v2.2.0)',      service: 'checkout-service', date: '2025-11-14', severity: 'p1', resolvedIn: '34m',  similarity: 94, rootCause: 'max_connections misconfigured after deploy v2.2.0. Rollback resolved.' },
  { id: 'inv-prev-2', title: 'DB Pool Saturation — Order Processing',              service: 'order-service',    date: '2025-09-28', severity: 'p2', resolvedIn: '52m',  similarity: 81, rootCause: 'Connection pool exhausted due to N+1 query pattern introduced in ORM upgrade.' },
  { id: 'inv-prev-3', title: 'Checkout API Latency Spike (deploy regression)',     service: 'checkout-service', date: '2025-08-05', severity: 'p2', resolvedIn: '28m',  similarity: 67, rootCause: 'Feature flag enable-promo-banner caused excessive DB reads. Rolled back.' },
];

// ── Post-mortem template ─────────────────────────────────────────────────────
function PostmortemTab({ investigation }: { investigation: Investigation }) {
  const isResolved = investigation.status === 'resolved';
  return (
    <div style={{ padding: '20px 0' }}>
      {!isResolved && (
        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Clock style={{ width: 15, height: 15, color: '#fbbf24', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Post-mortem will be auto-generated when this investigation is marked as <strong>Resolved</strong>. A draft is being prepared based on current evidence.</p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[
          { heading: '1. Incident Summary', icon: AlertCircle, color: '#f87171', content: `**What happened:** ${investigation.title}\n**Severity:** ${getSeverityConfig(investigation.severity).label}\n**Service:** ${investigation.service}\n**Duration:** ${formatDuration(investigation.duration_minutes) ?? 'Ongoing'}\n**Detected:** ${new Date(investigation.created_at).toLocaleString()}\n**AI Agent:** ${investigation.assigned_agent ?? 'Unassigned'}` },
          { heading: '2. Timeline of Events', icon: Clock, color: '#818cf8', content: 'T+0:00 — First alert fired (PagerDuty)\nT+0:45 — AI agent began investigation\nT+2:10 — Root cause hypothesis formed (94% confidence)\nT+3:30 — Remediation recommended\nT+5:00 — Fix applied\nT+6:15 — Error rate normalized\nT+8:00 — Full recovery confirmed' },
          { heading: '3. Root Cause', icon: Search, color: '#fbbf24', content: investigation.root_cause ?? 'AI agent is still correlating evidence. Root cause will be added automatically when determined with sufficient confidence (>80%).' },
          { heading: '4. Contributing Factors', icon: GitBranch, color: '#fb923c', content: '• Deploy v2.4.1 changed max_connections from 50 → 500 (misconfiguration)\n• Connection timeout was reduced to 3s (amplified impact)\n• No automated config validation gate on DB pool settings\n• Missing alert on db.waiting_connections metric' },
          { heading: '5. What Went Well', icon: CheckCircle2, color: '#34d399', content: '• AI detected root cause 4.2 min after incident start (before human triage)\n• Automated rollback option was available and used\n• Runbook existed and was surfaced automatically\n• On-call response was within SLA (< 5 min)' },
          { heading: '6. Action Items', icon: Zap, color: '#6366f1', content: '[ ] Add PR lint rule: flag DB pool config changes for mandatory review (Platform Eng — 24h)\n[ ] Add alert on db.waiting_connections > 20% of pool limit (Observability — 48h)\n[ ] Add integration test that validates max_connections stays within safe range (Backend — 1 week)\n[ ] Runbook update: add "connection pool misconfiguration" as a known pattern (SRE — 1 week)' },
        ].map(section => (
          <div key={section.heading} style={{ borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
              <section.icon style={{ width: 14, height: 14, color: section.color }} />
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{section.heading}</h3>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <pre style={{ fontSize: 12.5, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontFamily: 'inherit', margin: 0 }}>{section.content}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 5 Whys Tab ───────────────────────────────────────────────────────────────
function FiveWhysTab({ service }: { service: string }) {
  const whys = [
    { q: 'Why did the checkout service fail?',                  a: 'All database connections were exhausted — queries queued indefinitely and timed out.' },
    { q: 'Why were all database connections exhausted?',        a: `The connection pool max size was increased from 50 to 500 in deploy v2.4.1. Under normal load, 500 connections saturated the DB server's max_connections limit.` },
    { q: 'Why did max_connections jump from 50 to 500?',        a: 'A developer edited db/pool.config.ts to fix an unrelated bottleneck. The value 500 was unvalidated — no automated check existed for safe pool size ranges.' },
    { q: 'Why was there no validation on pool configuration?',  a: 'Configuration changes bypass the test suite. There was no policy-as-code rule or PR review requirement specific to DB pool settings.' },
    { q: 'Why was there no policy for DB pool configuration?',  a: 'The engineering team relied on reviewer knowledge. The previous pool-exhaustion incident (Nov 2025) did not produce a formal guardrail — only a runbook update.' },
  ];
  const barriers = [
    { name: 'CI/CD Config Validation', status: 'failed',  desc: 'No automated schema or range validation for DB pool config files.' },
    { name: 'Canary Deploy Gate',      status: 'passed',  desc: 'Canary passed at 1% traffic — pool exhaustion only appears under full load.' },
    { name: 'Alerting Threshold',      status: 'partial', desc: 'DB error-rate alert fired but too late. No leading indicator (waiting_connections) alert.' },
    { name: 'PR Review Process',       status: 'failed',  desc: 'Config file changed was not flagged for mandatory SRE review.' },
    { name: 'Retry / Circuit Breaker', status: 'partial', desc: 'Circuit breaker exists but tripped too slowly (30s window) — customer impact preceded it.' },
  ];
  const statusCfg = {
    failed:  { color: '#f87171', bg: 'rgba(239,68,68,.1)',  label: 'Failed' },
    passed:  { color: '#34d399', bg: 'rgba(16,185,129,.1)', label: 'Passed' },
    partial: { color: '#fbbf24', bg: 'rgba(245,158,11,.1)', label: 'Partial' },
  };
  return (
    <div style={{ padding: '20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
      {/* 5 Whys */}
      <div>
        <h3 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>5 Whys Analysis</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Traces the incident to its systemic root cause through iterative questioning.</p>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 15, top: 24, bottom: 24, width: 1, background: 'var(--border)' }} />
          {whys.map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, position: 'relative' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: i < 4 ? 'var(--accent-light)' : 'rgba(239,68,68,.12)', border: `1px solid ${i < 4 ? 'rgba(99,102,241,.3)' : 'rgba(239,68,68,.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 800, color: i < 4 ? 'var(--accent)' : '#f87171', zIndex: 1 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{w.q}</p>
                <div style={{ padding: '8px 12px', borderRadius: 7, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{w.a}</p>
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginLeft: 42, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#f87171', marginBottom: 3 }}>Root Cause Identified</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>No enforcement mechanism for safe DB pool configuration ranges. Relies solely on human reviewer knowledge, which fails under time pressure or reviewer unfamiliarity.</p>
          </div>
        </div>
      </div>

      {/* Barrier Analysis */}
      <div>
        <h3 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Barrier Analysis</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Which safeguards were in place, and which failed to contain the incident?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {barriers.map(b => {
            const sc = statusCfg[b.status as keyof typeof statusCfg];
            return (
              <div key={b.name} style={{ padding: '12px 14px', borderRadius: 9, border: `1px solid ${sc.color}28`, background: sc.bg }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Shield style={{ width: 13, height: 13, color: sc.color }} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{b.name}</span>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: `${sc.color}18`, color: sc.color }}>{sc.label}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, paddingLeft: 20 }}>{b.desc}</p>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(99,102,241,.05)', border: '1px solid rgba(99,102,241,.15)' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>Barrier Improvement Plan</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>Add policy-as-code validation for DB pool config (P1 action). Implement leading-indicator alerting on waiting_connections. Mandate SRE review for infrastructure config changes.</p>
        </div>
      </div>
    </div>
  );
}

// ── Incident Chat Tab ─────────────────────────────────────────────────────────
function IncidentChatTab({ investigation }: { investigation: Investigation }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `I'm actively monitoring this incident. Based on current evidence: the p95 latency spike on **${investigation.service}** correlates 94% with the deploy 12 minutes prior. I've identified 7 correlated signals across Datadog, PagerDuty and k8s. Ask me anything about this incident.`, time: '09:18' },
    { role: 'user',      content: 'Is this related to the deploy?',                                   time: '09:19' },
    { role: 'assistant', content: `High confidence (94%) yes. Deploy **v2.4.1** (12 min before incident) changed \`max_connections\` from 50 → 500 in \`db/pool.config.ts\`. At full load, 500 connections saturates the DB server's own limit of ~480. This is the most likely root cause.\n\nWant me to show you the diff?`, time: '09:19' },
    { role: 'user',      content: 'What is the fastest way to fix this?',                            time: '09:21' },
    { role: 'assistant', content: `Fastest recovery (< 2 min):\n\`\`\`\nkubectl rollout undo deployment/checkout-service -n production\n\`\`\`\nThis reverts to v2.4.0 which had \`max_connections: 50\`.\n\n**Risk:** Low. v2.4.0 is stable. The only change in v2.4.1 was the connection pool config.\n\nAlternatively, if rollback isn't possible, apply the config patch:\n\`\`\`\nkubectl set env deployment/checkout-service DB_POOL_MAX=50 -n production\n\`\`\``, time: '09:21' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const suggestions = ['Show me the deploy diff', 'Which users are affected?', 'Are there similar past incidents?', 'Generate the post-mortem draft'];

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages(m => [...m, { role: 'user', content: text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setInput('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    const responses: Record<string, string> = {
      'Show me the deploy diff': "**Deploy diff — checkout-service v2.4.0 → v2.4.1**\n\n```diff\n// db/pool.config.ts\n- maxConnections: 50,\n+ maxConnections: 500,  // ← root cause\n  idleTimeoutMs: 10000,\n  connectionTimeoutMs: 3000,\n```\n\nThis single line change is the root cause. The developer intended to scale up capacity but set the value 10x too high.",
      'Which users are affected?': `Based on error sampling from Datadog: approximately **14,800 unique users** in the last 30 minutes. Primarily US-East-1 cohort. Checkout conversion rate dropped from 87% → 31%. Estimated revenue impact: **~$4,200/min**.`,
      'Are there similar past incidents?': `Found **3 similar incidents** in the past 12 months:\n\n1. **Nov 14, 2025** — checkout-service v2.2.0 deploy, same pool exhaustion pattern. Resolved in 34m via rollback.\n2. **Sep 28, 2025** — order-service N+1 query causing pool saturation. Resolved in 52m.\n3. **Aug 5, 2025** — Latency spike from feature flag regression. Resolved in 28m.\n\nIn all cases, **rollback was the fastest resolution**. The Nov 2025 incident is most similar (94% match).`,
      'Generate the post-mortem draft': "I've pre-filled the Post-mortem tab with a draft based on current evidence. Switch to the **Post-mortem** tab to review and edit it. Key sections completed: Incident Summary, Timeline, Root Cause, Contributing Factors, and Action Items.",
    };
    const reply = responses[text] ?? `I'm analyzing that query against the current incident context for **${investigation.service}**. Based on the correlated evidence: the connection pool exhaustion pattern and deploy timing strongly suggest this is a configuration regression. What specific aspect would you like to explore deeper?`;
    setMessages(m => [...m, { role: 'assistant', content: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 520 }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: m.role === 'assistant' ? 'var(--accent-light)' : 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {m.role === 'assistant' ? <Bot style={{ width: 13, height: 13, color: 'var(--accent)' }} /> : <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>U</span>}
            </div>
            <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: m.role === 'user' ? '12px 2px 12px 12px' : '2px 12px 12px 12px', background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-elevated)', border: m.role === 'assistant' ? '1px solid var(--border)' : 'none' }}>
              <pre style={{ fontSize: 12.5, lineHeight: 1.65, color: m.role === 'user' ? '#fff' : 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{m.content}</pre>
              <p style={{ fontSize: 10, color: m.role === 'user' ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', marginTop: 4 }}>{m.time}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-light)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot style={{ width: 13, height: 13, color: 'var(--accent)' }} />
            </div>
            <div style={{ padding: '12px 16px', borderRadius: '2px 12px 12px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', gap: 4 }}>
              {[0,1,2].map(j => <span key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', opacity: 0.5, animation: `triageDot 1.2s ease-in-out ${j*0.2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 10 }}>
        {suggestions.map(s => (
          <button key={s} onClick={() => sendMessage(s)}
            style={{ padding: '5px 10px', borderRadius: 100, fontSize: 11.5, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder={`Ask anything about this ${investigation.service} incident...`}
          style={{ flex: 1, background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 9, padding: '9px 14px', fontSize: 13, color: 'var(--input-text)', outline: 'none' }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-light)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--input-border)'; e.currentTarget.style.boxShadow = 'none'; }}
        />
        <button onClick={() => sendMessage(input)} style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Send style={{ width: 15, height: 15 }} />
        </button>
      </div>
      <style>{`@keyframes triageDot { 0%,80%,100%{opacity:.2} 40%{opacity:1} }`}</style>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export const InvestigationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const from: { label: string; to: string } = (location.state as any)?.from ?? { label: 'Investigations', to: '/investigations' };

  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [events, setEvents] = useState<InvestigationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedFixes, setAppliedFixes] = useState<Set<number>>(new Set());
  const [applyingFix, setApplyingFix] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'changes' | 'rca' | 'similar' | 'postmortem' | 'chat'>('overview');

  useEffect(() => {
    if (!id) return;
    const loadAll = async () => {
      const [invRes, eventsRes] = await Promise.all([
        supabase.from('investigations').select('*').eq('id', id).maybeSingle(),
        supabase.from('investigation_events').select('*').eq('investigation_id', id).order('timestamp', { ascending: true }),
      ]);
      const inv = invRes.data ?? MOCK_INVESTIGATIONS.find(m => m.id === id) ?? null;
      const evs = (eventsRes.data && eventsRes.data.length > 0) ? eventsRes.data : (MOCK_EVENTS[id] ?? []);
      setInvestigation(inv as unknown as Investigation);
      setEvents(evs as unknown as InvestigationEvent[]);
      setLoading(false);
    };
    loadAll();
  }, [id]);

  const handleApplyFix = async (index: number) => {
    setApplyingFix(index);
    await new Promise((r) => setTimeout(r, 1800));
    setAppliedFixes((prev) => new Set([...prev, index]));
    setApplyingFix(null);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-5">
        <Breadcrumb crumbs={[{ label: from.label, to: from.to }, { label: '...' }]} />
        <div className="card p-6 space-y-4">
          <Skeleton className="h-6 w-48" /><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!investigation) {
    return (
      <div className="p-6 text-center py-16">
        <AlertCircle className="mx-auto h-12 w-12" style={{ color: 'var(--text-muted)' }} />
        <h3 className="mt-4 text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Investigation not found</h3>
        <button onClick={() => navigate('/investigations')} className="mt-4 btn-primary inline-flex">Back to Investigations</button>
      </div>
    );
  }

  const sev = getSeverityConfig(investigation.severity);
  const st = getStatusConfig(investigation.status);
  const remediations = getDefaultRemediations(investigation.service);
  const confidence = CONFIDENCE_MAP[investigation.service] ?? 80;

  const timelineEvents = [
    ...events.map(e => ({ ...e, isReal: true })),
    ...(investigation.created_at ? [{ id: 'investigation-start', event_type: 'alert', title: 'Investigation Started', description: 'Operon AI agent began correlating events', source: 'operon', timestamp: investigation.created_at, correlation_score: 1.0, isReal: false, investigation_id: id as string }] : []),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const TABS = [
    { key: 'overview',   label: 'Overview',            badge: null },
    { key: 'timeline',   label: 'Event Timeline',       badge: timelineEvents.length > 0 ? timelineEvents.length : null },
    { key: 'changes',    label: 'Change Intelligence',  badge: CHANGE_INTEL.length },
    { key: 'rca',        label: 'RCA · 5 Whys',        badge: null },
    { key: 'similar',    label: 'Similar Incidents',    badge: SIMILAR_INCIDENTS.length },
    { key: 'postmortem', label: 'Post-mortem',          badge: null },
    { key: 'chat',       label: 'Incident Chat',        badge: null },
  ] as const;

  return (
    <div className="h-full overflow-y-auto">
      <div style={{ padding: '20px 24px' }}>
        <Breadcrumb crumbs={[{ label: from.label, to: from.to }, { label: investigation.title.length > 48 ? investigation.title.slice(0, 48) + '…' : investigation.title }]} />

        {/* Header card */}
        <div className="card p-5 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: sev.bg, color: sev.text }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: sev.dot }} />{sev.label}
                </span>
                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: st.bg, color: st.text }}>{st.label}</span>
              </div>
              <h1 className="text-2xl font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{investigation.title}</h1>
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Server className="h-4 w-4" />
                <code className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>{investigation.service}</code>
                {investigation.assigned_agent && (<><ChevronRight className="h-3 w-3" /><Bot className="h-4 w-4" style={{ color: '#818cf8' }} /><span>{investigation.assigned_agent}</span></>)}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Opened', v: new Date(investigation.created_at).toLocaleDateString(), sub: new Date(investigation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                { label: 'AI Confidence', v: `${confidence}%`, sub: 'root cause', accent: true },
                { label: 'Duration', v: formatDuration(investigation.duration_minutes) ?? 'Ongoing', sub: 'MTTR' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                  <p className="text-sm font-semibold" style={{ color: item.accent ? 'var(--accent)' : 'var(--text-primary)' }}>{item.v}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 20, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500,
                color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: `2px solid ${activeTab === tab.key ? 'var(--accent)' : 'transparent'}`,
                background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === tab.key ? 'var(--accent)' : 'transparent'}`,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s',
                marginBottom: -1,
              }}>
              {tab.label}
              {tab.badge != null && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 100, background: activeTab === tab.key ? 'var(--accent-light)' : 'var(--bg-elevated)', color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {investigation.root_cause && (
              <div className="p-4 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#fbbf24' }} />
                  <div><p className="text-sm font-semibold mb-1" style={{ color: '#fbbf24' }}>Root Cause</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{investigation.root_cause}</p></div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* RCA Summary */}
              <div className="card">
                <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
                  <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Root Cause Analysis</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div className="p-4 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2"><Bot className="h-5 w-5" style={{ color: '#818cf8' }} /><span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Confidence</span></div>
                      <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{confidence}%</span>
                    </div>
                    <div className="w-full rounded-full h-2 mb-3" style={{ background: 'var(--bg-base)' }}>
                      <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${confidence}%`, background: 'var(--accent)' }} />
                    </div>
                    {investigation.root_cause
                      ? <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{investigation.root_cause}</p>
                      : <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>AI agent is analyzing correlated events...</p>
                    }
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Evidence ({events.length} correlated events)</p>
                    <div className="space-y-2">
                      {events.slice(0, 4).map((event) => {
                        const cfg = getEventConfig(event.event_type); const Icon = cfg.Icon; const score = Math.round(event.correlation_score * 100);
                        return (
                          <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ border: '1px solid var(--border)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                            <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: cfg.bg }}><Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} /></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{event.title}</p>
                                <span className="text-xs font-semibold flex-shrink-0" style={{ color: score >= 90 ? '#f87171' : score >= 80 ? '#fb923c' : 'var(--text-muted)' }}>{score}%</span>
                              </div>
                              <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>{event.description}</p>
                            </div>
                          </div>
                        );
                      })}
                      {events.length === 0 && <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No events correlated yet</p>}
                    </div>
                  </div>
                </div>
              </div>
              {/* Remediations */}
              <div className="card">
                <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
                  <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Remediation Suggestions</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>AI-generated fixes based on root cause analysis</p>
                </div>
                <div className="p-5 space-y-4">
                  {remediations.map((fix, idx) => {
                    const isApplied = appliedFixes.has(idx); const isApplying = applyingFix === idx;
                    const rs: Record<string, { bg: string; color: string }> = { low: { bg: 'rgba(16,185,129,0.12)', color: '#34d399' }, medium: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24' }, high: { bg: 'rgba(239,68,68,0.12)', color: '#f87171' } };
                    return (
                      <div key={idx} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${isApplied ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`, background: isApplied ? 'rgba(16,185,129,0.05)' : 'transparent' }}>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              {isApplied ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#34d399' }} /> : <RotateCcw className="h-4 w-4 flex-shrink-0" style={{ color: '#818cf8' }} />}
                              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{fix.title}</p>
                            </div>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: rs[fix.risk].bg, color: rs[fix.risk].color }}>{fix.risk} risk</span>
                          </div>
                          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{fix.description}</p>
                          {fix.command && (
                            <div className="mb-3 rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                              <div className="px-3 py-1.5 flex items-center gap-2" style={{ background: 'var(--bg-elevated)' }}>
                                <Terminal className="h-3 w-3" style={{ color: 'var(--text-muted)' }} /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Command</span>
                              </div>
                              <pre className="px-3 py-2.5 text-xs font-mono overflow-x-auto" style={{ background: 'var(--bg-base)', color: '#a5b4fc' }}>{fix.command}</pre>
                            </div>
                          )}
                          {!isApplied
                            ? <button onClick={() => handleApplyFix(idx)} disabled={isApplying} className="w-full py-2 px-4 rounded-lg text-xs font-medium" style={isApplying ? { background: 'var(--bg-elevated)', color: 'var(--text-muted)', cursor: 'wait' } : { background: 'var(--accent)', color: 'white', cursor: 'pointer' }}
                                onMouseEnter={e => { if (!isApplying) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'none'; }}>
                                {isApplying ? <span className="flex items-center justify-center gap-2"><span className="animate-spin rounded-full h-3 w-3 border-b border-white" />Applying...</span> : 'Apply Fix'}
                              </button>
                            : <div className="flex items-center justify-center gap-2 py-2" style={{ color: '#34d399' }}><CheckCircle2 className="h-4 w-4" /><span className="text-xs font-medium">Fix Applied</span></div>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TIMELINE TAB ── */}
        {activeTab === 'timeline' && (
          <div className="card">
            <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Event Correlation Timeline</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>All correlated events across integrations, ordered by time</p>
            </div>
            {timelineEvents.length === 0
              ? <div className="p-8 text-center"><Activity className="mx-auto h-8 w-8" style={{ color: 'var(--text-muted)' }} /><p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>No correlated events yet</p></div>
              : <div className="p-6 overflow-x-auto">
                  <div className="relative min-w-[600px]">
                    <div className="absolute top-5 left-0 right-0 h-px" style={{ background: 'var(--border)' }} />
                    <div className="flex items-start justify-between gap-2">
                      {timelineEvents.map((event, idx) => {
                        const cfg = getEventConfig(event.event_type); const Icon = cfg.Icon; const score = Math.round(event.correlation_score * 100);
                        return (
                          <div key={event.id || idx} className="flex flex-col items-center group relative" style={{ minWidth: '120px', maxWidth: '160px', flex: '1' }}>
                            <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 transition-transform group-hover:scale-110" style={{ background: cfg.bg, borderColor: cfg.border }}>
                              <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                            </div>
                            <div className="mt-3 text-center px-1 w-full">
                              <p className="text-xs font-semibold px-1.5 py-0.5 rounded-full inline-block mb-1" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</p>
                              <p className="text-xs font-medium leading-tight line-clamp-2" style={{ color: 'var(--text-primary)' }}>{event.title}</p>
                              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(event.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                              {event.isReal && (<><div className="mt-1.5 w-full rounded-full h-1" style={{ background: 'var(--bg-elevated)' }}><div className="h-1 rounded-full" style={{ width: `${score}%`, background: cfg.color }} /></div><p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{score}% match</p></>)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
            }
          </div>
        )}

        {/* ── CHANGE INTELLIGENCE TAB ── */}
        {activeTab === 'changes' && (
          <div className="space-y-4">
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(99,102,241,.05)', border: '1px solid rgba(99,102,241,.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap style={{ width: 15, height: 15, color: 'var(--accent)', flexShrink: 0 }} />
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Change Intelligence</strong> — every deploy, config edit, feature flag change, and schema migration in the 4-hour window before this incident, ranked by correlation probability.
              </p>
            </div>
            {CHANGE_INTEL.map((change) => {
              const typeColor = { deploy: '#60a5fa', feature_flag: '#fb923c', config: '#fbbf24' }[change.type] ?? '#94a3b8';
              const typeLabel = { deploy: 'Deploy', feature_flag: 'Feature Flag', config: 'Config Change' }[change.type] ?? 'Change';
              const riskColor = { high: '#f87171', medium: '#fbbf24', low: '#34d399' }[change.risk] ?? '#94a3b8';
              return (
                <div key={change.rank} className="card p-5">
                  <div className="flex items-start gap-4">
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: `${typeColor}18`, border: `1px solid ${typeColor}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {change.type === 'deploy' ? <Server style={{ width: 15, height: 15, color: typeColor }} /> : change.type === 'feature_flag' ? <Flag style={{ width: 15, height: 15, color: typeColor }} /> : <Settings style={{ width: 15, height: 15, color: typeColor }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: `${typeColor}15`, color: typeColor }}>{typeLabel}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: `${riskColor}12`, color: riskColor }}>{change.risk} risk</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{change.ago}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>by {change.who}</span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{change.title}</p>
                      <div style={{ padding: '8px 12px', borderRadius: 7, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>{change.diff}</div>
                      {change.branch && (
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}><GitBranch style={{ width: 11, height: 11 }} />{change.branch}</span>
                          {change.commit && <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}><GitCommit style={{ width: 11, height: 11 }} />{change.commit}</span>}
                          <button style={{ fontSize: 11, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer' }}>
                            <ExternalLink style={{ width: 10, height: 10 }} /> View PR
                          </button>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', border: `3px solid ${change.correlation >= 80 ? '#f87171' : change.correlation >= 50 ? '#fbbf24' : '#475569'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: change.correlation >= 80 ? '#f87171' : change.correlation >= 50 ? '#fbbf24' : 'var(--text-muted)', lineHeight: 1 }}>{change.correlation}%</span>
                      </div>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>correlation</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── RCA / 5 WHYS / BARRIER ANALYSIS ── */}
        {activeTab === 'rca' && <FiveWhysTab service={investigation.service} />}

        {/* ── SIMILAR INCIDENTS ── */}
        {activeTab === 'similar' && (
          <div className="space-y-4">
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(99,102,241,.05)', border: '1px solid rgba(99,102,241,.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bot style={{ width: 15, height: 15, color: 'var(--accent)', flexShrink: 0 }} />
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Pattern matching</strong> — incidents from the past 12 months with similar signal patterns, services, and root cause categories. Ranked by similarity score.
              </p>
            </div>
            {SIMILAR_INCIDENTS.map((inc) => {
              const s = getSeverityConfig(inc.severity);
              return (
                <div key={inc.id} className="card p-5 flex items-start gap-4">
                  <div style={{ width: 52, height: 52, borderRadius: '50%', border: `3px solid ${inc.similarity >= 90 ? 'var(--accent)' : '#475569'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: inc.similarity >= 90 ? 'var(--accent)' : 'var(--text-muted)', lineHeight: 1 }}>{inc.similarity}%</p>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: s.bg, color: s.text }}>{s.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inc.date}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>·</span>
                      <span style={{ fontSize: 11, color: '#34d399' }}>Resolved in {inc.resolvedIn}</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{inc.title}</p>
                    <code style={{ fontSize: 11.5, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 7px', borderRadius: 4 }}>{inc.service}</code>
                    <div style={{ marginTop: 10, padding: '9px 12px', borderRadius: 7, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>How it was resolved</p>
                      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{inc.rootCause}</p>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/investigations/${inc.id}`, { state: { from: { label: investigation.title.slice(0, 30) + '…', to: `/investigations/${id}` } } })}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    <ExternalLink style={{ width: 11, height: 11 }} /> View
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── POST-MORTEM TAB ── */}
        {activeTab === 'postmortem' && <PostmortemTab investigation={investigation} />}

        {/* ── INCIDENT CHAT TAB ── */}
        {activeTab === 'chat' && <IncidentChatTab investigation={investigation} />}
      </div>
    </div>
  );
};
