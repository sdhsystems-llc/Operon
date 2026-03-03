/**
 * Shared mock data — used as fallback when Supabase returns empty results.
 * Service names and project IDs are aligned with FoundationsPage mock data.
 *
 * Foundations project IDs:  checkout, catalog, cart, payment, auth, gateway, lb, pipeline, analytics
 * Foundations service slugs: checkout-service, product-catalog, cart-api, payment-gateway,
 *                            auth-service, api-gateway, load-balancer, data-pipeline, analytics-api
 */

export interface MockInvestigation {
  id: string
  title: string
  service: string
  project_id: string
  severity: 'p1' | 'p2' | 'p3' | 'p4'
  status: 'open' | 'investigating' | 'resolved'
  assigned_agent: string | null
  created_at: string
  resolved_at: string | null
  duration_minutes: number | null
  root_cause: string | null
  description: string | null
}

export interface MockInvestigationEvent {
  id: string
  investigation_id: string
  type: 'metric' | 'log' | 'alert' | 'deploy' | 'commit' | 'feature_flag' | 'trace' | 'config_change'
  title: string
  description: string
  source: string
  confidence: number | null
  occurred_at: string
}

const now = Date.now()
const ago = (mins: number) => new Date(now - mins * 60 * 1000).toISOString()

export const MOCK_INVESTIGATIONS: MockInvestigation[] = [
  {
    id: 'inv-001',
    title: 'Connection Pool Exhausted — Checkout Failures',
    service: 'checkout-service',
    project_id: 'checkout',
    severity: 'p1',
    status: 'investigating',
    assigned_agent: 'AI Agent Alpha',
    created_at: ago(95),
    resolved_at: null,
    duration_minutes: null,
    root_cause: null,
    description: 'Checkout failure rate jumped to 18%. Connection pool hitting max_connections limit.',
  },
  {
    id: 'inv-002',
    title: 'Payment Gateway Timeout Spike',
    service: 'payment-gateway',
    project_id: 'payment',
    severity: 'p1',
    status: 'resolved',
    assigned_agent: 'AI Agent Alpha',
    created_at: ago(7 * 24 * 60),
    resolved_at: ago(7 * 24 * 60 - 48),
    duration_minutes: 48,
    root_cause: 'Stripe API degradation caused cascading timeouts. Activated fallback processor.',
    description: 'P99 latency on /payments endpoint exceeded 8s. Stripe status page confirmed degraded.',
  },
  {
    id: 'inv-003',
    title: 'High API Latency on Checkout Service',
    service: 'checkout-service',
    project_id: 'checkout',
    severity: 'p2',
    status: 'investigating',
    assigned_agent: 'AI Agent Alpha',
    created_at: ago(23 * 60),
    resolved_at: null,
    duration_minutes: null,
    root_cause: null,
    description: 'P99 latency tripled from 120ms to 380ms. Correlates with new feature flag rollout.',
  },
  {
    id: 'inv-004',
    title: 'GraphQL Query Timeout — Product Catalog',
    service: 'product-catalog',
    project_id: 'catalog',
    severity: 'p2',
    status: 'investigating',
    assigned_agent: 'AI Agent Beta',
    created_at: ago(23 * 60 + 5),
    resolved_at: null,
    duration_minutes: null,
    root_cause: null,
    description: 'Complex product listing queries timing out after 5s. Missing index on category_id + created_at.',
  },
  {
    id: 'inv-005',
    title: 'Redis Cache Hit Rate Degradation',
    service: 'cart-api',
    project_id: 'cart',
    severity: 'p3',
    status: 'open',
    assigned_agent: null,
    created_at: ago(25 * 60),
    resolved_at: null,
    duration_minutes: null,
    root_cause: null,
    description: 'Cart service cache hit rate dropped from 94% to 61%. Memory pressure causing frequent evictions.',
  },
  {
    id: 'inv-006',
    title: 'Webhook Delivery Delays',
    service: 'payment-gateway',
    project_id: 'payment',
    severity: 'p3',
    status: 'investigating',
    assigned_agent: 'AI Agent Alpha',
    created_at: ago(24 * 60),
    resolved_at: null,
    duration_minutes: null,
    root_cause: null,
    description: 'Stripe webhook callbacks delayed 2–5 minutes. Queue depth growing at 1200 events/min.',
  },
  {
    id: 'inv-007',
    title: 'API Gateway Rate Limiter False Positives',
    service: 'api-gateway',
    project_id: 'gateway',
    severity: 'p3',
    status: 'resolved',
    assigned_agent: 'Sentinel',
    created_at: ago(3 * 24 * 60),
    resolved_at: ago(3 * 24 * 60 - 35),
    duration_minutes: 35,
    root_cause: 'Redis counter TTL bug causing legitimate requests to hit rate limit. Patched counter logic.',
    description: 'Legitimate API calls returning 429 after recent rate limiter update. ~12% of traffic affected.',
  },
  {
    id: 'inv-008',
    title: 'Load Balancer Health Check Failures',
    service: 'load-balancer',
    project_id: 'lb',
    severity: 'p2',
    status: 'resolved',
    assigned_agent: 'Sentinel',
    created_at: ago(24 * 60 + 10),
    resolved_at: ago(24 * 60 - 20),
    duration_minutes: 30,
    root_cause: 'Health check endpoint returned 503 after memory OOM on two pods. Pods restarted, route re-added.',
    description: 'ALB marking 3 of 8 checkout-service targets as unhealthy. Traffic routed to remaining 5.',
  },
  {
    id: 'inv-009',
    title: 'Auth Service JWT Validation Errors',
    service: 'auth-service',
    project_id: 'auth',
    severity: 'p2',
    status: 'open',
    assigned_agent: 'AI Agent Gamma',
    created_at: ago(4 * 60),
    resolved_at: null,
    duration_minutes: null,
    root_cause: null,
    description: 'Token validation failing for ~3% of requests. Suspected clock skew after EC2 instance restart.',
  },
  {
    id: 'inv-010',
    title: 'Data Pipeline Kafka Consumer Lag',
    service: 'data-pipeline',
    project_id: 'pipeline',
    severity: 'p2',
    status: 'resolved',
    assigned_agent: 'AI Agent Beta',
    created_at: ago(6 * 24 * 60),
    resolved_at: ago(6 * 24 * 60 - 180),
    duration_minutes: 180,
    root_cause: 'Kafka partition rebalance after broker restart caused 3h data lag. Replication factor increased.',
    description: 'ETL pipeline showing 3+ hour consumer lag on orders topic. Downstream analytics impacted.',
  },
  {
    id: 'inv-011',
    title: 'Credit Card Validation Failures — Cart API',
    service: 'cart-api',
    project_id: 'cart',
    severity: 'p4',
    status: 'open',
    assigned_agent: null,
    created_at: ago(26 * 60),
    resolved_at: null,
    duration_minutes: null,
    root_cause: null,
    description: 'Luhn validation rejecting ~0.4% of valid Amex cards. Likely regex edge case.',
  },
  {
    id: 'inv-012',
    title: 'Analytics API Search Index Out of Sync',
    service: 'analytics-api',
    project_id: 'analytics',
    severity: 'p4',
    status: 'open',
    assigned_agent: null,
    created_at: ago(26 * 60 + 15),
    resolved_at: null,
    duration_minutes: null,
    root_cause: null,
    description: 'Dashboard reports showing stale data. Elasticsearch index not updated since 14:30.',
  },
]

