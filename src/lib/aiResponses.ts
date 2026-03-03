export interface AIResponse {
  content: string;
  sources: string[];
  codeBlocks?: { language: string; code: string }[];
}

const aiResponseLibrary: AIResponse[] = [
  {
    content: `I've analyzed the logs from your checkout-service over the past hour. I'm seeing a significant spike in database query latency starting at 14:23 UTC.

The primary issue appears to be missing indexes on the \`orders\` table. The query planner is performing sequential scans on a table with 2.3M rows, which is causing the 3-5 second response times you're experiencing.

Here's what I found:
- Average query time: 4.2 seconds (baseline: 180ms)
- Queries affected: \`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC\`
- Table size: 2.3M rows, 18GB
- Current indexes: Only primary key on \`id\`

I recommend creating a composite index immediately:

\`\`\`sql
CREATE INDEX CONCURRENTLY idx_orders_user_created
ON orders(user_id, created_at DESC);
\`\`\`

This will allow the database to efficiently filter by user_id and sort by created_at without scanning the entire table.`,
    sources: ['Splunk', 'PostgreSQL', 'Datadog'],
  },
  {
    content: `I've detected a correlation between the LaunchDarkly feature flag change at 14:32 UTC and the latency spike you're experiencing.

The flag \`enable_inventory_check_v2\` was rolled out to 100% of users, and this new code path is making synchronous HTTP calls to the inventory service without proper timeout configuration.

**Impact Analysis:**
- P95 latency increased from 250ms → 2.8s
- Error rate: 0.02% → 3.4%
- Affected endpoints: /api/checkout, /api/cart/validate

**Root Cause:**
The new inventory check makes blocking HTTP calls with no timeout, and the inventory service is experiencing elevated response times (5-8 seconds).

**Immediate Remediation:**
I recommend rolling back the feature flag immediately while we implement proper circuit breaker patterns:

\`\`\`bash
ldcli flags update enable_inventory_check_v2 \\
  --variations false \\
  --environment production
\`\`\`

After rollback, we should implement timeout and circuit breaker logic before re-enabling.`,
    sources: ['LaunchDarkly', 'Datadog', 'AWS X-Ray'],
  },
  {
    content: `Analyzing your Redis cache performance... I can see the cache hit rate has degraded significantly in the last 2 hours.

**Current Metrics:**
- Cache hit rate: 62% (down from 95% baseline)
- Eviction rate: 1,200 keys/min (baseline: 15 keys/min)
- Memory usage: 7.8GB / 8GB (98% utilization)

**Root Cause:**
The cache is experiencing memory pressure due to a recent increase in key size. Looking at the key patterns, I can see new keys with format \`user:session:detailed:{id}\` that are 10x larger than previous session keys.

**Analysis:**
This change was introduced in deployment \`checkout-service-v2.4.1\` which started storing full user objects in Redis instead of just session IDs.

**Recommendation:**
1. Increase Redis memory allocation to 16GB
2. Implement key compression for large objects
3. Consider moving detailed user data to a separate cache tier

Here's how to check your current key sizes:

\`\`\`bash
redis-cli --bigkeys

redis-cli --scan --pattern 'user:session:detailed:*' | \\
  head -100 | xargs -I {} redis-cli memory usage {}
\`\`\``,
    sources: ['Redis', 'Grafana', 'Datadog'],
  },
  {
    content: `I've identified the root cause of your payment gateway timeout spike. Let me walk you through what happened:

**Timeline:**
- 09:15 UTC: Normal operation, 99.9% success rate
- 09:22 UTC: Stripe API latency increases to 8 seconds (baseline: 400ms)
- 09:25 UTC: Your payment service starts timing out (5s timeout)
- 09:30 UTC: 15% of payment requests failing

**External Factor:**
Stripe was experiencing elevated API response times (confirmed via their status page). This is outside our control, but we can handle it better.

**Immediate Actions Taken:**
✓ Implemented exponential backoff retry logic
✓ Increased timeout to 10 seconds for payment operations
✓ Added circuit breaker to fail fast when Stripe is degraded

**Current Status:**
- Success rate: 99.7% (recovered)
- Average latency: 1.2s (includes retries)
- Circuit breaker: Closed (healthy)

**Long-term Recommendation:**
Implement a fallback payment processor to route traffic when primary is degraded:

\`\`\`typescript
const circuitBreaker = new CircuitBreaker(stripePayment, {
  timeout: 10000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  fallback: (paymentData) => queueForRetry(paymentData)
});
\`\`\``,
    sources: ['Datadog', 'Stripe Status', 'PagerDuty'],
  },
  {
    content: `I've completed an analysis of your GraphQL API performance issues. The problem is a classic N+1 query problem in your resolvers.

**What's Happening:**
When you query for a list of orders, each order's \`items\` field triggers a separate database query. For a request returning 50 orders, this results in 51 database queries (1 for orders + 50 for items).

**Performance Impact:**
- Request latency: 3.2s (should be <500ms)
- Database connections: Saturating pool (48/50 used)
- CPU usage on API pods: 95%

**Affected Resolvers:**
- Query.orders → Order.items
- Query.users → User.orders → Order.items

**Solution - Implement DataLoader:**
DataLoader will batch all item queries into a single database call:

\`\`\`typescript
import DataLoader from 'dataloader';

const orderItemsLoader = new DataLoader(async (orderIds) => {
  const items = await db.query(
    'SELECT * FROM order_items WHERE order_id = ANY($1)',
    [orderIds]
  );

  const itemsByOrderId = groupBy(items, 'order_id');
  return orderIds.map(id => itemsByOrderId[id] || []);
});

const items = await orderItemsLoader.load(order.id);
\`\`\`

This reduces 50 queries to 1, dramatically improving performance.`,
    sources: ['AWS X-Ray', 'PostgreSQL', 'Datadog'],
  },
  {
    content: `I've investigated the fraud detection system alerts. Your ML model is showing signs of data drift, which is causing an elevated false positive rate.

**Model Performance Metrics:**
- False positive rate: 12% (baseline: 2%)
- Precision: 76% (down from 94%)
- Customer support tickets: +340% (complaints about blocked transactions)

**Root Cause - Data Drift:**
The model was trained on transaction patterns from Q3 2023, but user behavior has shifted:
- Increased mobile transactions: 45% → 72%
- New payment methods: Buy Now Pay Later services
- Geographic shift: More international transactions

**Impact:**
Legitimate customers are being incorrectly flagged as fraudulent, especially for:
- Transactions >$500 from mobile devices
- First-time international purchases
- BNPL payment methods

**Recommendation:**
1. Retrain the model with last 90 days of labeled data
2. Add feature flags to adjust thresholds temporarily
3. Implement A/B testing for model versions

Here's how to check model drift metrics:

\`\`\`python
from scipy.stats import ks_2samp

for feature in model_features:
    statistic, pvalue = ks_2samp(
        training_data[feature],
        production_data[feature]
    )
    if pvalue < 0.05:
        print(f"Significant drift detected in {feature}")
\`\`\``,
    sources: ['Datadog', 'ML Model Registry', 'Zendesk'],
  },
  {
    content: `I've analyzed your Kubernetes load balancer health check failures. The issue is caused by a database query lock in your health endpoint.

**Current Status:**
- 4 out of 10 pods failing health checks
- Pods being terminated and restarted every 2-3 minutes
- Health endpoint timeout: 5 seconds (default)

**Root Cause:**
Your \`/health\` endpoint queries the database to check connectivity, but it's using a query that acquires a lock:

\`\`\`sql
SELECT COUNT(*) FROM users FOR UPDATE;
\`\`\`

During deployment or high traffic, this lock causes the query to wait, timing out the health check.

**Why This Happens:**
- Long-running transactions hold locks
- Health checks stack up waiting for locks
- K8s marks pod as unhealthy and kills it
- New pod starts, same issue repeats

**Solution:**
Use a lightweight health check that doesn't acquire locks:

\`\`\`typescript
app.get('/health', async (req, res) => {
  await db.query('SELECT 1');
  res.json({ status: 'ok' });
});
\`\`\`

This simply verifies the connection is alive without locking any tables.`,
    sources: ['Kubernetes', 'PostgreSQL', 'Grafana'],
  },
  {
    content: `Your webhook delivery system is experiencing delays due to a memory leak in the worker pods. Let me explain what's happening:

**Symptoms:**
- Webhook queue depth: 15,000 messages (baseline: ~50)
- Worker pods restarting every 20-30 minutes (OOM kills)
- Average delivery delay: 8 minutes (SLA: 30 seconds)

**Memory Analysis:**
I've traced the leak to unclosed HTTP connections in your webhook client. Each webhook delivery creates an HTTP agent that isn't properly cleaned up.

**Memory Growth Pattern:**
- Initial: 256MB
- After 1 hour: 1.2GB
- After 2 hours: OOM kill at 2GB limit

**Root Cause Code:**

\`\`\`typescript
async function sendWebhook(url: string, payload: any) {
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    agent: new https.Agent({ keepAlive: true })
  });
}
\`\`\`

The problem: Creating a new agent for every request. These agents are never garbage collected.

**Solution - Reuse a single agent:**

\`\`\`typescript
const httpAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50
});

async function sendWebhook(url: string, payload: any) {
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    agent: httpAgent
  });
}
\`\`\``,
    sources: ['Datadog', 'Kubernetes', 'AWS X-Ray'],
  },
  {
    content: `I've reviewed your API rate limiter implementation and found the bug causing false positives. Your rate limiter is blocking legitimate traffic.

**Current Impact:**
- 28% of requests receiving 429 (Too Many Requests)
- Authenticated users being blocked incorrectly
- Customer complaints increased 5x

**Root Cause:**
The rate limiter is using IP address as the key, but many legitimate users share IPs (corporate NAT, mobile carriers, VPNs). A single heavy user can cause all users behind that IP to be rate limited.

**The Bug:**
\`\`\`typescript
const key = \`ratelimit:\${req.ip}\`;
\`\`\`

This means 100 users behind the same corporate firewall share a rate limit!

**Solution:**
Implement a composite key that prioritizes user ID when authenticated:

\`\`\`typescript
const getRateLimitKey = (req) => {
  if (req.user?.id) {
    return \`ratelimit:user:\${req.user.id}\`;
  } else {
    return \`ratelimit:ip:\${req.ip}\`;
  }
};

const limits = {
  user: 1000,
  ip: 100
};
\`\`\`

Different limits for authenticated vs anonymous users solves the problem.`,
    sources: ['API Gateway', 'Redis', 'Datadog'],
  },
  {
    content: `Your CDN is serving 404 errors because the cache purge job deleted active assets. I've investigated the incident and here's what happened:

**Timeline:**
- 03:00 UTC: Scheduled CDN cache purge runs
- 03:02 UTC: 404 rate spikes to 15%
- 03:15 UTC: Customer reports start flooding in
- 04:30 UTC: Full CDN cache rebuild completed

**Root Cause:**
The purge script has a logic error. It's supposed to delete assets older than 90 days, but instead it's deleting assets modified in the LAST 90 days:

\`\`\`python
if asset.modified_date > cutoff_date:
    delete_asset(asset)
\`\`\`

The comparison operator should be \`<\` not \`>\`.

**Impact:**
- 3.2M active product images deleted
- 890K CSS/JS assets removed
- Revenue impact: ~$45K (blocked checkouts)

**Immediate Fix:**
I've already restored assets from the backup and fixed the script:

\`\`\`python
cutoff_date = datetime.now() - timedelta(days=90)
for asset in cdn_assets:
    if asset.modified_date < cutoff_date:
        if asset.reference_count == 0:
            delete_asset(asset)
\`\`\`

Added a reference count check as an extra safety measure.`,
    sources: ['CDN Logs', 'AWS S3', 'Datadog'],
  },
  {
    content: `I've analyzed your search index synchronization issue. Elasticsearch is falling behind your primary database, causing stale search results.

**Current Lag:**
- Average replication lag: 12 minutes
- Peak lag: 45 minutes during traffic spikes
- Affected records: ~23,000 out of sync

**Root Cause:**
Your index update pipeline is using a single-threaded worker that processes updates sequentially. During peak traffic, writes are coming in faster than the worker can process them.

**Queue Metrics:**
- Incoming rate: 450 updates/sec (peak)
- Processing rate: 85 updates/sec
- Queue backlog: 18,000 pending updates

**Solution - Parallel Processing:**
Scale to multiple workers with partitioned queues:

\`\`\`javascript
const workers = 10;
const partition = (id) => id.hashCode() % workers;

async function publishUpdate(record) {
  const queue = \`search_updates_\${partition(record.id)}\`;
  await rabbitmq.publish(queue, record);
}

for (let i = 0; i < workers; i++) {
  startWorker(\`search_updates_\${i}\`);
}
\`\`\`

This distributes the load across 10 parallel workers.`,
    sources: ['Elasticsearch', 'RabbitMQ', 'Datadog'],
  },
  {
    content: `I'm seeing elevated response times across your entire API. Let me trace through the request path to identify the bottleneck.

**Overall Metrics:**
- P50 latency: 450ms → 1.8s
- P95 latency: 850ms → 4.2s
- P99 latency: 1.2s → 8.5s
- Error rate: 0.1% → 2.3%

**Distributed Trace Analysis:**
Following a sample slow request through your microservices:

1. API Gateway: 45ms ✓ Normal
2. Auth Service: 120ms ✓ Normal
3. Inventory Service: 3,200ms ⚠️ BOTTLENECK
4. Pricing Service: 180ms ✓ Normal

The inventory service is the bottleneck. Drilling deeper...

**Inventory Service Breakdown:**
- Business logic: 85ms
- Database query: 2,950ms ← Problem here
- External API call: 165ms

The database query is doing a full table scan:

\`\`\`sql
EXPLAIN ANALYZE
SELECT * FROM inventory
WHERE warehouse_id = 'WH001'
  AND quantity > 0
  AND updated_at > NOW() - INTERVAL '24 hours';

CREATE INDEX idx_inventory_warehouse_quantity_updated
ON inventory(warehouse_id, quantity, updated_at)
WHERE quantity > 0;
\`\`\`

This composite index will eliminate the table scan.`,
    sources: ['AWS X-Ray', 'Datadog APM', 'PostgreSQL'],
  },
  {
    content: `Your monitoring setup needs some improvements based on SRE best practices. Let me provide recommendations for your microservices architecture.

**Current State Assessment:**
- ✓ Basic metrics collection (CPU, memory, disk)
- ✓ Application logs centralized in Splunk
- ✗ Missing distributed tracing
- ✗ No SLO/SLI definitions
- ✗ Alert fatigue (87 alerts/day, 94% false positives)

**The Four Golden Signals:**

1. **Latency** - You're tracking averages, but should track percentiles
2. **Traffic** - Good coverage on requests/sec
3. **Errors** - Need to separate 4xx (client) from 5xx (server)
4. **Saturation** - Missing queue depths and connection pools

**Recommendations:**

**Step 1: Define SLOs**
Start with your most critical user journey - the checkout flow:

\`\`\`yaml
slos:
  - name: checkout_availability
    target: 99.9%
    window: 30d

  - name: checkout_latency
    target: 95% of requests < 500ms
    window: 30d

alerts:
  - name: Fast Burn Rate
    condition: error_budget_consumed > 10% in 1 hour
    severity: page
\`\`\`

This allows you to alert on actual user impact, not arbitrary thresholds.`,
    sources: ['Grafana', 'Prometheus', 'SRE Best Practices'],
  },
  {
    content: `I've analyzed your container orchestration and found opportunities to improve reliability and reduce costs.

**Current Resource Usage:**
- 45 pods × 2 CPU cores = 90 CPU cores allocated
- Average utilization: 23%
- Monthly cost: ~$4,200
- Wasted capacity: ~$3,234/month

**Problems Identified:**

1. **Over-provisioning:** Most pods request 2 CPU cores but use <0.5 cores
2. **No auto-scaling:** Fixed replica counts regardless of traffic
3. **Missing pod disruption budgets:** Deployments can take down all replicas
4. **Poor resource limits:** Many pods have no memory limits (OOM risk)

**Optimization Plan:**

\`\`\`yaml
resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 1000m
    memory: 2Gi

apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: checkout-api
spec:
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
\`\`\`

This right-sizes resources and adds auto-scaling.`,
    sources: ['Kubernetes', 'Datadog', 'AWS Cost Explorer'],
  },
  {
    content: `Let me help you set up proper alerting to avoid alert fatigue while ensuring you catch real issues.

**Current Alert Problems:**
- 87 alerts per day on average
- 94% are false positives or noise
- Mean time to acknowledge: 6 hours (people ignoring alerts)
- Real incidents missed 3 times last month

**Alert Fatigue Symptoms:**
✗ Alerting on every metric threshold
✗ No alert grouping or deduplication
✗ Same alert firing every 5 minutes
✗ Alerts on symptoms AND causes (double alerts)
✗ No meaningful context in alert messages

**Better Alerting Strategy:**

**Rule 1: Alert on Symptoms, Not Causes**
Don't alert on "high CPU" - alert on "slow API responses"

**Rule 2: Use SLO-Based Alerting**
Alert when you're burning through error budget too fast:

\`\`\`yaml
- alert: CheckoutLatencyHigh
  expr: |
    histogram_quantile(0.95,
      rate(http_request_duration_seconds_bucket{
        endpoint="/checkout"
      }[5m])
    ) > 0.5
  for: 10m
  annotations:
    summary: "95% of checkout requests taking >500ms"
    runbook: "https://runbooks.example.com/slow-checkout"
\`\`\`

This focuses on user-facing impact, not infrastructure noise.`,
    sources: ['PagerDuty', 'Prometheus', 'Grafana'],
  },
];

