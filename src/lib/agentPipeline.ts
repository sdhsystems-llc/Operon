// ─── Agent Investigation Pipeline — Rich Scenario Engine ─────────────────────

export type FindingStatus = 'ok' | 'warning' | 'critical' | 'info'
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'healthy'

export interface AgentFinding { label: string; value: string; status: FindingStatus; delta?: string }
export interface ActionItem { label: string; done: boolean; priority: 'urgent' | 'monitor' | 'done' | 'info' }

export interface PipelineIntent {
  type: string            // "Performance Degradation" | "Availability" | "Security" | "Cost Anomaly"
  service: string
  org: string
  confidence: number      // 0-100
  timeWindow: string      // "last 2h"
  severityEstimate: Severity
}

export interface ContextItem { icon: string; label: string; value: string; flag?: boolean }

export interface PipelineAgent {
  id: string; name: string; icon: string; color: string
  mission: string         // one-line brief
  dataSource: string
  startOffset: number     // ms after dispatch phase ends
  duration: number        // ms of "working"
  queries: string[]       // actual queries shown while working
  stats: string           // "Analyzed 847 log lines, 12 error patterns"
  findings: AgentFinding[]
  insight: string
}

export interface PipelineCorrelation {
  crossRefs: string[]     // "Log errors correlate with Metrics spike (97% confidence)"
  quality: 'STRONG' | 'MODERATE' | 'WEAK'
  sourcesCount: number
}

export interface PipelineHypothesis { text: string; probability: number }

export interface PipelineImpact {
  services: string[]
  users?: string
  revenue?: string
  sloGap?: string
  sloBreached?: boolean
}

export interface PipelineReport {
  headline: string
  severity: Severity
  rootCause: string
  confidence: number
  timeline?: string
  summary: string
  actions: ActionItem[]
  followUps: string[]
}

export interface Pipeline {
  id: string
  intent: PipelineIntent
  context: ContextItem[]
  agents: PipelineAgent[]
  correlation: PipelineCorrelation
  hypotheses: PipelineHypothesis[]
  impact: PipelineImpact
  report: PipelineReport
  sources: string[]
}

