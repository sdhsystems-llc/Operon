import { supabase } from './supabase';

export async function seedUserData(userId: string) {
  try {
    // Check if user already has data
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingProfile) {
      console.log('User data already seeded');
      return;
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        full_name: 'Demo User',
        role: 'admin',
        org_name: 'Operon Demo Org',
      })
      .select()
      .single();

    if (profileError) throw profileError;

    // Create projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .insert([
        {
          org_id: profile.id,
          name: 'E-Commerce Platform',
          description: 'Production e-commerce infrastructure and services',
          status: 'active',
        },
        {
          org_id: profile.id,
          name: 'Payment Processing',
          description: 'Payment gateway and transaction processing systems',
          status: 'active',
        },
        {
          org_id: profile.id,
          name: 'API Gateway',
          description: 'Microservices API gateway and routing layer',
          status: 'active',
        },
      ])
      .select();

    if (projectsError) throw projectsError;

    const [project1, project2, project3] = projects;

    // Create investigations
    const now = new Date();
    const { data: investigations, error: investigationsError } = await supabase
      .from('investigations')
      .insert([
        {
          project_id: project1.id,
          title: 'Database Connection Pool Exhausted',
          severity: 'p1',
          status: 'resolved',
          service: 'postgres-primary',
          assigned_agent: 'AI Agent Alpha',
          root_cause: 'Connection pool max size too low for peak traffic. Increased from 50 to 200 connections.',
          created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          resolved_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
          duration_minutes: 75,
        },
        {
          project_id: project1.id,
          title: 'High API Latency on Checkout Service',
          severity: 'p2',
          status: 'investigating',
          service: 'checkout-api',
          assigned_agent: 'AI Agent Beta',
          created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        },
        {
          project_id: project2.id,
          title: 'Payment Gateway Timeout Spike',
          severity: 'p1',
          status: 'resolved',
          service: 'payment-gateway',
          assigned_agent: 'AI Agent Alpha',
          root_cause: 'Third-party payment provider had elevated response times. Implemented retry logic with exponential backoff.',
          created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          resolved_at: new Date(now.getTime() - 4.8 * 24 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 240,
        },
        {
          project_id: project1.id,
          title: 'Redis Cache Hit Rate Degradation',
          severity: 'p3',
          status: 'open',
          service: 'redis-cache',
          created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        },
        {
          project_id: project3.id,
          title: 'Rate Limiter False Positives',
          severity: 'p2',
          status: 'resolved',
          service: 'api-gateway',
          assigned_agent: 'AI Agent Gamma',
          root_cause: 'Rate limiter algorithm had bug causing legitimate traffic to be blocked. Updated to token bucket algorithm.',
          created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          resolved_at: new Date(now.getTime() - 2.75 * 24 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 360,
        },
        {
          project_id: project2.id,
          title: 'Credit Card Validation Failures',
          severity: 'p4',
          status: 'open',
          service: 'payment-validator',
          created_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        },
        {
          project_id: project1.id,
          title: 'Image CDN 404 Errors',
          severity: 'p3',
          status: 'resolved',
          service: 'cdn-service',
          assigned_agent: 'AI Agent Beta',
          root_cause: 'CDN cache purge job deleted active assets. Implemented safeguards in purge logic.',
          created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          resolved_at: new Date(now.getTime() - 6.9 * 24 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 120,
        },
        {
          project_id: project3.id,
          title: 'GraphQL Query Timeout',
          severity: 'p2',
          status: 'investigating',
          service: 'graphql-api',
          assigned_agent: 'AI Agent Alpha',
          created_at: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
        },
        {
          project_id: project2.id,
          title: 'Fraud Detection System Alerts',
          severity: 'p1',
          status: 'resolved',
          service: 'fraud-detection',
          assigned_agent: 'AI Agent Gamma',
          root_cause: 'Machine learning model had data drift. Retrained with updated transaction patterns.',
          created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          resolved_at: new Date(now.getTime() - 9.5 * 24 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 720,
        },
        {
          project_id: project1.id,
          title: 'Search Index Out of Sync',
          severity: 'p4',
          status: 'open',
          service: 'elasticsearch',
          created_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        },
        {
          project_id: project3.id,
          title: 'Load Balancer Health Check Failures',
          severity: 'p2',
          status: 'resolved',
          service: 'load-balancer',
          assigned_agent: 'AI Agent Beta',
          root_cause: 'Health check endpoint became unresponsive due to database query lock. Optimized query and added timeout.',
          created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          resolved_at: new Date(now.getTime() - 0.9 * 24 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 120,
        },
        {
          project_id: project2.id,
          title: 'Webhook Delivery Delays',
          severity: 'p3',
          status: 'investigating',
          service: 'webhook-service',
          assigned_agent: 'AI Agent Alpha',
          created_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        },
      ])
      .select();

    if (investigationsError) throw investigationsError;

    // Create investigation events (sample for first few investigations)
    const events = [];

    // Events for investigation 1
    events.push(
      {
        investigation_id: investigations[0].id,
        event_type: 'metric',
        title: 'Connection Pool Utilization Spike',
        description: 'Connection pool reached 98% utilization',
        source: 'datadog',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        correlation_score: 0.95,
      },
      {
        investigation_id: investigations[0].id,
        event_type: 'log',
        title: 'Database Connection Timeout',
        description: 'ERROR: could not obtain connection from pool within timeout',
        source: 'splunk',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        correlation_score: 0.92,
      },
      {
        investigation_id: investigations[0].id,
        event_type: 'alert',
        title: 'High Database Response Time',
        description: 'Average query response time exceeded 2000ms',
        source: 'grafana',
        timestamp: new Date(now.getTime() - 115 * 60 * 1000).toISOString(),
        correlation_score: 0.88,
      }
    );

    // Events for investigation 2
    events.push(
      {
        investigation_id: investigations[1].id,
        event_type: 'metric',
        title: 'API Response Time Degradation',
        description: 'P95 latency increased from 250ms to 1800ms',
        source: 'datadog',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        correlation_score: 0.96,
      },
      {
        investigation_id: investigations[1].id,
        event_type: 'log',
        title: 'Downstream Service Slow Response',
        description: 'inventory-service taking 3+ seconds to respond',
        source: 'splunk',
        timestamp: new Date(now.getTime() - 28 * 60 * 1000).toISOString(),
        correlation_score: 0.89,
      },
      {
        investigation_id: investigations[1].id,
        event_type: 'trace',
        title: 'Database Query Slow Scan',
        description: 'Sequential scan on orders table taking 2.5s',
        source: 'aws-xray',
        timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        correlation_score: 0.91,
      }
    );

    // Add more events for other investigations
    for (let i = 2; i < Math.min(8, investigations.length); i++) {
      const inv = investigations[i];
      const invCreatedAt = new Date(inv.created_at);

      events.push(
        {
          investigation_id: inv.id,
          event_type: 'alert',
          title: `Alert triggered for ${inv.service}`,
          description: `Service ${inv.service} experiencing issues`,
          source: 'pagerduty',
          timestamp: new Date(invCreatedAt.getTime() + 60000).toISOString(),
          correlation_score: 0.94,
        },
        {
          investigation_id: inv.id,
          event_type: 'metric',
          title: `Metric anomaly detected`,
          description: `Unusual pattern in ${inv.service} metrics`,
          source: 'datadog',
          timestamp: new Date(invCreatedAt.getTime() + 120000).toISOString(),
          correlation_score: 0.87,
        },
        {
          investigation_id: inv.id,
          event_type: 'log',
          title: `Error logs increased`,
          description: `High error rate in ${inv.service} logs`,
          source: 'splunk',
          timestamp: new Date(invCreatedAt.getTime() + 180000).toISOString(),
          correlation_score: 0.91,
        }
      );
    }

    await supabase.from('investigation_events').insert(events);

    // Create chat sessions
    const { data: chatSessions, error: chatSessionsError } = await supabase
      .from('chat_sessions')
      .insert([
        {
          user_id: userId,
          title: 'Database performance investigation',
          created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          user_id: userId,
          title: 'API latency troubleshooting',
          created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
          user_id: userId,
          title: 'Best practices for monitoring setup',
          created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ])
      .select();

    if (chatSessionsError) throw chatSessionsError;

    // Create chat messages for each session
    const messages = [];

    // Session 1 messages
    const session1Start = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).getTime();
    messages.push(
      { session_id: chatSessions[0].id, role: 'user', content: 'I\'m seeing slow database queries in the checkout service. Can you help investigate?', created_at: new Date(session1Start).toISOString() },
      { session_id: chatSessions[0].id, role: 'assistant', content: 'I\'ll help you investigate the database performance issues. Let me analyze your recent metrics and logs. Can you tell me which specific queries are slow?', created_at: new Date(session1Start + 30000).toISOString() },
      { session_id: chatSessions[0].id, role: 'user', content: 'The order lookup queries are taking 3-5 seconds instead of the usual 200ms.', created_at: new Date(session1Start + 60000).toISOString() },
      { session_id: chatSessions[0].id, role: 'assistant', content: 'I\'ve analyzed the query patterns. The issue appears to be missing indexes on the orders table. The query is doing a full table scan. I recommend adding an index on (user_id, created_at) columns.', created_at: new Date(session1Start + 120000).toISOString() },
      { session_id: chatSessions[0].id, role: 'user', content: 'That makes sense. Should I add it during peak hours or wait?', created_at: new Date(session1Start + 180000).toISOString() },
      { session_id: chatSessions[0].id, role: 'assistant', content: 'Creating an index on a large table can be resource-intensive. I recommend using CREATE INDEX CONCURRENTLY during off-peak hours to avoid blocking writes. This will take longer but won\'t impact production traffic.', created_at: new Date(session1Start + 240000).toISOString() },
      { session_id: chatSessions[0].id, role: 'user', content: 'Great advice. What about query optimization in the application code?', created_at: new Date(session1Start + 300000).toISOString() },
      { session_id: chatSessions[0].id, role: 'assistant', content: 'I\'ve identified several N+1 query patterns in your checkout service. Consider implementing eager loading or using a batching strategy. I can generate a detailed report with specific code locations if needed.', created_at: new Date(session1Start + 360000).toISOString() },
      { session_id: chatSessions[0].id, role: 'user', content: 'Yes please, generate the report.', created_at: new Date(session1Start + 420000).toISOString() },
      { session_id: chatSessions[0].id, role: 'assistant', content: 'Report generated. I\'ve found 8 locations with N+1 patterns. The most critical are in OrderService.getOrderDetails() and CheckoutController.processPayment(). Implementing DataLoader pattern would reduce queries by 85%.', created_at: new Date(session1Start + 480000).toISOString() }
    );

    // Session 2 messages
    const session2Start = new Date(now.getTime() - 5 * 60 * 60 * 1000).getTime();
    messages.push(
      { session_id: chatSessions[1].id, role: 'user', content: 'Our API response times have tripled in the last hour. What\'s happening?', created_at: new Date(session2Start).toISOString() },
      { session_id: chatSessions[1].id, role: 'assistant', content: 'Let me check your metrics across all services. I\'m seeing elevated latency on the inventory service specifically. Checking recent deployments and configuration changes.', created_at: new Date(session2Start + 15000).toISOString() },
      { session_id: chatSessions[1].id, role: 'user', content: 'We did deploy a new feature to inventory service about 2 hours ago.', created_at: new Date(session2Start + 45000).toISOString() },
      { session_id: chatSessions[1].id, role: 'assistant', content: 'That correlates with the latency spike. I\'ve identified that the new feature is making synchronous calls to a third-party API without timeout configuration. This is causing cascade failures.', created_at: new Date(session2Start + 120000).toISOString() },
      { session_id: chatSessions[1].id, role: 'user', content: 'Should we rollback or can we fix forward?', created_at: new Date(session2Start + 180000).toISOString() },
      { session_id: chatSessions[1].id, role: 'assistant', content: 'I recommend a quick fix: add circuit breaker pattern and 2-second timeout to the third-party API calls. This will prevent cascade failures. Full rollback would take 15 minutes, but the fix can be deployed in 5 minutes.', created_at: new Date(session2Start + 240000).toISOString() },
      { session_id: chatSessions[1].id, role: 'user', content: 'Let\'s go with the fix. Can you show me the code changes needed?', created_at: new Date(session2Start + 300000).toISOString() },
      { session_id: chatSessions[1].id, role: 'assistant', content: 'Here\'s the implementation using resilience4j circuit breaker with 2s timeout and 50% failure threshold. I\'ll also add retry logic with exponential backoff for transient failures.', created_at: new Date(session2Start + 360000).toISOString() },
      { session_id: chatSessions[1].id, role: 'user', content: 'Perfect. Deploying now.', created_at: new Date(session2Start + 480000).toISOString() },
      { session_id: chatSessions[1].id, role: 'assistant', content: 'Monitoring the deployment. Response times are already improving. P95 latency dropped from 3200ms to 450ms. The circuit breaker is working as expected.', created_at: new Date(session2Start + 720000).toISOString() }
    );

    // Session 3 messages
    const session3Start = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).getTime();
    messages.push(
      { session_id: chatSessions[2].id, role: 'user', content: 'What are the best practices for setting up monitoring in a microservices architecture?', created_at: new Date(session3Start).toISOString() },
      { session_id: chatSessions[2].id, role: 'assistant', content: 'Great question! For microservices, I recommend the "Four Golden Signals" approach: Latency, Traffic, Errors, and Saturation. Let me break down each one with specific implementation details.', created_at: new Date(session3Start + 20000).toISOString() },
      { session_id: chatSessions[2].id, role: 'user', content: 'How do I measure latency effectively across services?', created_at: new Date(session3Start + 60000).toISOString() },
      { session_id: chatSessions[2].id, role: 'assistant', content: 'Track request latency at multiple percentiles (P50, P95, P99) rather than just averages. Use distributed tracing to see end-to-end latency across service boundaries. I recommend setting up OpenTelemetry for standardized instrumentation.', created_at: new Date(session3Start + 120000).toISOString() },
      { session_id: chatSessions[2].id, role: 'user', content: 'What about alerting? How do I avoid alert fatigue?', created_at: new Date(session3Start + 180000).toISOString() },
      { session_id: chatSessions[2].id, role: 'assistant', content: 'Alert on symptoms, not causes. Focus on user-facing issues rather than internal metrics. Use meaningful thresholds based on SLOs. Group related alerts and implement smart routing. Rate-limit non-critical alerts.', created_at: new Date(session3Start + 240000).toISOString() },
      { session_id: chatSessions[2].id, role: 'user', content: 'Can you help me set up SLOs for our payment service?', created_at: new Date(session3Start + 300000).toISOString() },
      { session_id: chatSessions[2].id, role: 'assistant', content: 'For payment services, I recommend: 99.9% availability SLO, P95 latency < 500ms, and error rate < 0.1%. These should be measured over rolling 30-day windows with a 5% error budget.', created_at: new Date(session3Start + 360000).toISOString() },
      { session_id: chatSessions[2].id, role: 'user', content: 'How do I implement these in Grafana?', created_at: new Date(session3Start + 420000).toISOString() },
      { session_id: chatSessions[2].id, role: 'assistant', content: 'Use Prometheus for metrics collection and Grafana for visualization. Create SLO dashboards with burn rate alerts. I can generate the Prometheus rules and Grafana dashboard JSON for you.', created_at: new Date(session3Start + 480000).toISOString() }
    );

    await supabase.from('chat_messages').insert(messages);

    // Create integrations
    await supabase.from('integrations').insert([
      { org_id: profile.id, name: 'Production AWS Account', type: 'aws', status: 'active', last_sync_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString() },
      { org_id: profile.id, name: 'Azure Cloud Services', type: 'azure', status: 'active', last_sync_at: new Date(now.getTime() - 8 * 60 * 1000).toISOString() },
      { org_id: profile.id, name: 'Splunk Enterprise', type: 'splunk', status: 'active', last_sync_at: new Date(now.getTime() - 2 * 60 * 1000).toISOString() },
      { org_id: profile.id, name: 'Grafana Cloud', type: 'grafana', status: 'active', last_sync_at: new Date(now.getTime() - 3 * 60 * 1000).toISOString() },
      { org_id: profile.id, name: 'LaunchDarkly', type: 'launchdarkly', status: 'active', last_sync_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString() },
      { org_id: profile.id, name: 'PagerDuty Incidents', type: 'pagerduty', status: 'active', last_sync_at: new Date(now.getTime() - 1 * 60 * 1000).toISOString() },
      { org_id: profile.id, name: 'GitHub Repository', type: 'github', status: 'active', last_sync_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString() },
      { org_id: profile.id, name: 'Datadog Monitoring', type: 'datadog', status: 'active', last_sync_at: new Date(now.getTime() - 4 * 60 * 1000).toISOString() },
      { org_id: profile.id, name: 'Jira Service Desk', type: 'jira', status: 'active', last_sync_at: new Date(now.getTime() - 20 * 60 * 1000).toISOString() },
      { org_id: profile.id, name: 'Slack Workspace', type: 'slack', status: 'active', last_sync_at: new Date(now.getTime() - 30 * 1000).toISOString() },
      { org_id: profile.id, name: 'Microsoft Teams', type: 'teams', status: 'active', last_sync_at: new Date(now.getTime() - 2 * 60 * 1000).toISOString() },
    ]);

    // Create knowledge documents
    await supabase.from('knowledge_documents').insert([
      { org_id: profile.id, name: 'Database Incident Runbook', type: 'runbook', size: 45620, status: 'active', url: 'https://docs.example.com/runbooks/database-incidents' },
      { org_id: profile.id, name: 'API Gateway Configuration Guide', type: 'documentation', size: 128400, status: 'active', url: 'https://docs.example.com/guides/api-gateway' },
      { org_id: profile.id, name: 'Payment Service Postmortem - June 2024', type: 'postmortem', size: 89340, status: 'active', url: 'https://docs.example.com/postmortems/payment-june-2024' },
      { org_id: profile.id, name: 'Kubernetes Deployment Procedures', type: 'runbook', size: 67250, status: 'active', url: 'https://docs.example.com/runbooks/k8s-deployment' },
      { org_id: profile.id, name: 'Monitoring and Alerting Best Practices', type: 'documentation', size: 156780, status: 'active', url: 'https://docs.example.com/guides/monitoring' },
      { org_id: profile.id, name: 'Load Balancer Failure Postmortem', type: 'postmortem', size: 72890, status: 'active', url: 'https://docs.example.com/postmortems/lb-failure' },
      { org_id: profile.id, name: 'Security Incident Response Playbook', type: 'runbook', size: 234560, status: 'active', url: 'https://docs.example.com/runbooks/security-response' },
      { org_id: profile.id, name: 'Microservices Architecture Overview', type: 'documentation', size: 189440, status: 'active', url: 'https://docs.example.com/architecture/microservices' },
      { org_id: profile.id, name: 'Cache Invalidation Strategies', type: 'documentation', size: 93210, status: 'active', url: 'https://docs.example.com/guides/cache-invalidation' },
    ]);

    console.log('Successfully seeded user data');
  } catch (error) {
    console.error('Error seeding user data:', error);
    throw error;
  }
}
