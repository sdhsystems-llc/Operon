import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Investigation, InvestigationEvent } from '../types/database.types';
import { MOCK_INVESTIGATIONS, MOCK_EVENTS, MOCK_CONFIDENCE, MOCK_REMEDIATIONS } from '../lib/mockData';
import { Breadcrumb } from '../components/Breadcrumb';
import { Skeleton } from '../components/Skeleton';
import {
  Clock,
  AlertCircle,
  GitCommit,
  Flag,
  Activity,
  Zap,
  CheckCircle2,
  Bot,
  ChevronRight,
  Server,
  FileText,
  TrendingUp,
  RotateCcw,
  Terminal,
} from 'lucide-react';

const REMEDIATIONS: Record<string, { title: string; description: string; command?: string; risk: 'low' | 'medium' | 'high' }[]> = {
  'postgres-primary': [
    { title: 'Increase Connection Pool Size', description: 'Scale the max_connections setting from 50 to 200 in your PostgreSQL config.', command: 'ALTER SYSTEM SET max_connections = 200;\nSELECT pg_reload_conf();', risk: 'low' },
    { title: 'Add Missing Index', description: 'Create a composite index to eliminate full table scans on the orders table.', command: 'CREATE INDEX CONCURRENTLY idx_orders_user_created\nON orders(user_id, created_at DESC);', risk: 'low' },
  ],
  'checkout-api': [
    { title: 'Roll Back Feature Flag', description: 'Disable the feature flag causing the latency spike in checkout flow.', command: 'ldcli flags update enable-new-checkout \\\n  --variations false \\\n  --environment production', risk: 'low' },
    { title: 'Scale Checkout Pods', description: 'Increase replica count to handle elevated traffic while investigating.', command: 'kubectl scale deployment checkout-api \\\n  --replicas=10 -n production', risk: 'low' },
  ],
  'payment-gateway': [
    { title: 'Implement Retry Logic', description: 'Add exponential backoff retry to payment provider calls.', risk: 'medium' },
    { title: 'Activate Fallback Provider', description: 'Route payment traffic to secondary processor while primary is degraded.', risk: 'medium' },
  ],
  'redis-cache': [
    { title: 'Flush Stale Keys', description: 'Clear keys matching the degraded pattern to force cache rebuild.', command: 'redis-cli --scan --pattern "user:session:*" \\\n  | xargs redis-cli del', risk: 'high' },
    { title: 'Increase Memory Limit', description: 'Scale Redis memory allocation from 8GB to 16GB to reduce eviction pressure.', risk: 'low' },
  ],
};

const getDefaultRemediations = (service: string) =>
  MOCK_REMEDIATIONS[service] || REMEDIATIONS[service] || [
    { title: 'Restart Service', description: `Perform a rolling restart of ${service} to clear transient errors.`, command: `kubectl rollout restart deployment/${service} -n production`, risk: 'low' as const },
    { title: 'Check Recent Deployments', description: 'Review recent deployments to identify potential regression.', risk: 'low' as const },
    { title: 'Scale Horizontally', description: `Add more replicas to ${service} to distribute load.`, command: `kubectl scale deployment/${service} --replicas=5 -n production`, risk: 'low' as const },
  ];

const getEventConfig = (type: string) => {
  const configs: Record<string, { color: string; bg: string; border: string; label: string; Icon: any }> = {
    commit:       { color: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.25)', label: 'Commit', Icon: GitCommit },
    deploy:       { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.25)',  label: 'Deploy', Icon: Server },
    feature_flag: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.25)',  label: 'Feature Flag', Icon: Flag },
    alert:        { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)', label: 'Alert', Icon: AlertCircle },
    metric:       { color: '#818cf8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.25)', label: 'Metric', Icon: TrendingUp },
    log:          { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)', label: 'Log', Icon: FileText },
    trace:        { color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)',  border: 'rgba(45,212,191,0.25)',  label: 'Trace', Icon: Activity },
    config_change:{ color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)',  label: 'Config', Icon: Zap },
  };
  return configs[type] ?? configs.log;
};