// ─── SCENARIO: Billing Degradation ───────────────────────────────────────────
const BILLING: Pipeline = {
  id: 'billing',
  intent: { type: 'Performance Degradation', service: 'billing-service', org: 'Netflix', confidence: 94, timeWindow: 'last 2h', severityEstimate: 'high' },
  context: [
    { icon: '🗺️', label: 'Service topology', value: '12 downstream dependencies loaded' },
    { icon: '🚀', label: 'Recent deploys', value: 'bill-87 (2d ago), bill-88 (12h ago) ← flagged', flag: true },
    { icon: '📊', label: 'SLO baseline', value: 'P99 = 180ms · Error rate baseline 0.2%' },
    { icon: '🔎', label: 'Similar incidents', value: 'INC-1842 (Oct 2024) — Stripe rate limit storm' },
  ],
  agents: [
    {
      id: 'sentinel', name: 'Sentinel', icon: '🛡️', color: '#34d399',
      mission: 'Find ERROR patterns and latency anomalies in billing-service',
      dataSource: 'Datadog APM', startOffset: 0, duration: 2200,
      queries: [
        'SELECT * FROM billing_logs WHERE level=\'ERROR\' AND ts > now()-2h',
        'metrics.query("billing.request.p99{env:prod}", last="2h")',
      ],
      stats: 'Analyzed 847 log lines · 8 critical error patterns',
      findings: [
        { label: 'Error Rate', value: '8.4%', status: 'critical', delta: '+4,100%' },
        { label: 'P99 Latency', value: '4,230ms', status: 'critical', delta: '+23×' },
        { label: 'Throughput', value: '2,100 rpm', status: 'ok' },
        { label: 'Top Error', value: 'ConnTimeout → Stripe', status: 'critical' },
      ],
      insight: 'Error spike isolates to Stripe webhook handler. Began 2d ago, accelerated 12h ago.',
    },
    {
      id: 'arbiter', name: 'Arbiter', icon: '⚖️', color: '#fbbf24',
      mission: 'Correlate deploys, feature flags, and config changes with incident onset',
      dataSource: 'GitHub + LaunchDarkly', startOffset: 300, duration: 1900,
      queries: [
        'git log --since=3d billing-service --grep="webhook"',
        'launchdarkly.flags.get("stripe_batch_webhooks_v2")',
      ],
      stats: 'Scanned 4 deploys · 12 config changes · 3 feature flags',
      findings: [
        { label: 'Last Deploy', value: 'bill-88', status: 'info', delta: '12h ago' },
        { label: 'Root Deploy', value: 'bill-87 ← batch 50→500', status: 'critical', delta: '2d ago' },
        { label: 'Flag Active', value: 'stripe_batch_webhooks_v2', status: 'warning' },
        { label: 'Impact Onset', value: '2d ago (bill-87)', status: 'critical' },
      ],
      insight: 'bill-87 increased webhook batch size 10×, directly triggering Stripe rate limiting.',
    },
    {
      id: 'navigator', name: 'Navigator', icon: '🧭', color: '#22d3ee',
      mission: 'Analyze Stripe API telemetry and internal retry queue depth',
      dataSource: 'Stripe Tracing + Internal APM', startOffset: 600, duration: 2000,
      queries: [
        'stripe.webhooks.queue.depth{service:billing} last 4h',
        'trace.spans.p99{operation:stripe_webhook_deliver} window:2h',
      ],
      stats: 'Sampled 12,400 Stripe API events · queue depth history 4h',
      findings: [
        { label: 'Queue Depth', value: '43,200', status: 'critical', delta: '54× normal' },
        { label: 'Rate Limit Hits', value: '12,400/min', status: 'critical' },
        { label: 'Delivery P99', value: '4,100ms', status: 'critical' },
        { label: 'Stripe Status', value: 'No incident', status: 'ok' },
      ],
      insight: 'Retry storm confirmed: batch increase → rate limiting → queue overflow.',
    },
  ],
  correlation: {
    crossRefs: [
      'Log errors correlate with Metrics spike (97% confidence)',
      'Deploy bill-87 timestamp aligns with degradation onset (99% confidence)',
      'Trace bottleneck confirms Stripe API as chokepoint (95% confidence)',
    ],
    quality: 'STRONG', sourcesCount: 3,
  },
  hypotheses: [
    { text: 'bill-87 increased Stripe webhook batch 50→500, triggering rate limits + retry storm', probability: 92 },
    { text: 'Stripe server-side rate limit policy change (independent of deploy)', probability: 6 },
    { text: 'Traffic surge exceeding previous webhook throughput capacity', probability: 2 },
  ],
  impact: { services: ['billing-service', 'payment-api', 'subscription-service'], users: '~14,200 payment failures', revenue: '~$47,000/hr at risk', sloGap: '7.4pp below SLO target', sloBreached: true },
  report: {
    headline: 'Stripe Webhook Retry Storm — Caused by bill-87',
    severity: 'high', rootCause: 'Deploy bill-87 increased webhook batch size 50→500, exceeding Stripe API rate limits and triggering a retry storm that saturated the queue to 43,200 messages (54× normal).', confidence: 92,
    timeline: '2d ago: bill-87 deployed → rate limiting begins → queue builds → 12h ago: bill-88 deployed → queue draining',
    summary: 'bill-88 is now live and queue is draining (ETA 25–35 min to full recovery). Root cause is fully identified.',
    actions: [
      { label: 'bill-88 deployed — batch size restored to 100', done: true, priority: 'done' },
      { label: 'Monitor retry queue — target < 2K in 15 min', done: false, priority: 'monitor' },
      { label: 'Disable flag stripe_batch_webhooks_v2 if queue stalls > 5K', done: false, priority: 'urgent' },
      { label: 'Add circuit breaker on Stripe webhook delivery path', done: false, priority: 'info' },
    ],
    followUps: ['What\'s the current queue drain rate?', 'Show me bill-88 diff', 'Set up alert for queue depth > 2K'],
  },
  sources: ['Datadog APM', 'Stripe Internal Tracing', 'GitHub Deploys', 'LaunchDarkly'],
}

