export interface AuditEntry {
  id: string;
  actor_type: 'human' | 'agent';
  actor_name: string;
  action: string;
  resource_type: string;
  resource_name: string;
  ip_address: string | null;
  created_at: string;
}

const HUMAN_ACTORS = ['alice@company.com', 'bob@company.com', 'carol@company.com', 'dave@company.com'];
const AGENT_ACTORS = ['Sentinel', 'Hermes', 'Atlas', 'Patcher', 'Tribune', 'Triton'];

const ACTION_TEMPLATES: { action: string; resource_type: string; resource_name: () => string; actor_type: 'human' | 'agent' | 'both' }[] = [
  { action: 'auth.login', resource_type: 'session', resource_name: () => 'web-session', actor_type: 'human' },
  { action: 'auth.logout', resource_type: 'session', resource_name: () => 'web-session', actor_type: 'human' },
  { action: 'investigation.launch', resource_type: 'investigation', resource_name: () => `INV-${2000 + Math.floor(Math.random() * 99)}`, actor_type: 'both' },
  { action: 'investigation.resolve', resource_type: 'investigation', resource_name: () => `INV-${2000 + Math.floor(Math.random() * 99)}`, actor_type: 'both' },
  { action: 'investigation.escalate', resource_type: 'investigation', resource_name: () => `INV-${2000 + Math.floor(Math.random() * 99)}`, actor_type: 'both' },
  { action: 'integration.connect', resource_type: 'integration', resource_name: () => ['Datadog', 'PagerDuty', 'AWS CloudWatch', 'Splunk', 'GitHub'][Math.floor(Math.random() * 5)], actor_type: 'human' },
  { action: 'integration.disconnect', resource_type: 'integration', resource_name: () => ['Datadog', 'PagerDuty', 'Grafana'][Math.floor(Math.random() * 3)], actor_type: 'human' },
  { action: 'config.update', resource_type: 'config', resource_name: () => ['org-settings', 'notification-prefs', 'agent-config'][Math.floor(Math.random() * 3)], actor_type: 'human' },
  { action: 'agent.deploy', resource_type: 'agent', resource_name: () => AGENT_ACTORS[Math.floor(Math.random() * AGENT_ACTORS.length)], actor_type: 'human' },
  { action: 'agent.task.complete', resource_type: 'task', resource_name: () => `task-${Math.floor(Math.random() * 9999)}`, actor_type: 'agent' },
  { action: 'agent.rollback', resource_type: 'service', resource_name: () => ['checkout-api', 'payment-service', 'auth-service', 'web-frontend'][Math.floor(Math.random() * 4)], actor_type: 'agent' },
  { action: 'agent.scale', resource_type: 'service', resource_name: () => ['ecs/checkout-api', 'k8s/backend'][Math.floor(Math.random() * 2)], actor_type: 'agent' },
  { action: 'apikey.create', resource_type: 'api_key', resource_name: () => 'opn_****', actor_type: 'human' },
  { action: 'apikey.revoke', resource_type: 'api_key', resource_name: () => 'opn_****', actor_type: 'human' },
  { action: 'member.invite', resource_type: 'user', resource_name: () => `engineer${Math.floor(Math.random() * 99)}@company.com`, actor_type: 'human' },
  { action: 'knowledge.ingest', resource_type: 'document', resource_name: () => ['runbook.md', 'playbook.pdf', 'architecture.md'][Math.floor(Math.random() * 3)], actor_type: 'both' },
  { action: 'alert.trigger', resource_type: 'alert', resource_name: () => `ALT-${Math.floor(Math.random() * 999)}`, actor_type: 'agent' },
  { action: 'feature_flag.toggle', resource_type: 'flag', resource_name: () => ['ff_new_checkout', 'ff_dark_mode', 'ff_ai_triage'][Math.floor(Math.random() * 3)], actor_type: 'both' },
];

const IPS = ['192.168.1.42', '10.0.0.15', '172.16.0.8', '203.0.113.55', '198.51.100.12', null];

let counter = 0;
export const generateMockAuditEntries = (): AuditEntry[] => {
  const entries: AuditEntry[] = [];
  const now = Date.now();

  for (let i = 0; i < 50; i++) {
    const tmpl = ACTION_TEMPLATES[Math.floor(Math.random() * ACTION_TEMPLATES.length)];
    const isAgent = tmpl.actor_type === 'agent' || (tmpl.actor_type === 'both' && Math.random() > 0.5);
    const actor_type: 'human' | 'agent' = isAgent ? 'agent' : 'human';
    const actor_name = isAgent
      ? AGENT_ACTORS[Math.floor(Math.random() * AGENT_ACTORS.length)]
      : HUMAN_ACTORS[Math.floor(Math.random() * HUMAN_ACTORS.length)];

    entries.push({
      id: `mock-audit-${counter++}`,
      actor_type,
      actor_name,
      action: tmpl.action,
      resource_type: tmpl.resource_type,
      resource_name: tmpl.resource_name(),
      ip_address: actor_type === 'human' ? (IPS[Math.floor(Math.random() * IPS.length)] ?? null) : null,
      created_at: new Date(now - i * 8 * 60000 - Math.random() * 5 * 60000).toISOString(),
    });
  }

  return entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};
