// ─── Agentic Workflow Mock Engine ─────────────────────────────────────────────

export type FindingStatus = 'ok' | 'warning' | 'critical' | 'info'

export interface AgentFinding {
  label: string
  value: string
  status: FindingStatus
  delta?: string
}

export interface AgentTask {
  id: string
  agentName: string
  agentIcon: string
  agentColor: string
  taskLabel: string       // what the agent is doing right now
  dataSource: string      // "Datadog APM", "GitHub", etc.
  duration: number        // ms of "working" before findings appear
  findings: AgentFinding[]
  insight: string         // 1-2 sentence key takeaway
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'healthy'

export interface ActionItem {
  label: string
  done: boolean
  priority: 'urgent' | 'monitor' | 'done' | 'info'
}

export interface SynthesisData {
  headline: string
  severity: Severity
  summary: string
  actions: ActionItem[]
  eta?: string
}

export interface Workflow {
  planTitle: string
  planItems: string[]
  tasks: AgentTask[]
  synthesis: SynthesisData
  sources: string[]
}

// ─── Scenario: Billing Service Degradation ────────────────────────────────────
const BILLING: Workflow = {
  planTitle: 'Investigating billing service degradation',
  planItems: [
    'Query Datadog APM for error rate and latency anomalies',
    'Correlate recent deploys and feature flag changes',
    'Analyze Stripe webhook queue depth and API telemetry',
    'Synthesize root cause and remediation path',
  ],
  tasks: [
    {
      id: 'sentinel-billing', agentName: 'Sentinel', agentIcon: '🛡️', agentColor: '#34d399',
      taskLabel: 'Querying Datadog APM — Billing Service', dataSource: 'Datadog APM',
      duration: 1100,
      findings: [
        { label: 'Error Rate',    value: '8.4%',    status: 'critical', delta: '+4,100%' },
        { label: 'P99 Latency',   value: '4,230ms', status: 'critical', delta: '+23×' },
        { label: 'Throughput',    value: '2,100 rpm', status: 'ok' },
        { label: 'Top Error',     value: 'ConnTimeoutException → Stripe', status: 'critical' },
      ],
      insight: 'Error spike isolates to Stripe webhook handler. Began 2d ago, accelerated 12h ago.',
    },
    {
      id: 'arbiter-billing', agentName: 'Arbiter', agentIcon: '⚖️', agentColor: '#fbbf24',
      taskLabel: 'Correlating deploys & feature flags', dataSource: 'GitHub + LaunchDarkly',
      duration: 900,
      findings: [
        { label: 'Last Deploy',   value: 'bill-88', status: 'info', delta: '12h ago' },
        { label: 'Root Deploy',   value: 'bill-87 ← batch 50→500', status: 'critical', delta: '2d ago' },
        { label: 'Flag Active',   value: 'stripe_batch_webhooks_v2', status: 'warning' },
        { label: 'Impact Onset',  value: '2d ago  (bill-87)', status: 'critical' },
      ],
      insight: 'bill-87 increased webhook batch size 10×, directly triggering Stripe rate limiting.',
    },
    {
      id: 'navigator-billing', agentName: 'Navigator', agentIcon: '🧭', agentColor: '#22d3ee',
      taskLabel: 'Analyzing Stripe API & retry queue', dataSource: 'Stripe Tracing + Internal APM',
      duration: 1000,
      findings: [
        { label: 'Queue Depth',   value: '43,200', status: 'critical', delta: '54× normal' },
        { label: 'Rate Limit Hits', value: '12,400/min', status: 'critical' },
        { label: 'Delivery P99', value: '4,100ms', status: 'critical' },
        { label: 'Stripe Status', value: 'No incident', status: 'ok' },
      ],
      insight: 'Retry storm confirmed: batch increase → rate limiting → queue overflow. bill-88 is draining the queue.',
    },
  ],
  synthesis: {
    headline: 'Stripe Webhook Retry Storm — Caused by bill-87',
    severity: 'high',
    summary: 'Deploy bill-87 (2d ago) increased webhook batch size 50→500, triggering Stripe API rate limiting. Retry storm saturated queue to 43,200 messages (normal: ~800). bill-88 is live and queue is draining — ETA 25–35 min to full recovery.',
    actions: [
      { label: 'bill-88 deployed — batch size restored to 100', done: true, priority: 'done' },
      { label: 'Monitor retry queue — target < 2K in 15 min', done: false, priority: 'monitor' },
      { label: 'Disable flag stripe_batch_webhooks_v2 if queue stalls > 5K', done: false, priority: 'urgent' },
      { label: 'Add circuit breaker on Stripe webhook delivery path', done: false, priority: 'info' },
    ],
    eta: '25–35 min',
  },
  sources: ['Datadog APM', 'Stripe Internal Tracing', 'GitHub Deploys', 'LaunchDarkly'],
}

// ─── Scenario: CDN Edge Latency ───────────────────────────────────────────────
const CDN: Workflow = {
  planTitle: 'Investigating CDN edge latency spike in Western Europe',
  planItems: [
    'Scan all 233 Open Connect PoPs for health anomalies',
    'Check BGP routing and cache hit ratio trends',
    'Assess origin server load and capacity headroom',
    'Quantify user-facing QoE impact and SLO risk',
  ],
  tasks: [
    {
      id: 'arbiter-cdn', agentName: 'Arbiter', agentIcon: '⚖️', agentColor: '#fbbf24',
      taskLabel: 'Scanning Open Connect PoP telemetry', dataSource: 'Open Connect NOC',
      duration: 1200,
      findings: [
        { label: 'Degraded PoPs', value: '4 / 233', status: 'warning', delta: 'FRA-1, AMS-2, CDG-1, LHR-3' },
        { label: 'Cache Hit Ratio', value: '94.2%', status: 'warning', delta: '-4.5pp' },
        { label: 'Rerouted Traffic', value: '~2.1 Tbps', status: 'warning' },
        { label: 'BGP Cause', value: 'FRA-1 ↔ DT AS3320 peering lost', status: 'critical' },
      ],
      insight: 'FRA-1 lost BGP peering with Deutsche Telekom at 21:15 UTC. Adjacent PoPs absorbing overflow but degrading.',
    },
    {
      id: 'cortex-cdn', agentName: 'Cortex', agentIcon: '🧠', agentColor: '#f472b6',
      taskLabel: 'Analyzing origin server capacity', dataSource: 'AWS CloudWatch',
      duration: 900,
      findings: [
        { label: 'Origin Req Rate', value: '+340%', status: 'critical', delta: 'cache miss surge' },
        { label: 'S3 GET P99',     value: '1,840ms', status: 'critical', delta: 'vs. 120ms normal' },
        { label: 'Origin CPU',     value: '87%', status: 'warning', delta: 'threshold: 70%' },
        { label: 'Encoder Fleet', value: '1,200 nodes', status: 'ok' },
      ],
      insight: 'Origin is under severe stress from cache misses. Recommend scaling by 400 nodes immediately.',
    },
    {
      id: 'sentinel-cdn', agentName: 'Sentinel', agentIcon: '🛡️', agentColor: '#34d399',
      taskLabel: 'Measuring user QoE impact', dataSource: 'QoE Dashboard + Grafana',
      duration: 800,
      findings: [
        { label: 'Users Affected', value: '~4.2M', status: 'critical', delta: 'Western Europe' },
        { label: 'Rebuffer Rate',  value: '0.38%', status: 'warning', delta: '↑ vs 0.08% normal' },
        { label: 'SLO Headroom',   value: '24%', status: 'warning', delta: 'P1 at 0.5%' },
        { label: 'P1 ETA',        value: '~8 min', status: 'critical', delta: 'if FRA-1 not restored' },
      ],
      insight: 'At current trajectory, P1 SLO breach in ~8 min. Immediate BGP restore or origin scale needed.',
    },
  ],
  synthesis: {
    headline: 'FRA-1 BGP Outage — 4.2M EU Viewers Impacted',
    severity: 'critical',
    summary: 'Frankfurt PoP (FRA-1) lost BGP peering with Deutsche Telekom (AS3320) at 21:15 UTC. Traffic rerouted automatically but adjacent PoPs are degraded. Origin absorbing 340% excess cache-miss traffic. P1 SLO threshold breach in ~8 min if unresolved.',
    actions: [
      { label: 'OC NOC: Restore FRA-1 BGP peering with DT AS3320', done: false, priority: 'urgent' },
      { label: 'Scale origin fleet +400 nodes (Cortex can automate)', done: false, priority: 'urgent' },
      { label: 'Pre-warm AMS-3 + MUC-1 caches for DE/AT/CH top-50 titles', done: false, priority: 'monitor' },
      { label: 'If FRA-1 unresolved in 15 min → declare P1 and open war room', done: false, priority: 'info' },
    ],
    eta: 'P1 SLO breach in ~8 min without action',
  },
  sources: ['Open Connect Telemetry', 'Datadog APM', 'AWS CloudWatch', 'QoE Dashboard'],
}

// ─── Scenario: ML Recommendation Drift ───────────────────────────────────────
const ML: Workflow = {
  planTitle: 'Investigating recommendation engine CTR degradation',
  planItems: [
    'Check model serving latency and prediction quality metrics',
    'Analyze feature store freshness and embedding drift',
    'Validate with A/B experiment holdback data',
    'Determine model vs. data pipeline root cause',
  ],
  tasks: [
    {
      id: 'navigator-ml', agentName: 'Navigator', agentIcon: '🧭', agentColor: '#22d3ee',
      taskLabel: 'Analyzing model serving + prediction quality', dataSource: 'Triton Model Server',
      duration: 1100,
      findings: [
        { label: 'CTR (6h)',       value: '3.12%',   status: 'warning',  delta: '-8.5% vs 7d avg' },
        { label: 'Serving P99',    value: '38ms',    status: 'ok',       delta: 'SLO: 40ms' },
        { label: 'Diversity Score', value: '0.61',   status: 'warning',  delta: 'target: >0.70' },
        { label: 'Model Version',  value: 'rec-v8.2.1', status: 'ok',   delta: '3d ago' },
      ],
      insight: 'Model is serving fine (38ms P99). Quality degradation is not a model issue — looks like stale features.',
    },
    {
      id: 'cortex-ml', agentName: 'Cortex', agentIcon: '🧠', agentColor: '#f472b6',
      taskLabel: 'Checking feature store freshness & drift', dataSource: 'Cassandra + Flink',
      duration: 1000,
      findings: [
        { label: 'Feature Age',    value: '7h stale', status: 'critical', delta: 'expected: 30min' },
        { label: 'KL Divergence',  value: '0.42',     status: 'critical', delta: 'threshold: 0.35' },
        { label: 'Flink Job',      value: 'FAILED',    status: 'critical', delta: 'watch_history_agg' },
        { label: 'Failed At',      value: '14:22 UTC', status: 'warning' },
      ],
      insight: 'Flink job watch_history_agg failed 7h ago. Watch-history embeddings are stale, causing narrow recommendations.',
    },
    {
      id: 'operon-ml', agentName: 'Operon AI', agentIcon: '🤖', agentColor: '#818cf8',
      taskLabel: 'Validating via A/B holdback experiment', dataSource: 'A/B Platform',
      duration: 700,
      findings: [
        { label: 'v8.2.1 CTR',   value: '3.12%', status: 'warning', delta: 'fresh features unavailable' },
        { label: 'v8.1.8 CTR',   value: '3.39%', status: 'ok',      delta: 'holdback — stable' },
        { label: 'Delta',         value: '-0.27pp', status: 'critical', delta: 'p < 0.001' },
        { label: 'Conclusion',    value: 'Feature issue, not model', status: 'info' },
      ],
      insight: 'Holdback confirms: data pipeline failure is root cause. No model rollback needed — restart Flink.',
    },
  ],
  synthesis: {
    headline: 'Flink Pipeline Failure — Watch-History Features Stale for 7h',
    severity: 'medium',
    summary: 'The Flink job watch_history_agg failed at 14:22 UTC (7h ago), leaving recommendation features 7h stale. CTR dropped 8.5% over 6h (~3.5M impressions). A/B holdback confirms this is a data issue, not a model issue. Restarting Flink will recover CTR in <10 min.',
    actions: [
      { label: 'Restart Flink job watch_history_agg — recovery in <10 min', done: false, priority: 'urgent' },
      { label: 'Monitor KL divergence — target < 0.15 post-restart', done: false, priority: 'monitor' },
      { label: 'No model rollback needed — rec-v8.2.1 is healthy', done: true, priority: 'done' },
      { label: 'Add SLO alert: feature freshness > 1h → P2 page', done: false, priority: 'info' },
    ],
    eta: 'CTR recovery in <10 min after Flink restart',
  },
  sources: ['Triton Model Server', 'Feature Store (Cassandra)', 'Apache Flink', 'A/B Platform'],
}

// ─── Scenario: Player DRM ─────────────────────────────────────────────────────
const DRM: Workflow = {
  planTitle: 'Investigating DRM failure spike on LG TVs',
  planItems: [
    'Query DRM error rates segmented by device platform',
    'Correlate with SDK version rollout and CDM OTA updates',
    'Assess blast radius and time-to-resolution',
  ],
  tasks: [
    {
      id: 'sentinel-drm', agentName: 'Sentinel', agentIcon: '🛡️', agentColor: '#34d399',
      taskLabel: 'Querying DRM error rates by platform', dataSource: 'Player SDK Telemetry',
      duration: 1000,
      findings: [
        { label: 'LG WebOS 4.x',    value: '14.3%',  status: 'critical', delta: '+13.8pp' },
        { label: 'LG WebOS 5.x',    value: '0.2%',   status: 'ok' },
        { label: 'Samsung Tizen',   value: '0.1%',   status: 'ok' },
        { label: 'Sessions Hit',    value: '~480K',  status: 'critical', delta: 'LG 4.x only' },
      ],
      insight: 'Impact perfectly isolated to LG WebOS 4.x. Error: ERR_DRM_HANDSHAKE_TIMEOUT after 5,000ms.',
    },
    {
      id: 'arbiter-drm', agentName: 'Arbiter', agentIcon: '⚖️', agentColor: '#fbbf24',
      taskLabel: 'Correlating SDK deploy vs. Widevine CDM update', dataSource: 'GitHub + OTA Feed',
      duration: 900,
      findings: [
        { label: 'SDK Deploy',      value: 'v4.12.1 → 100% LG', status: 'warning', delta: '4h ago' },
        { label: 'Timeout Change',  value: '5s → 2s in v4.12.1', status: 'critical' },
        { label: 'CDM OTA Update',  value: 'Google → LG WebOS 4', status: 'warning', delta: '8h ago' },
        { label: 'CDM Latency',     value: '+3,200ms added', status: 'critical' },
      ],
      insight: 'SDK v4.12.1 reduced timeout 5s→2s. CDM update increased latency +3.2s. Combined = timeout on every auth.',
    },
  ],
  synthesis: {
    headline: 'SDK v4.12.1 Timeout Incompatible with Widevine CDM OTA',
    severity: 'high',
    summary: 'SDK v4.12.1 reduced Widevine handshake timeout from 5s to 2s. Simultaneously, Google pushed a Widevine CDM OTA to LG WebOS 4.x that added +3.2s latency. The SDK timeout is now shorter than CDM acquisition time. Fix (b4e9d3) already deployed with timeout restored to 8s.',
    actions: [
      { label: 'b4e9d3 deployed — DRM timeout restored to 8s', done: true, priority: 'done' },
      { label: 'Monitor LG WebOS 4.x error rate — target < 0.5% in 15 min', done: false, priority: 'monitor' },
      { label: 'Add SDK compat test: handshake P99 > 50% of timeout → block rollout', done: false, priority: 'info' },
    ],
    eta: '10–15 min for error rate to normalize',
  },
  sources: ['Player SDK Telemetry', 'Datadog APM', 'GitHub Deploys', 'Widevine CDM OTA Feed'],
}

// ─── Scenario: Payment Health ─────────────────────────────────────────────────
const PAYMENTS: Workflow = {
  planTitle: 'Running health check across all Stripe payment services',
  planItems: [
    'Query Charges API golden signals',
    'Check payment network rail performance per scheme',
    'Validate Radar fraud pipeline health',
  ],
  tasks: [
    {
      id: 'operon-pay', agentName: 'Operon AI', agentIcon: '🤖', agentColor: '#818cf8',
      taskLabel: 'Querying Charges API golden signals', dataSource: 'Datadog APM + Synthetics',
      duration: 900,
      findings: [
        { label: 'Availability',  value: '99.9994%', status: 'ok',      delta: 'SLO: 99.999%' },
        { label: 'P99 Latency',  value: '112ms',    status: 'ok',      delta: 'limit: 200ms' },
        { label: 'Error Rate',   value: '0.003%',   status: 'ok',      delta: 'limit: 0.01%' },
        { label: 'Auth Rate',    value: '97.2%',    status: 'ok',      delta: 'target: >95%' },
      ],
      insight: 'Charges API is fully healthy. All golden signals well within SLO bounds.',
    },
    {
      id: 'navigator-pay', agentName: 'Navigator', agentIcon: '🧭', agentColor: '#22d3ee',
      taskLabel: 'Checking payment network rail performance', dataSource: 'Stripe Network Router',
      duration: 1000,
      findings: [
        { label: 'Visa',       value: '97.4% auth', status: 'ok' },
        { label: 'Mastercard', value: '96.8% auth', status: 'ok' },
        { label: 'Amex',       value: '98.1% auth', status: 'ok' },
        { label: 'Klarna',     value: '92.1% auth', status: 'warning', delta: '↑ declines (INV-2041)' },
      ],
      insight: 'All rails healthy except Klarna BNPL — already tracked in INV-2041 (Klarna-side issue).',
    },
    {
      id: 'sentinel-pay', agentName: 'Sentinel', agentIcon: '🛡️', agentColor: '#34d399',
      taskLabel: 'Validating Radar fraud pipeline', dataSource: 'Radar ML Pipeline',
      duration: 700,
      findings: [
        { label: 'Decision P99',   value: '31ms',   status: 'ok',  delta: 'SLO: 50ms' },
        { label: 'False Positive', value: '0.82%',  status: 'ok',  delta: 'target: <1%' },
        { label: 'Block Rate',     value: '1.24%',  status: 'ok',  delta: '7d avg: 1.21%' },
        { label: 'Model Version',  value: 'radar-v11.3', status: 'ok', delta: '1d ago' },
      ],
      insight: 'Radar is fully healthy. v11.3 model operating normally with expected block rates.',
    },
  ],
  synthesis: {
    headline: 'Payment System Healthy — One Monitored Issue',
    severity: 'healthy',
    summary: 'All core payment services are operating within SLO bounds. Charges API, Visa, Mastercard, Amex, and Radar are fully healthy. Klarna BNPL shows elevated decline rates (7.9%) — tracked in INV-2041 as a Klarna-side degradation, not Stripe-side.',
    actions: [
      { label: 'Charges API — fully healthy, no action needed', done: true, priority: 'done' },
      { label: 'Radar Engine — healthy, fraud rates normal', done: true, priority: 'done' },
      { label: 'Monitor Klarna BNPL — track INV-2041 for Klarna resolution', done: false, priority: 'monitor' },
    ],
  },
  sources: ['Datadog APM', 'Stripe Network Router', 'Radar ML Pipeline', 'Klarna Status API'],
}

// ─── Generic Fallback ─────────────────────────────────────────────────────────
const GENERIC: Workflow = {
  planTitle: 'Running cross-service investigation',
  planItems: [
    'Scan monitoring signals across all connected services',
    'Correlate recent deploys, flags, and config changes',
    'Identify anomaly patterns and priority ordering',
  ],
  tasks: [
    {
      id: 'sentinel-gen', agentName: 'Sentinel', agentIcon: '🛡️', agentColor: '#34d399',
      taskLabel: 'Scanning all connected monitoring sources', dataSource: 'Datadog + Grafana + CloudWatch',
      duration: 1200,
      findings: [
        { label: 'Healthy Services', value: '20 / 23', status: 'ok' },
        { label: 'billing-service',  value: 'Error +4,100%', status: 'critical' },
        { label: 'cdn-router',       value: 'Cache hit -12%', status: 'warning' },
        { label: 'recommendation',   value: 'CTR -8.5%', status: 'warning' },
      ],
      insight: '3 services show anomalies. billing-service is most critical (direct revenue impact).',
    },
    {
      id: 'arbiter-gen', agentName: 'Arbiter', agentIcon: '⚖️', agentColor: '#fbbf24',
      taskLabel: 'Correlating changes across all services', dataSource: 'GitHub + LaunchDarkly + Config',
      duration: 1000,
      findings: [
        { label: 'Deploys (24h)',    value: '4 deploys', status: 'info' },
        { label: 'Root cause #1',   value: 'bill-87 → webhook batch 50→500', status: 'critical' },
        { label: 'Root cause #2',   value: 'FRA-1 BGP peering lost', status: 'critical' },
        { label: 'Root cause #3',   value: 'Flink job failed 7h ago', status: 'warning' },
      ],
      insight: 'All 3 issues have distinct independent root causes. No shared failure point.',
    },
  ],
  synthesis: {
    headline: '3 Independent Issues Detected Across Services',
    severity: 'high',
    summary: 'Operon found 3 simultaneous but independent service degradations: billing (P1 — revenue impact from Stripe retry storm), CDN (P2 — Frankfurt BGP outage affecting 4.2M EU viewers), and recommendation engine (P2 — Flink pipeline failure causing stale features). No shared root cause.',
    actions: [
      { label: 'billing-service — Monitor retry queue drain (25–35 min ETA)', done: false, priority: 'urgent' },
      { label: 'cdn-router — OC NOC to restore FRA-1 BGP peering', done: false, priority: 'urgent' },
      { label: 'recommendation — Restart Flink job watch_history_agg', done: false, priority: 'monitor' },
      { label: 'Open incident P1 for billing + CDN if not resolved in 15 min', done: false, priority: 'info' },
    ],
    eta: '15 min before P1 escalation needed',
  },
  sources: ['Datadog APM', 'Grafana', 'CloudWatch', 'GitHub', 'LaunchDarkly', 'Apache Flink'],
}

// ─── Matcher ──────────────────────────────────────────────────────────────────
export function matchWorkflow(query: string): Workflow {
  const q = query.toLowerCase()
  if (q.includes('billing') || q.includes('stripe') || q.includes('webhook') || q.includes('invoice')) return BILLING
  if (q.includes('cdn') || q.includes('edge') || q.includes('rebuffer') || q.includes('frankfurt') || q.includes('latency spike')) return CDN
  if (q.includes('recommendation') || q.includes('ctr') || q.includes('flink') || q.includes('feature') || q.includes('ml') || q.includes('model')) return ML
  if (q.includes('drm') || q.includes('player') || q.includes('lg') || q.includes('widevine') || q.includes('playback')) return DRM
  if (q.includes('charges') || q.includes('radar') || q.includes('fraud') || q.includes('health') || q.includes('visa')) return PAYMENTS
  return GENERIC
}

export const QUICK_PROMPTS = [
  { label: '🧾 Billing degradation',     prompt: 'Why is the Netflix billing service degraded right now?' },
  { label: '📡 CDN edge latency spike',  prompt: 'Investigate the CDN edge latency spike in Western Europe' },
  { label: '🤖 Recommendation CTR drop', prompt: 'Why has recommendation engine CTR dropped 8% in the last 6 hours?' },
  { label: '📺 Player DRM failures',    prompt: 'Investigate the Player SDK DRM failure spike on LG TVs' },
  { label: '💳 Payment system health',  prompt: 'Run a health check across all Stripe payment services' },
  { label: '🔍 Cross-service scan',     prompt: 'Correlate events across all integrations in the last 2 hours' },
]