// ─── SCENARIO: CDN Edge Latency ───────────────────────────────────────────────
const CDN: Pipeline = {
  id: 'cdn',
  intent: { type: 'Availability Degradation', service: 'cdn-router', org: 'Netflix', confidence: 97, timeWindow: 'last 45m', severityEstimate: 'critical' },
  context: [
    { icon: '🌐', label: 'OC PoP topology', value: '233 Points of Presence scanned' },
    { icon: '📡', label: 'BGP feed', value: 'FRA-1 peering event detected at 21:15 UTC', flag: true },
    { icon: '📊', label: 'QoE baseline', value: 'Rebuffer rate baseline 0.08% · P1 threshold 0.5%' },
    { icon: '🔎', label: 'Similar incidents', value: 'INC-0931 (Mar 2024) — AMS-1 BGP outage, 2.1M impacted' },
  ],
  agents: [
    {
      id: 'arbiter', name: 'Arbiter', icon: '⚖️', color: '#fbbf24',
      mission: 'Scan all 233 OC PoPs for health anomalies and BGP state',
      dataSource: 'Open Connect NOC', startOffset: 0, duration: 2400,
      queries: ['oc.pop.health{region:EMEA} last 2h', 'bgp.session.state{pop:FRA-1}'],
      stats: 'Scanned 233 PoPs · 12 BGP session events analyzed',
      findings: [
        { label: 'Degraded PoPs', value: '4 / 233', status: 'warning', delta: 'FRA-1, AMS-2, CDG-1, LHR-3' },
        { label: 'Cache Hit Ratio', value: '94.2%', status: 'warning', delta: '-4.5pp' },
        { label: 'Rerouted Traffic', value: '~2.1 Tbps', status: 'warning' },
        { label: 'BGP Cause', value: 'FRA-1 ↔ DT AS3320 lost', status: 'critical' },
      ],
      insight: 'FRA-1 lost BGP peering with Deutsche Telekom at 21:15 UTC. Adjacent PoPs absorbing overflow.',
    },
    {
      id: 'cortex', name: 'Cortex', icon: '🧠', color: '#f472b6',
      mission: 'Analyze origin server capacity and cache miss surge impact',
      dataSource: 'AWS CloudWatch', startOffset: 400, duration: 1800,
      queries: ['cloudwatch.metric("OriginRequestRate", "last 2h")', 's3.get.p99{bucket:content-store} 2h'],
      stats: 'Queried 8 origin fleet metrics · 1,200 encoder nodes polled',
      findings: [
        { label: 'Origin Req Rate', value: '+340%', status: 'critical', delta: 'cache miss surge' },
        { label: 'S3 GET P99', value: '1,840ms', status: 'critical', delta: 'vs 120ms normal' },
        { label: 'Origin CPU', value: '87%', status: 'warning', delta: 'threshold 70%' },
        { label: 'Encoder Fleet', value: '1,200 nodes', status: 'ok' },
      ],
      insight: 'Origin is under severe stress. Recommend scaling +400 nodes immediately.',
    },
    {
      id: 'sentinel', name: 'Sentinel', icon: '🛡️', color: '#34d399',
      mission: 'Measure real-time user QoE impact and SLO breach timeline',
      dataSource: 'QoE Dashboard + Grafana', startOffset: 800, duration: 1600,
      queries: ['qoe.rebuffer_rate{region:eu-west} last 1h', 'slo.burn_rate{service:cdn-router} 30m'],
      stats: 'Sampled 4.2M active sessions · rebuffer events correlated',
      findings: [
        { label: 'Users Affected', value: '~4.2M', status: 'critical', delta: 'Western Europe' },
        { label: 'Rebuffer Rate', value: '0.38%', status: 'warning', delta: '↑ vs 0.08% normal' },
        { label: 'SLO Headroom', value: '24%', status: 'warning', delta: 'P1 at 0.5%' },
        { label: 'P1 ETA', value: '~8 min', status: 'critical', delta: 'without action' },
      ],
      insight: 'P1 SLO breach in ~8 min at current trajectory. BGP restore or origin scale needed now.',
    },
  ],
  correlation: {
    crossRefs: ['FRA-1 BGP loss at 21:15 correlates exactly with cache hit ratio drop (100%)', 'Origin request surge confirms cache miss propagation (98% confidence)', 'QoE rebuffer trend confirms user-facing impact chain (97% confidence)'],
    quality: 'STRONG', sourcesCount: 3,
  },
  hypotheses: [
    { text: 'FRA-1 BGP peering loss with Deutsche Telekom caused traffic reroute + origin stress', probability: 97 },
    { text: 'FRA-1 hardware/software failure (unrelated to BGP)', probability: 2 },
    { text: 'Upstream ISP route flap independent of FRA-1 BGP session', probability: 1 },
  ],
  impact: { services: ['cdn-router', 'streaming-api', 'content-delivery'], users: '~4.2M EU viewers', revenue: 'P1 SLO breach in ~8 min', sloGap: 'P1 threshold at 0.5% rebuffer', sloBreached: false },
  report: {
    headline: 'FRA-1 BGP Outage — 4.2M EU Viewers Impacted',
    severity: 'critical', rootCause: 'Frankfurt PoP (FRA-1) lost BGP peering with Deutsche Telekom (AS3320) at 21:15 UTC. Traffic rerouted but adjacent PoPs degraded. Origin absorbing 340% excess cache-miss load.', confidence: 97,
    timeline: '21:15 UTC: BGP session down → 21:17: traffic reroutes → 21:22: origin CPU 87% → 21:28: P1 breach in ~8 min',
    summary: 'Immediate action required. OC NOC must restore FRA-1 BGP or origin scale needed within 8 minutes.',
    actions: [
      { label: 'OC NOC: Restore FRA-1 BGP peering with DT AS3320', done: false, priority: 'urgent' },
      { label: 'Scale origin fleet +400 nodes (Cortex can automate)', done: false, priority: 'urgent' },
      { label: 'Pre-warm AMS-3 + MUC-1 caches for EU top-50 titles', done: false, priority: 'monitor' },
      { label: 'Declare P1 and open war room if FRA-1 unresolved in 15 min', done: false, priority: 'info' },
    ],
    followUps: ['What\'s FRA-1 BGP restore ETA?', 'Can Cortex auto-scale origin?', 'Show me the reroute traffic breakdown'],
  },
  sources: ['Open Connect Telemetry', 'AWS CloudWatch', 'QoE Dashboard', 'Grafana'],
}

