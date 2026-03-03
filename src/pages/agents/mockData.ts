import type { Agent, AgentLog } from './types';

export const MOCK_AGENTS: Omit<Agent, 'id' | 'org_id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Sentinel',
    type: 'monitor',
    status: 'active',
    tasks_completed_today: 142,
    current_task: 'Monitoring CloudWatch metrics for payment-service — anomaly score 0.74',
    capabilities: ['metrics', 'logs', 'alerting', 'anomaly-detection'],
    config: {},
  },
  {
    name: 'Hermes',
    type: 'investigator',
    status: 'active',
    tasks_completed_today: 37,
    current_task: 'Correlating deploy events with p95 latency spike on checkout-api',
    capabilities: ['root-cause', 'correlation', 'tracing', 'log-analysis'],
    config: {},
  },
  {
    name: 'Atlas',
    type: 'knowledge',
    status: 'idle',
    tasks_completed_today: 18,
    current_task: null,
    capabilities: ['document-search', 'runbook-lookup', 'knowledge-synthesis'],
    config: {},
  },
  {
    name: 'Patcher',
    type: 'remediation',
    status: 'active',
    tasks_completed_today: 9,
    current_task: 'Executing rollback of feature flag ff_new_checkout_v2 in production',
    capabilities: ['rollback', 'scaling', 'config-update', 'restart'],
    config: {},
  },
  {
    name: 'Tribune',
    type: 'reporter',
    status: 'idle',
    tasks_completed_today: 24,
    current_task: null,
    capabilities: ['postmortem', 'summary', 'incident-timeline', 'stakeholder-comms'],
    config: {},
  },
  {
    name: 'Triton',
    type: 'triage',
    status: 'error',
    tasks_completed_today: 0,
    current_task: 'Failed to connect to PagerDuty API — retrying (attempt 4/5)',
    capabilities: ['severity-scoring', 'escalation', 'pagerduty', 'oncall-routing'],
    config: {},
  },
];