export const MOCK_EVENTS: Record<string, MockInvestigationEvent[]> = {
  'inv-001': [
    { id: 'e1', investigation_id: 'inv-001', type: 'metric',  title: 'Connection Pool Utilization Spike',  description: 'Connection pool reached 98% utilization', source: 'datadog',   confidence: 95, occurred_at: ago(96) },
    { id: 'e2', investigation_id: 'inv-001', type: 'log',     title: 'Database Connection Timeout',        description: 'ERROR: could not obtain connection from pool within timeout', source: 'splunk', confidence: 92, occurred_at: ago(95) },
    { id: 'e3', investigation_id: 'inv-001', type: 'alert',   title: 'Investigation Started',              description: 'AI Agent Alpha began root cause analysis', source: 'operon',  confidence: null, occurred_at: ago(94) },
    { id: 'e4', investigation_id: 'inv-001', type: 'metric',  title: 'High Database Response Time',        description: 'Average query response time exceeded 2000ms', source: 'grafana', confidence: 88, occurred_at: ago(90) },
    { id: 'e5', investigation_id: 'inv-001', type: 'deploy',  title: 'Checkout Service Deployment',        description: 'v2.14.3 deployed — connection pool config unchanged', source: 'github', confidence: null, occurred_at: ago(120) },
  ],
  'inv-003': [
    { id: 'f1', investigation_id: 'inv-003', type: 'feature_flag', title: 'Feature Flag: enable-new-checkout', description: 'Flag rolled out to 50% of traffic at 14:32', source: 'launchdarkly', confidence: 91, occurred_at: ago(23 * 60 + 8) },
    { id: 'f2', investigation_id: 'inv-003', type: 'metric',       title: 'P99 Latency Surge',               description: 'Checkout P99 jumped from 120ms to 380ms within 2 minutes', source: 'datadog', confidence: 97, occurred_at: ago(23 * 60) },
    { id: 'f3', investigation_id: 'inv-003', type: 'alert',        title: 'SLO Burn Rate Alert',             description: 'Error budget burn rate at 14x — P2 auto-filed', source: 'pagerduty', confidence: null, occurred_at: ago(22 * 60 + 55) },
    { id: 'f4', investigation_id: 'inv-003', type: 'log',          title: 'Slow Query Log',                  description: 'SELECT * on orders table taking 1.2s — full scan detected', source: 'cloudwatch', confidence: 84, occurred_at: ago(22 * 60 + 40) },
  ],
  'inv-004': [
    { id: 'g1', investigation_id: 'inv-004', type: 'log',    title: 'GraphQL Resolver Timeout',      description: 'productListing resolver exceeded 5000ms limit', source: 'cloudwatch', confidence: 94, occurred_at: ago(23 * 60 + 10) },
    { id: 'g2', investigation_id: 'inv-004', type: 'metric', title: 'Missing Index — category_id',   description: 'Full table scan detected on products table (2.4M rows)', source: 'datadog', confidence: 89, occurred_at: ago(23 * 60 + 5) },
    { id: 'g3', investigation_id: 'inv-004', type: 'deploy', title: 'Product Catalog v1.8.0',        description: 'New variant attributes feature added complex JOINs', source: 'github',   confidence: 86, occurred_at: ago(24 * 60) },
  ],
  'inv-007': [
    { id: 'h1', investigation_id: 'inv-007', type: 'deploy',       title: 'Rate Limiter v2.1.0 Deployed', description: 'New sliding window algorithm deployed at 11:00', source: 'github', confidence: null, occurred_at: ago(3 * 24 * 60 + 60) },
    { id: 'h2', investigation_id: 'inv-007', type: 'alert',        title: '429 Rate Spike Detected',      description: '429 responses up 1200% within 5 minutes of deploy', source: 'datadog', confidence: 98, occurred_at: ago(3 * 24 * 60) },
    { id: 'h3', investigation_id: 'inv-007', type: 'log',          title: 'Redis TTL Bug',                description: 'Counter keys expiring 60s early due to off-by-one in TTL calc', source: 'splunk', confidence: 95, occurred_at: ago(3 * 24 * 60 - 10) },
    { id: 'h4', investigation_id: 'inv-007', type: 'config_change', title: 'Patch Applied',              description: 'Rate limiter TTL corrected; false positives stopped', source: 'operon', confidence: null, occurred_at: ago(3 * 24 * 60 - 35) },
  ],
}