// ─── SCENARIO: ML Recommendation Drift ───────────────────────────────────────
const ML: Pipeline = {
  id: 'ml',
  intent: { type: 'Quality Degradation', service: 'recommendation-engine', org: 'Netflix', confidence: 88, timeWindow: 'last 6h', severityEstimate: 'medium' },
  context: [
    { icon: '🤖', label: 'Model version', value: 'rec-v8.2.1 deployed 3d ago · A/B active' },
    { icon: '🗄️', label: 'Feature store', value: 'Flink watch_history_agg job — last run check pending', flag: true },
    { icon: '📊', label: 'CTR baseline', value: '7d avg CTR 3.41% · diversity target >0.70' },
    { icon: '🔎', label: 'Similar incidents', value: 'INC-2103 (Jan 2025) — Kafka consumer lag → stale features' },
  ],
  agents: [
    {
      id: 'navigator', name: 'Navigator', icon: '🧭', color: '#22d3ee',
      mission: 'Analyze model serving quality and prediction drift metrics',
      dataSource: 'Triton Model Server', startOffset: 0, duration: 2100,
      queries: ['triton.model.ctr{model:rec-v8.2.1} last 6h', 'triton.prediction.diversity_score last 6h'],
      stats: 'Analyzed 3.5M inference events · CTR trend across 6h',
      findings: [
        { label: 'CTR (6h)', value: '3.12%', status: 'warning', delta: '-8.5% vs 7d avg' },
        { label: 'Serving P99', value: '38ms', status: 'ok', delta: 'SLO: 40ms' },
        { label: 'Diversity Score', value: '0.61', status: 'warning', delta: 'target: >0.70' },
        { label: 'Model Version', value: 'rec-v8.2.1', status: 'ok', delta: '3d ago' },
      ],
      insight: 'Model serving is healthy (38ms P99). Quality drop is data, not model.',
    },
    {
      id: 'cortex', name: 'Cortex', icon: '🧠', color: '#f472b6',
      mission: 'Check feature store freshness, Flink job state, and embedding drift',
      dataSource: 'Cassandra + Apache Flink', startOffset: 300, duration: 2000,
      queries: ['flink.job.status{name:watch_history_agg}', 'feature.age{feature_group:watch_history}'],
      stats: 'Checked 14 Flink jobs · KL divergence computed on 28M feature vectors',
      findings: [
        { label: 'Feature Age', value: '7h stale', status: 'critical', delta: 'expected: 30min' },
        { label: 'KL Divergence', value: '0.42', status: 'critical', delta: 'threshold: 0.35' },
        { label: 'Flink Job', value: 'FAILED', status: 'critical', delta: 'watch_history_agg' },
        { label: 'Failed At', value: '14:22 UTC', status: 'warning' },
      ],
      insight: 'Flink job watch_history_agg failed 7h ago. Watch-history embeddings are stale.',
    },
    {
      id: 'operon', name: 'Operon AI', icon: '🤖', color: '#818cf8',
      mission: 'Validate via A/B holdback experiment and confirm root cause',
      dataSource: 'A/B Platform', startOffset: 600, duration: 1400,
      queries: ['abtest.ctr{experiment:rec-v8-vs-holdback, period:6h}', 'holdback.features.age{group:control}'],
      stats: 'Cross-referenced 2 experiment arms · 1.2M impressions analyzed',
      findings: [
        { label: 'v8.2.1 CTR', value: '3.12%', status: 'warning', delta: 'stale features' },
        { label: 'Holdback CTR', value: '3.39%', status: 'ok', delta: 'fresh features' },
        { label: 'Delta', value: '-0.27pp', status: 'critical', delta: 'p < 0.001' },
        { label: 'Conclusion', value: 'Data issue, not model', status: 'info' },
      ],
      insight: 'Holdback confirms: pipeline failure is root cause. No model rollback needed.',
    },
  ],
  correlation: {
    crossRefs: ['CTR drop aligns exactly with Flink failure timestamp (99% confidence)', 'KL divergence spike confirms feature distribution shift (96% confidence)', 'A/B holdback independently validates data pipeline as root cause (p < 0.001)'],
    quality: 'STRONG', sourcesCount: 3,
  },
  hypotheses: [
    { text: 'Flink watch_history_agg failure → stale embeddings → narrow recommendations → CTR drop', probability: 94 },
    { text: 'Model rec-v8.2.1 quality regression independent of feature staleness', probability: 4 },
    { text: 'User behavior shift / seasonal CTR change unrelated to infrastructure', probability: 2 },
  ],
  impact: { services: ['recommendation-engine', 'homepage-api', 'search-ranker'], users: '~3.5M impressions affected', revenue: '~0.27pp CTR gap × 3.5M impressions', sloGap: 'CTR -8.5% below 7d baseline' },
  report: {
    headline: 'Flink Pipeline Failure — Watch-History Features Stale for 7h',
    severity: 'medium', rootCause: 'Flink job watch_history_agg failed at 14:22 UTC. Watch-history embeddings are 7h stale, causing narrow, repetitive recommendations and 8.5% CTR drop.', confidence: 94,
    timeline: '14:22 UTC: Flink job fails → embeddings start aging → 21:00 UTC: CTR drop detected → 7h total impact',
    summary: 'Restarting Flink will recover CTR in <10 min. No model rollback needed. A/B holdback confirms.',
    actions: [
      { label: 'Restart Flink job watch_history_agg — recovery in <10 min', done: false, priority: 'urgent' },
      { label: 'Monitor KL divergence — target < 0.15 post-restart', done: false, priority: 'monitor' },
      { label: 'No model rollback needed — rec-v8.2.1 is healthy', done: true, priority: 'done' },
      { label: 'Add SLO alert: feature freshness > 1h → P2 page', done: false, priority: 'info' },
    ],
    followUps: ['Restart Flink job now?', 'Show me Flink failure logs', 'What was the last successful run?'],
  },
  sources: ['Triton Model Server', 'Feature Store (Cassandra)', 'Apache Flink', 'A/B Platform'],
}