const LOG_TEMPLATES: Record<string, string[]> = {
  monitor: [
    'Polling CloudWatch namespace AWS/ECS for anomalies',
    'Ingested 1,240 metric data points from Datadog',
    'Threshold breach detected: cpu_utilization > 85% on web-server-12',
    'Alert deduplication: merged 3 similar alerts into incident #INV-2041',
    'Heartbeat check passed for all 6 integrations',
    'Rolling baseline updated — p99 latency for checkout-api: 420ms',
    'Anomaly score computed: 0.74 — escalating to investigator agent',
    'Streaming logs from Splunk index main — 8,302 events/min',
    'No new alerts in the last 5 minutes, system nominal',
    'Scheduled scan complete: 0 critical alerts, 2 warnings',
  ],
  investigator: [
    'Fetching correlated events from 3 data sources',
    'Deploy detected at 14:32 UTC — correlating with latency metrics',
    'Root cause hypothesis: DB connection pool exhaustion (confidence 0.88)',
    'Querying trace data from Jaeger for request ID 7f3a91c',
    'GitHub commit a1b2c3d linked to service degradation',
    'Timeline reconstruction complete — 4 contributing factors identified',
    'Generating evidence graph for investigation INV-2041',
    'Checking feature flag history — ff_new_checkout_v2 enabled at T-12min',
    'Correlation found: LaunchDarkly flag change → error rate +2.3%',
    'Investigation report draft generated, pending review',
  ],
  knowledge: [
    'Indexing uploaded runbook: payment-service-recovery.md',
    'Semantic search query: "database connection timeout remediation"',
    'Retrieved 3 matching playbooks for incident type: latency_spike',
    'Knowledge base updated with postmortem from INV-1987',
    'Embedding model: gte-small — 768 dimensions',
    'Cache hit ratio: 74% (last 1,000 queries)',
    'New document ingested: architecture-overview-v3.pdf',
    'Similarity search complete — top match score: 0.91',
  ],
  remediation: [
    'Executing rollback plan: step 1/4 — disabling feature flag',
    'Feature flag ff_new_checkout_v2 disabled via LaunchDarkly API',
    'Scaling ECS service checkout-api from 4 to 8 tasks',
    'ECS deployment stabilized — all 8 tasks healthy',
    'Waiting for connection pool metrics to normalize',
    'Rollback step 3/4 complete — monitoring for 60s',
    'Remediation successful — error rate returned to baseline',
    'Post-action report saved to investigation INV-2041',
    'Rollback complete in 4m 22s',
    'Notifying on-call engineer: remediation applied automatically',
  ],
  reporter: [
    'Generating postmortem for INV-2038 — resolved 2h ago',
    'Drafting incident timeline from 14 correlated events',
    'Executive summary generated — severity P2, impact: 1,200 users',
    'Slack notification sent to #incidents channel',
    'PDF report queued for export',
    'Stakeholder email draft created for engineering leadership',
    'MTTR calculated: 47 minutes',
    'Adding contributing factors to postmortem document',
    'Postmortem published to Confluence — link shared',
    'Weekly digest compiled: 3 incidents, avg MTTR 62min',
  ],
  triage: [
    'ERROR: PagerDuty API returned 503 Service Unavailable',
    'Retrying PagerDuty connection (attempt 1/5) — backoff: 5s',
    'Retrying PagerDuty connection (attempt 2/5) — backoff: 10s',
    'Retrying PagerDuty connection (attempt 3/5) — backoff: 20s',
    'Retrying PagerDuty connection (attempt 4/5) — backoff: 40s',
    'CRITICAL: Unable to route on-call escalation for INV-2041',
    'Fallback: emailing engineering@company.com directly',
    'Severity scoring model loaded — v2.1',
    'Last successful triage: INV-2040 — escalated to L2',
    'Health check failed: pagerduty_webhook endpoint unreachable',
  ],
};

const LOG_LEVELS: Record<string, ('info' | 'warn' | 'error' | 'debug')[]> = {
  monitor: ['info', 'info', 'warn', 'info', 'info', 'info', 'warn', 'info', 'info', 'info'],
  investigator: ['info', 'info', 'info', 'debug', 'info', 'info', 'info', 'info', 'info', 'info'],
  knowledge: ['info', 'debug', 'info', 'info', 'debug', 'info', 'info', 'info'],
  remediation: ['info', 'info', 'info', 'info', 'warn', 'info', 'info', 'info', 'info', 'info'],
  reporter: ['info', 'info', 'info', 'info', 'info', 'info', 'info', 'info', 'info', 'info'],
  triage: ['error', 'warn', 'warn', 'warn', 'warn', 'error', 'info', 'info', 'info', 'error'],
};

export const generateMockLogs = (agentType: string, agentId: string): AgentLog[] => {
  const templates = LOG_TEMPLATES[agentType] || LOG_TEMPLATES.monitor;
  const levels = LOG_LEVELS[agentType] || LOG_LEVELS.monitor;
  const now = Date.now();

  return Array.from({ length: 20 }, (_, i) => ({
    id: `mock-${agentId}-${i}`,
    agent_id: agentId,
    level: levels[i % levels.length],
    message: templates[i % templates.length],
    metadata: {},
    created_at: new Date(now - (20 - i) * 47000).toISOString(),
  }));
};

export const ALL_CAPABILITIES = [
  'metrics', 'logs', 'alerting', 'anomaly-detection',
  'root-cause', 'correlation', 'tracing', 'log-analysis',
  'document-search', 'runbook-lookup', 'knowledge-synthesis',
  'rollback', 'scaling', 'config-update', 'restart',
  'postmortem', 'summary', 'incident-timeline', 'stakeholder-comms',
  'severity-scoring', 'escalation', 'pagerduty', 'oncall-routing',
];