// Confidence for detail page
export const MOCK_CONFIDENCE: Record<string, number> = {
  'inv-001': 94, 'inv-002': 91, 'inv-003': 87, 'inv-004': 89,
  'inv-005': 78, 'inv-006': 73, 'inv-007': 95, 'inv-008': 88,
  'inv-009': 82, 'inv-010': 90, 'inv-011': 65, 'inv-012': 71,
}

// Remediation suggestions per service
export const MOCK_REMEDIATIONS: Record<string, { title: string; description: string; command?: string; risk: 'low' | 'medium' | 'high' }[]> = {
  'checkout-service': [
    { title: 'Increase Connection Pool Size',  description: 'Scale max_connections from 50 to 200 in PostgreSQL config.',         command: 'ALTER SYSTEM SET max_connections = 200;\nSELECT pg_reload_conf();', risk: 'low' },
    { title: 'Roll Back Feature Flag',         description: 'Disable enable-new-checkout flag to immediately restore latency.',    command: 'ldcli flags update enable-new-checkout \\\n  --variations false \\\n  --environment production', risk: 'low' },
    { title: 'Scale Checkout Pods',            description: 'Increase replica count to handle elevated traffic while investigating.', command: 'kubectl scale deployment checkout-service \\\n  --replicas=10 -n production', risk: 'low' },
  ],
  'payment-gateway': [
    { title: 'Activate Fallback Processor',    description: 'Route payment traffic to secondary processor while Stripe is degraded.', risk: 'medium' },
    { title: 'Implement Retry with Backoff',   description: 'Add exponential backoff (100ms, 200ms, 400ms) to payment provider calls.', risk: 'low' },
    { title: 'Drain Webhook Queue',            description: 'Temporarily scale webhook workers 3x to clear backlog.',               command: 'kubectl scale deployment webhook-workers \\\n  --replicas=9 -n production', risk: 'low' },
  ],
  'cart-api': [
    { title: 'Flush Stale Cache Keys',         description: 'Clear cart session keys to force rebuild from DB.',                    command: 'redis-cli --scan --pattern "cart:session:*" \\\n  | xargs redis-cli del', risk: 'high' },
    { title: 'Increase Redis Memory Limit',    description: 'Scale Redis memory from 8GB to 16GB to reduce eviction pressure.',    risk: 'low' },
  ],
  'api-gateway': [
    { title: 'Patch Rate Limiter TTL',         description: 'Fix off-by-one in sliding window TTL calculation.',                   risk: 'low' },
    { title: 'Revert to Rate Limiter v2.0.9',  description: 'Roll back the rate limiter deployment to the last stable version.',   command: 'kubectl rollout undo deployment/api-gateway -n production', risk: 'low' },
  ],
  'auth-service': [
    { title: 'Sync Instance Clocks',           description: 'Force NTP sync on affected EC2 instances to correct clock skew.',     command: 'sudo chronyc makestep', risk: 'low' },
    { title: 'Extend JWT Leeway Window',       description: 'Temporarily increase clock skew tolerance from 30s to 120s.',        risk: 'low' },
  ],
  'load-balancer': [
    { title: 'Restart OOM Pods',               description: 'Rolling restart of pods that hit memory limit.',                     command: 'kubectl rollout restart deployment/checkout-service -n production', risk: 'low' },
    { title: 'Increase Memory Limit',          description: 'Scale pod memory request/limit from 512Mi to 1Gi.',                  risk: 'low' },
  ],
  'data-pipeline': [
    { title: 'Increase Replication Factor',    description: 'Set Kafka replication factor to 3 to survive broker restarts.',      command: 'kafka-topics.sh --alter --topic orders \\\n  --replication-factor 3', risk: 'medium' },
    { title: 'Restart Consumer Group',         description: 'Restart the orders consumer group to trigger rebalance.',            command: 'kafka-consumer-groups.sh --reset-offsets \\\n  --group orders-etl --topic orders', risk: 'medium' },
  ],
  'product-catalog': [
    { title: 'Add Missing Index',              description: 'Create composite index on (category_id, created_at DESC) to eliminate full table scans.', command: 'CREATE INDEX CONCURRENTLY idx_products_category_created\nON products(category_id, created_at DESC);', risk: 'low' },
    { title: 'Roll Back Catalog v1.8.0',       description: 'Revert the variant attributes feature that introduced complex JOINs.',command: 'kubectl rollout undo deployment/product-catalog -n production', risk: 'low' },
  ],
  'analytics-api': [
    { title: 'Trigger Manual Re-index',        description: 'Force Elasticsearch to re-index from the primary data store.',       command: 'curl -X POST "localhost:9200/analytics/_update_by_query"', risk: 'low' },
    { title: 'Restart Index Sync Job',         description: 'Restart the cron job responsible for syncing analytics data.',       risk: 'low' },
  ],
}