// ─── SCENARIO: Generic Cross-Service Scan ────────────────────────────────────
const GENERIC: Pipeline = {
  id: 'generic',
  intent: { type: 'Cross-Service Health Scan', service: 'all-services', org: 'All Orgs', confidence: 91, timeWindow: 'last 2h', severityEstimate: 'high' },
  context: [
    { icon: '🏢', label: 'Organizations', value: '3 orgs · Netflix, Stripe, Vercel — all scanned' },
    { icon: '📦', label: 'Services', value: '23 total services across 8 domains' },
    { icon: '🚀', label: 'Recent activity', value: '4 deploys in 24h · 1 Flink failure · 1 BGP event', flag: true },
    { icon: '🔎', label: 'Active incidents', value: 'billing-service: 2 · cdn-router: 1 · recommendation: 1' },
  ],
  agents: [
    {
      id: 'sentinel', name: 'Sentinel', icon: '🛡️', color: '#34d399',
      mission: 'Scan all connected monitoring sources for anomaly signals',
      dataSource: 'Datadog + Grafana + CloudWatch', startOffset: 0, duration: 2400,
      queries: ['anomaly.detect{all_services} last 2h threshold:3sigma', 'slo.burn_rate{org:all} last 1h'],
      stats: 'Scanned 23 services · 8,400 metric time-series · 847 anomaly signals',
      findings: [
        { label: 'Healthy Services', value: '20 / 23', status: 'ok' },
        { label: 'billing-service', value: 'Error +4,100%', status: 'critical' },
        { label: 'cdn-router', value: 'Cache hit -12%', status: 'warning' },
        { label: 'recommendation', value: 'CTR -8.5%', status: 'warning' },
      ],
      insight: '3 services anomalous. billing-service is P1 (revenue impact).',
    },
    {
      id: 'arbiter', name: 'Arbiter', icon: '⚖️', color: '#fbbf24',
      mission: 'Correlate all deploys, flag changes, and config mutations with anomalies',
      dataSource: 'GitHub + LaunchDarkly + Config', startOffset: 400, duration: 2000,
      queries: ['git.deploys{all_repos} last 24h', 'config.changes{all_services} last 24h'],
      stats: 'Analyzed 4 deploys · 18 config mutations · 3 flag changes',
      findings: [
        { label: 'Deploys (24h)', value: '4 deploys', status: 'info' },
        { label: 'Root Cause #1', value: 'bill-87 → webhook 50→500', status: 'critical' },
        { label: 'Root Cause #2', value: 'FRA-1 BGP peering lost', status: 'critical' },
        { label: 'Root Cause #3', value: 'Flink job failed 7h ago', status: 'warning' },
      ],
      insight: 'All 3 issues have distinct independent root causes. No shared failure point.',
    },
  ],
  correlation: {
    crossRefs: ['3 anomalies confirmed as independent failures — no shared infrastructure root cause', 'billing and cdn issues both represent active revenue/SLO risk', 'Flink failure is ongoing but lower priority than billing P1'],
    quality: 'STRONG', sourcesCount: 4,
  },
  hypotheses: [
    { text: '3 simultaneous independent failures across billing, CDN, and recommendation engine', probability: 89 },
    { text: 'Shared infrastructure change causing cascade across all three services', probability: 8 },
    { text: 'External dependency failure (cloud provider, network) affecting multiple services', probability: 3 },
  ],
  impact: { services: ['billing-service', 'cdn-router', 'recommendation-engine'], users: '~18M+ users across all issues', revenue: 'billing: $47k/hr · CDN: P1 breach risk' },
  report: {
    headline: '3 Independent Issues Detected Across Services',
    severity: 'high', rootCause: '3 simultaneous but independent failures: billing (Stripe retry storm from bill-87), CDN (FRA-1 BGP outage affecting 4.2M EU viewers), recommendation (Flink pipeline failure causing stale features).', confidence: 89,
    timeline: '2d ago: bill-87 → 7h ago: Flink fails → 21:15 UTC: FRA-1 BGP drops',
    summary: 'Triage in priority order: billing P1 → CDN P1 → recommendation P2. All have known root causes.',
    actions: [
      { label: 'billing-service: Monitor retry queue drain (25–35 min ETA)', done: false, priority: 'urgent' },
      { label: 'CDN: OC NOC restore FRA-1 BGP peering immediately', done: false, priority: 'urgent' },
      { label: 'recommendation: Restart Flink watch_history_agg', done: false, priority: 'monitor' },
      { label: 'Open P1 bridge for billing + CDN if not resolved in 15 min', done: false, priority: 'info' },
    ],
    followUps: ['Deep-dive into billing-service?', 'CDN blast radius details?', 'Restart Flink automatically?'],
  },
  sources: ['Datadog APM', 'Grafana', 'CloudWatch', 'GitHub', 'LaunchDarkly', 'Apache Flink'],
}