const getSeverityConfig = (severity: string) => {
  const cfg: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    p1: { label: 'P1 Critical', bg: 'rgba(239,68,68,0.12)', text: '#f87171', dot: '#ef4444' },
    p2: { label: 'P2 High',     bg: 'rgba(251,146,60,0.12)', text: '#fb923c', dot: '#f97316' },
    p3: { label: 'P3 Medium',   bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', dot: '#f59e0b' },
    p4: { label: 'P4 Low',      bg: 'rgba(99,102,241,0.12)', text: '#818cf8', dot: '#6366f1' },
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
  // aligned with mock investigation IDs
  ...MOCK_CONFIDENCE,
};

const formatDuration = (minutes: number | null) => {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} minutes`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const InvestigationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const from: { label: string; to: string } = (location.state as any)?.from ?? { label: 'Investigations', to: '/investigations' };
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [events, setEvents] = useState<InvestigationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedFixes, setAppliedFixes] = useState<Set<number>>(new Set());
  const [applyingFix, setApplyingFix] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadAll = async () => {
      const [invRes, eventsRes] = await Promise.all([
        supabase.from('investigations').select('*').eq('id', id).maybeSingle(),
        supabase.from('investigation_events').select('*').eq('investigation_id', id).order('timestamp', { ascending: true }),
      ]);
      // Fall back to mock data if Supabase returns nothing
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
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="card p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      </div>
    );
  }

  if (!investigation) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center py-16">
        <AlertCircle className="mx-auto h-12 w-12" style={{ color: 'var(--text-muted)' }} />
        <h3 className="mt-4 text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Investigation not found</h3>
        <a href="/investigations" className="mt-4 btn-primary inline-flex">Back to Investigations</a>
      </div>
    );
  }

  const sev = getSeverityConfig(investigation.severity);
  const st = getStatusConfig(investigation.status);
  const remediations = getDefaultRemediations(investigation.service);
  const confidence = CONFIDENCE_MAP[investigation.service] ?? 80;

  const timelineEvents = [
    ...events.map((e) => ({ ...e, isReal: true })),
    ...(investigation.created_at ? [{
      id: 'investigation-start', event_type: 'alert', title: 'Investigation Started',
      description: 'Operon AI agent began correlating events', source: 'operon',
      timestamp: investigation.created_at, correlation_score: 1.0, isReal: false, investigation_id: id as string,
    }] : []),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="h-full overflow-y-auto">
    <div className="p-6 space-y-5">
      <Breadcrumb crumbs={[
        { label: from.label, to: from.to },
        { label: investigation.title.length > 40 ? investigation.title.slice(0, 40) + '…' : investigation.title },
      ]} />

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: sev.bg, color: sev.text }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: sev.dot }} />
                {sev.label}
              </span>
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: st.bg, color: st.text }}>
                {st.label}
              </span>
            </div>
            <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              {investigation.title}
            </h1>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <Server className="h-4 w-4" />
              <code className="font-mono text-xs px-2 py-0.5 rounded"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                {investigation.service}
              </code>
              {investigation.assigned_agent && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <Bot className="h-4 w-4" style={{ color: '#818cf8' }} />
                  <span>{investigation.assigned_agent}</span>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Opened</p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{new Date(investigation.created_at).toLocaleDateString()}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(investigation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            {investigation.resolved_at && (
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Resolved</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{new Date(investigation.resolved_at).toLocaleDateString()}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(investigation.resolved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            )}
            {investigation.duration_minutes && (
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Duration</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatDuration(investigation.duration_minutes)}</p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>MTTR</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {investigation.root_cause && (
          <div className="p-4 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#fbbf24' }} />
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: '#fbbf24' }}>Root Cause</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{investigation.root_cause}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Event Correlation Timeline</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>All correlated events across integrations, ordered by time</p>
        </div>

        {timelineEvents.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="mx-auto h-8 w-8" style={{ color: 'var(--text-muted)' }} />
            <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>No correlated events yet</p>
          </div>
        ) : (
          <div className="p-6 overflow-x-auto">
            <div className="relative min-w-[600px]">
              <div className="absolute top-5 left-0 right-0 h-px" style={{ background: 'var(--border)' }} />
              <div className="flex items-start justify-between gap-2">
                {timelineEvents.map((event, idx) => {
                  const cfg = getEventConfig(event.event_type);
                  const Icon = cfg.Icon;
                  const score = Math.round(event.correlation_score * 100);
                  return (
                    <div key={event.id || idx} className="flex flex-col items-center group relative"
                      style={{ minWidth: '120px', maxWidth: '160px', flex: '1' }}>
                      <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 transition-transform group-hover:scale-110"
                        style={{ background: cfg.bg, borderColor: cfg.border }}>
                        <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                      </div>
                      <div className="mt-3 text-center px-1 w-full">
                        <p className="text-xs font-semibold px-1.5 py-0.5 rounded-full inline-block mb-1"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </p>
                        <p className="text-xs font-medium leading-tight line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                          {event.title}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(event.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </p>
                        {event.isReal && (
                          <>
                            <div className="mt-1.5 w-full rounded-full h-1" style={{ background: 'var(--bg-elevated)' }}>
                              <div className="h-1 rounded-full" style={{ width: `${score}%`, background: cfg.color }} />
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{score}% match</p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center gap-6 text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}>
                {['commit','deploy','feature_flag','alert','metric','log','trace'].map((type) => {
                  const cfg = getEventConfig(type);
                  const Icon = cfg.Icon;
                  return (
                    <div key={type} className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: cfg.bg }}>
                        <Icon className="h-2.5 w-2.5" style={{ color: cfg.color }} />
                      </div>
                      <span>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Root Cause Analysis</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5" style={{ color: '#818cf8' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Confidence</span>
                </div>
                <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{confidence}%</span>
              </div>
              <div className="w-full rounded-full h-2 mb-3" style={{ background: 'var(--bg-base)' }}>
                <div className="h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${confidence}%`, background: 'var(--accent)' }} />
              </div>
              {investigation.root_cause ? (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{investigation.root_cause}</p>
              ) : (
                <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>AI agent is analyzing correlated events...</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Evidence ({events.length} correlated events)
              </p>
              <div className="space-y-2">
                {events.slice(0, 5).map((event) => {
                  const cfg = getEventConfig(event.event_type);
                  const Icon = cfg.Icon;
                  const score = Math.round(event.correlation_score * 100);
                  return (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg transition-colors"
                      style={{ border: '1px solid var(--border)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                    >
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: cfg.bg }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{event.title}</p>
                          <span className="text-xs font-semibold flex-shrink-0"
                            style={{ color: score >= 90 ? '#f87171' : score >= 80 ? '#fb923c' : 'var(--text-muted)' }}>
                            {score}%
                          </span>
                        </div>
                        <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>{event.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{event.source}</span>
                          <span className="text-xs" style={{ color: 'var(--border)' }}>·</span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {events.length > 5 && (
                  <p className="text-xs text-center py-1" style={{ color: 'var(--text-muted)' }}>+{events.length - 5} more events</p>
                )}
                {events.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No events correlated yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Remediation Suggestions</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>AI-generated fixes based on root cause analysis</p>
          </div>
          <div className="p-5 space-y-4">
            {remediations.map((fix, idx) => {
              const isApplied = appliedFixes.has(idx);
              const isApplying = applyingFix === idx;
              const riskStyle: Record<string, { bg: string; color: string }> = {
                low:    { bg: 'rgba(16,185,129,0.12)',  color: '#34d399' },
                medium: { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24' },
                high:   { bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
              };
              const rs = riskStyle[fix.risk];

              return (
                <div key={idx} className="rounded-lg overflow-hidden transition-all"
                  style={{ border: `1px solid ${isApplied ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`, background: isApplied ? 'rgba(16,185,129,0.05)' : 'transparent' }}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {isApplied
                          ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#34d399' }} />
                          : <RotateCcw className="h-4 w-4 flex-shrink-0" style={{ color: '#818cf8' }} />
                        }
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{fix.title}</p>
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: rs.bg, color: rs.color }}>
                        {fix.risk} risk
                      </span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{fix.description}</p>

                    {fix.command && (
                      <div className="mb-3 rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                        <div className="px-3 py-1.5 flex items-center gap-2" style={{ background: 'var(--bg-elevated)' }}>
                          <Terminal className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Command</span>
                        </div>
                        <pre className="px-3 py-2.5 text-xs font-mono overflow-x-auto whitespace-pre"
                          style={{ background: 'var(--bg-base)', color: '#a5b4fc' }}>
                          {fix.command}
                        </pre>
                      </div>
                    )}

                    {!isApplied ? (
                      <button onClick={() => handleApplyFix(idx)} disabled={isApplying}
                        className="w-full py-2 px-4 rounded-lg text-xs font-medium transition-all"
                        style={isApplying
                          ? { background: 'var(--bg-elevated)', color: 'var(--text-muted)', cursor: 'wait' }
                          : { background: 'var(--accent)', color: 'white' }
                        }
                        onMouseEnter={(e) => { if (!isApplying) (e.currentTarget as HTMLButtonElement).style.background = '#4f51e8'; }}
                        onMouseLeave={(e) => { if (!isApplying) (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'; }}
                      >
                        {isApplying ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin rounded-full h-3 w-3 border-b border-white" />
                            Applying...
                          </span>
                        ) : 'Apply Fix'}
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-2" style={{ color: '#34d399' }}>
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-medium">Fix Applied</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