export function getAIResponse(userMessage: string): AIResponse {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('database') || lowerMessage.includes('query') || lowerMessage.includes('sql')) {
    return aiResponseLibrary[0];
  }

  if (lowerMessage.includes('latency') || lowerMessage.includes('slow') || lowerMessage.includes('timeout')) {
    return aiResponseLibrary[1];
  }

  if (lowerMessage.includes('cache') || lowerMessage.includes('redis')) {
    return aiResponseLibrary[2];
  }

  if (lowerMessage.includes('payment') || lowerMessage.includes('stripe')) {
    return aiResponseLibrary[3];
  }

  if (lowerMessage.includes('graphql') || lowerMessage.includes('n+1')) {
    return aiResponseLibrary[4];
  }

  if (lowerMessage.includes('fraud') || lowerMessage.includes('ml') || lowerMessage.includes('model')) {
    return aiResponseLibrary[5];
  }

  if (lowerMessage.includes('health') || lowerMessage.includes('kubernetes') || lowerMessage.includes('k8s')) {
    return aiResponseLibrary[6];
  }

  if (lowerMessage.includes('webhook') || lowerMessage.includes('queue') || lowerMessage.includes('memory')) {
    return aiResponseLibrary[7];
  }

  if (lowerMessage.includes('rate limit') || lowerMessage.includes('429')) {
    return aiResponseLibrary[8];
  }

  if (lowerMessage.includes('cdn') || lowerMessage.includes('404')) {
    return aiResponseLibrary[9];
  }

  if (lowerMessage.includes('search') || lowerMessage.includes('elasticsearch')) {
    return aiResponseLibrary[10];
  }

  if (lowerMessage.includes('trace') || lowerMessage.includes('bottleneck')) {
    return aiResponseLibrary[11];
  }

  if (lowerMessage.includes('monitoring') || lowerMessage.includes('slo') || lowerMessage.includes('observability')) {
    return aiResponseLibrary[12];
  }

  if (lowerMessage.includes('cost') || lowerMessage.includes('resource') || lowerMessage.includes('optimization')) {
    return aiResponseLibrary[13];
  }

  if (lowerMessage.includes('alert') || lowerMessage.includes('pager')) {
    return aiResponseLibrary[14];
  }

  return {
    content: `I'm an AI-powered SRE assistant. I can help you with:

• Incident investigation and root cause analysis
• Performance optimization and bottleneck identification
• Database query optimization
• Microservices debugging and distributed tracing
• Alert configuration and SLO/SLI setup
• Cost optimization for cloud resources
• Best practices for monitoring and observability

What specific issue are you investigating? Try asking about latency problems, database performance, alerts, or any operational questions.`,
    sources: ['Operon AI'],
  };
}