// ─── Matcher ──────────────────────────────────────────────────────────────────
export function matchPipeline(query: string): Pipeline {
  const q = query.toLowerCase()
  if (q.includes('billing') || q.includes('stripe') || q.includes('webhook') || q.includes('invoice')) return BILLING
  if (q.includes('cdn') || q.includes('edge') || q.includes('rebuffer') || q.includes('frankfurt') || q.includes('latency spike') || q.includes('bgp')) return CDN
  if (q.includes('recommendation') || q.includes('ctr') || q.includes('flink') || q.includes('feature') || q.includes('ml') || q.includes('model')) return ML
  return GENERIC
}

export const QUICK_PROMPTS = [
  { label: '🧾 Billing service degradation', prompt: 'Why is the Netflix billing service degraded right now?' },
  { label: '📡 CDN edge latency spike', prompt: 'Investigate CDN edge latency spike in Western Europe' },
  { label: '🤖 Recommendation CTR drop', prompt: 'Why has recommendation engine CTR dropped 8% in the last 6 hours?' },
  { label: '💳 Stripe payment health', prompt: 'Run a health check across all Stripe payment services' },
  { label: '🔍 Cross-service anomaly scan', prompt: 'Scan for anomalies across all services in the last 2 hours' },
  { label: '🌐 CDN FRA-1 BGP outage', prompt: 'Investigate the CDN FRA-1 BGP outage impact on EU viewers' },
]
