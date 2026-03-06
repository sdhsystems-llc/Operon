import type { Org, Domain, IntCategory, Member, ProjectNotificationConfig, ProjectDataSource, KnowledgeDoc } from './types'

// ─── Utilities ────────────────────────────────────────────────────────────────
export const uid = () => Math.random().toString(36).slice(2, 10)

export const mkNotifications = (): ProjectNotificationConfig => ({
  enabled: false, platform: 'inherit', slackChannel: '', teamsChannel: '',
  events: { new_investigation: true, root_cause_identified: true, remediation_suggested: true, investigation_resolved: true, agent_health_alerts: true },
  alertLevels: { p1: true, p2: true, p3: false },
})

export const mkKnowledge = (): KnowledgeDoc[] => []

export const mkDS = (): ProjectDataSource[] => [
  { integrationId: 'datadog',     enabled: false, config: { 'Service Name': '', 'Environment': 'prod', 'APM Service': '' } },
  { integrationId: 'splunk',      enabled: false, config: { 'Index': '', 'Search Filter': '', 'Source': '' } },
  { integrationId: 'cloudwatch',  enabled: false, config: { 'Log Group': '', 'Region': 'us-east-1', 'Namespace': '' } },
  { integrationId: 'grafana',     enabled: false, config: { 'Dashboard UID': '', 'Panel ID': '', 'Data Source': 'prometheus' } },
  { integrationId: 'github',      enabled: false, config: { 'Repository': '', 'Branch': 'main' } },
  { integrationId: 'pagerduty',   enabled: false, config: { 'Service ID': '', 'Escalation Policy': 'Default' } },
  { integrationId: 'launchdarkly',enabled: false, config: { 'Project Key': '', 'Environment': 'production' } },
]

export const ENV_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  production:  { bg: 'rgba(16,185,129,0.1)',  color: '#34d399', border: 'rgba(16,185,129,0.3)' },
  staging:     { bg: 'rgba(245,158,11,0.1)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  development: { bg: 'rgba(99,102,241,0.1)',  color: '#818cf8', border: 'rgba(99,102,241,0.3)' },
  canary:      { bg: 'rgba(251,146,60,0.1)',  color: '#fb923c', border: 'rgba(251,146,60,0.3)' },
}

export const ALL_AGENTS = ['Operon AI', 'Sentinel', 'Patcher', 'Navigator', 'Cortex', 'Arbiter']

export const DOMAIN_COLORS = ['#818cf8', '#34d399', '#60a5fa', '#fbbf24', '#f472b6', '#fb923c', '#a78bfa', '#22d3ee']

// ─── Organizations ────────────────────────────────────────────────────────────
export const MOCK_ORGS: Org[] = [
  {
    id: 'netflix', name: 'Netflix', industry: 'Media & Entertainment', timezone: 'America/Los_Angeles', plan: 'Enterprise',
    knowledge: [
      { id: 'nk1', title: 'Global Incident Response Playbook', type: 'playbook', summary: 'Netflix-wide P0/P1 incident protocol. Covers CRIT, SEV1-4 severity, war room procedures, and executive communication templates.', author: 'SRE Platform', updatedAt: '2026-02-20' },
      { id: 'nk2', title: 'SLO & Error Budget Policy', type: 'sop', summary: '99.99% streaming availability SLO, error budget burn rate thresholds, and freeze windows during peak traffic (Christmas, Oscars).', author: 'Reliability Eng', updatedAt: '2026-01-15' },
      { id: 'nk3', title: 'Chaos Engineering Principles', type: 'architecture', summary: 'FIT (Failure Injection Testing) runbook. Chaos Monkey, Chaos Kong, and Latency Monkey for production resilience testing.', author: 'Chaos Eng Team', updatedAt: '2026-02-01' },
    ],
  },
  {
    id: 'stripe', name: 'Stripe', industry: 'Financial Services / Fintech', timezone: 'America/Chicago', plan: 'Enterprise',
    knowledge: [
      { id: 'sk1', title: 'PCI-DSS Incident Response Policy', type: 'sop', summary: 'Payment card incident response aligned with PCI-DSS 4.0. Mandatory breach notification within 72 hours. Covers forensics, card network reporting, and legal obligations.', author: 'Security & Compliance', updatedAt: '2026-02-10' },
      { id: 'sk2', title: 'Five Nines Availability Standard', type: 'sop', summary: 'Stripe API target: 99.999% monthly. Defines incident declaration thresholds, customer communication SLAs, and status page cadence.', author: 'Platform Reliability', updatedAt: '2026-01-28' },
    ],
  },
  {
    id: 'vercel', name: 'Vercel', industry: 'Developer Tools / Cloud Platform', timezone: 'America/New_York', plan: 'Pro',
    knowledge: [
      { id: 'vk1', title: 'Edge Network Runbook', type: 'runbook', summary: 'Response for CDN edge node failures. Covers PoP-level traffic rerouting, cache purge, and origin failover. Updated after April 2025 global outage.', author: 'Edge Infrastructure', updatedAt: '2026-02-28' },
    ],
  },
]

// ─── Domains & Projects ───────────────────────────────────────────────────────
export const INITIAL_DOMAINS: Record<string, Domain[]> = {
  netflix: [
    {
      id: 'streaming', name: 'Streaming Platform', description: 'Core video delivery, encoding, and playback pipeline',
      owner: 'Streaming SRE', notificationChannel: '#streaming-incidents',
      knowledge: [
        { id: 'spk1', title: 'Streaming Playback Runbook', type: 'runbook', summary: 'Diagnosis for playback failures: manifest generation, DRM failures, CDN cache miss storms, and adaptive bitrate degradation.', author: 'Streaming SRE', updatedAt: '2026-02-25' },
        { id: 'spk2', title: 'Peak Traffic Scaling Playbook', type: 'playbook', summary: 'Pre-scaling for high-demand events. CDN cache warm-up, encoder fleet scaling, global load distribution across AWS regions.', author: 'Capacity Planning', updatedAt: '2026-01-10' },
      ],
      projects: [
        {
          id: 'video-encoder', name: 'Video Encoder', description: 'Distributed transcoding — 4K HDR, Dolby Vision, AV1 codec pipeline',
          environment: 'production', serviceUrl: 'https://encoder-api.netflix.internal', repoUrl: 'github.com/netflix/video-encoder',
          agents: ['Operon AI', 'Cortex'], investigations: 0, docs: 12,
          healthScore: 99.4, sloTarget: '99.5%', sloActual: '99.42%',
          onCall: { name: 'Bozoma Saint John', until: 'Until Thu 09:00 PT' },
          lastDeploy: { who: 'Encode CI', when: '4h ago', commit: 'ef3a11', message: 'feat: AV1 encoding tier 3 quality tuning', status: 'success' },
          recentActivity: [
            { id: 'r1', time: '4h ago', label: 'Deploy ef3a11 succeeded — AV1 encoding tier 3 quality tuning', kind: 'deploy' },
            { id: 'r2', time: '2d ago', label: 'Cortex auto-scaled encoder fleet 1200→1800 nodes for Oscars traffic', kind: 'agent' },
            { id: 'r3', time: '3d ago', label: 'Alert: P95 encode latency > 8s — resolved by Cortex scale-up', kind: 'resolved' },
          ],
          components: [
            { id: 'vc1', name: 'Encode Scheduler', description: 'Job queue and priority scheduling', tech: 'Java / Kafka' },
            { id: 'vc2', name: 'AV1 Encoder', description: 'CUDA-accelerated AV1 codec', tech: 'C++ / CUDA' },
            { id: 'vc3', name: 'Quality Validator', description: 'VMAF-based quality scoring gate', tech: 'Python' },
          ],
          knowledge: [
            { id: 'vek1', title: 'AV1 Encoder Architecture', type: 'architecture', summary: 'CUDA tile encoding, quality presets, and integration with the Meson content delivery graph.', author: 'Cortex', updatedAt: '2026-02-18' },
            { id: 'vek2', title: 'Encoder Fleet Scaling Runbook', type: 'runbook', summary: 'Manual scaling during peak events: instance type selection, spot vs on-demand balance, scale-down criteria.', author: 'Capacity Planning', updatedAt: '2026-01-30' },
          ],
          notifications: { enabled: true, platform: 'slack', slackChannel: '#encoder-alerts', teamsChannel: '', events: { new_investigation: true, root_cause_identified: true, remediation_suggested: true, investigation_resolved: true, agent_health_alerts: true }, alertLevels: { p1: true, p2: true, p3: false } },
          dataSources: [
            { integrationId: 'datadog',     enabled: true,  config: { 'Service Name': 'video-encoder', 'Environment': 'prod', 'APM Service': 'encoder' } },
            { integrationId: 'grafana',     enabled: true,  config: { 'Dashboard UID': 'encoder-fleet', 'Panel ID': '5', 'Data Source': 'prometheus' } },
            { integrationId: 'cloudwatch',  enabled: true,  config: { 'Log Group': '/ecs/video-encoder', 'Region': 'us-east-1', 'Namespace': 'VideoEncoder' } },
            { integrationId: 'github',      enabled: true,  config: { 'Repository': 'netflix/video-encoder', 'Branch': 'main' } },
            { integrationId: 'pagerduty',   enabled: true,  config: { 'Service ID': 'PNFLX01', 'Escalation Policy': 'Streaming Critical' } },
            { integrationId: 'splunk',      enabled: false, config: { 'Index': '', 'Search Filter': '', 'Source': '' } },
            { integrationId: 'launchdarkly',enabled: false, config: { 'Project Key': '', 'Environment': 'production' } },
          ],
        },
        {
          id: 'player-sdk', name: 'Player SDK', description: 'Cross-platform video player — iOS, Android, Web, Smart TV (40+ platforms)',
          environment: 'production', serviceUrl: 'https://player.netflix.com', repoUrl: 'github.com/netflix/player-sdk',
          agents: ['Sentinel'], investigations: 1, docs: 8,
          healthScore: 97.2, sloTarget: '99.9%', sloActual: '99.76%',
          onCall: { name: 'Reed Hastings', until: 'Until Fri 08:00 PT' },
          lastDeploy: { who: 'Player CI', when: '6h ago', commit: 'b4e9d3', message: 'fix: LG WebOS 4 DRM handshake timeout', status: 'success' },
          recentActivity: [
            { id: 'ps1', time: '8h ago', label: 'Sentinel opened INV-1142 — elevated DRM failure rate on LG TV (P2)', kind: 'incident' },
            { id: 'ps2', time: '6h ago', label: 'Deploy b4e9d3 — LG WebOS 4 DRM handshake timeout fix', kind: 'deploy' },
            { id: 'ps3', time: '2h ago', label: 'Sentinel: DRM failure rate normalized post-deploy — INV-1142 resolved', kind: 'resolved' },
          ],
          components: [],
          knowledge: [{ id: 'psk1', title: 'DRM Troubleshooting Guide', type: 'runbook', summary: 'Widevine, PlayReady, and FairPlay DRM failures by platform. LG, Samsung, Roku, browser-specific error codes and fixes.', author: 'Sentinel', updatedAt: '2026-03-01' }],
          notifications: mkNotifications(),
          dataSources: [
            { integrationId: 'datadog',     enabled: true,  config: { 'Service Name': 'player-sdk', 'Environment': 'prod', 'APM Service': 'player' } },
            { integrationId: 'grafana',     enabled: true,  config: { 'Dashboard UID': 'player-health', 'Panel ID': '2', 'Data Source': 'prometheus' } },
            { integrationId: 'github',      enabled: true,  config: { 'Repository': 'netflix/player-sdk', 'Branch': 'main' } },
            { integrationId: 'pagerduty',   enabled: true,  config: { 'Service ID': 'PNFLX02', 'Escalation Policy': 'Player Critical' } },
            { integrationId: 'launchdarkly',enabled: true,  config: { 'Project Key': 'player', 'Environment': 'production' } },
            { integrationId: 'splunk',      enabled: false, config: { 'Index': '', 'Search Filter': '', 'Source': '' } },
            { integrationId: 'cloudwatch',  enabled: false, config: { 'Log Group': '', 'Region': 'us-east-1', 'Namespace': '' } },
          ],
        },
        {
          id: 'stream-health', name: 'Stream Health Monitor', description: 'Real-time QoE — rebuffering rate, startup time, bitrate distribution across 190 countries',
          environment: 'production', serviceUrl: 'https://stream-health.netflix.internal', repoUrl: 'github.com/netflix/stream-health-monitor',
          agents: ['Operon AI'], investigations: 0, docs: 6,
          healthScore: 99.9, sloTarget: '99.9%', sloActual: '99.93%',
          lastDeploy: { who: 'QoE Team', when: '2d ago', commit: 'c77f20', message: 'feat: P10 rebuffer alert threshold per country', status: 'success' },
          recentActivity: [{ id: 'sh1', time: '2d ago', label: 'Deploy c77f20 — P10 rebuffer alert threshold per country', kind: 'deploy' }],
          components: [], knowledge: mkKnowledge(), notifications: mkNotifications(), dataSources: mkDS(),
        },
      ],
    },
    {
      id: 'content-delivery', name: 'Content Delivery', description: 'Open Connect CDN — 233 PoPs, 200 Tbps peak capacity',
      owner: 'Open Connect SRE', notificationChannel: '#cdn-incidents',
      knowledge: [{ id: 'cdk1', title: 'Open Connect PoP Failure Runbook', type: 'runbook', summary: 'CDN PoP outage response: BGP withdrawal, traffic shifting to adjacent PoPs, failback criteria.', author: 'Open Connect SRE', updatedAt: '2026-02-12' }],
      projects: [
        {
          id: 'cdn-edge', name: 'CDN Edge Layer', description: 'Open Connect appliances at ISP network level — 233 global PoPs',
          environment: 'production', repoUrl: 'github.com/netflix/open-connect-edge',
          agents: ['Cortex', 'Arbiter'], investigations: 0, docs: 9,
          healthScore: 99.97, sloTarget: '99.99%', sloActual: '99.97%',
          onCall: { name: 'Greg Peters', until: 'Until Sat 09:00 PT' },
          lastDeploy: { who: 'CDN Automation', when: '1d ago', commit: 'a12bc3', message: 'config: cache hit ratio threshold update for Tier-1 ISPs', status: 'success' },
          recentActivity: [
            { id: 'ce1', time: '1d ago', label: 'Config deployed to 233 PoPs — cache hit ratio threshold', kind: 'deploy' },
            { id: 'ce2', time: '3d ago', label: 'Arbiter detected BGP flap at Frankfurt PoP — rerouted 4 Tbps to Amsterdam', kind: 'agent' },
          ],
          components: [
            { id: 'cc1', name: 'BGP Router', description: 'Quagga-based BGP routing at each PoP', tech: 'Quagga / FreeBSD' },
            { id: 'cc2', name: 'Cache Layer', description: 'nginx video segment cache', tech: 'nginx / FreeBSD' },
          ],
          knowledge: [{ id: 'cek1', title: 'CDN Architecture Overview', type: 'architecture', summary: 'ISP appliance tiers, cache fill from S3 origin, BGP anycast routing, fallback to AWS CloudFront.', author: 'Arbiter', updatedAt: '2026-01-22' }],
          notifications: mkNotifications(), dataSources: mkDS(),
        },
        {
          id: 'origin-server', name: 'Origin Server', description: 'AWS S3 + EC2 origin for CDN cache misses — last-resort delivery layer',
          environment: 'production', repoUrl: 'github.com/netflix/origin-server',
          agents: [], investigations: 0, docs: 4,
          healthScore: 100, sloTarget: '99.95%', sloActual: '100%',
          lastDeploy: { who: 'CDN CI', when: '7d ago', commit: '9de21f', message: 'chore: S3 transfer acceleration for EU regions', status: 'success' },
          recentActivity: [{ id: 'os1', time: '7d ago', label: 'Deploy 9de21f — S3 transfer acceleration for EU', kind: 'deploy' }],
          components: [], knowledge: mkKnowledge(), notifications: mkNotifications(), dataSources: mkDS(),
        },
      ],
    },
    {
      id: 'data-science', name: 'Data Science & ML', description: 'Recommendation engine, personalization, and A/B experimentation platform',
      owner: 'Personalization Team', notificationChannel: '#ml-ops',
      knowledge: [{ id: 'dsk1', title: 'Recommendation Model Deployment SOP', type: 'sop', summary: 'Shadow traffic testing, A/B split with 1% traffic, metric gates (CTR, retention), full rollout criteria.', author: 'ML Platform', updatedAt: '2026-02-05' }],
      projects: [
        {
          id: 'recommendation-engine', name: 'Recommendation Engine', description: 'Real-time collaborative filtering — 238M subscribers, 40ms P99 latency SLO',
          environment: 'production', serviceUrl: 'https://recommendations.netflix.internal', repoUrl: 'github.com/netflix/recommendation-engine',
          agents: ['Operon AI', 'Navigator'], investigations: 0, docs: 15,
          healthScore: 99.8, sloTarget: '99.9%', sloActual: '99.82%',
          onCall: { name: 'Jessie Banning', until: 'Until Wed 08:00 PT' },
          lastDeploy: { who: 'ML Pipeline', when: '3d ago', commit: 'rec-v8.2.1', message: 'model: two-tower retrieval v8.2 — +3.1% CTR lift in A/B', status: 'success' },
          recentActivity: [
            { id: 're1', time: '3d ago', label: 'Model rec-v8.2.1 promoted to 100% traffic — +3.1% CTR', kind: 'deploy' },
            { id: 're2', time: '5d ago', label: 'Navigator detected feature drift in watch-history embeddings — retraining triggered', kind: 'agent' },
          ],
          components: [
            { id: 'rec1', name: 'Two-Tower Retrieval', description: 'Candidate retrieval from 80K title catalog', tech: 'TensorFlow / Triton' },
            { id: 'rec2', name: 'Ranking Model', description: 'Cross-attention ranking over retrieved candidates', tech: 'PyTorch' },
            { id: 'rec3', name: 'Feature Store', description: 'Online features via Cassandra + Flink', tech: 'Apache Flink / Cassandra' },
          ],
          knowledge: [
            { id: 'rek1', title: 'Two-Tower Model Architecture', type: 'architecture', summary: 'User tower, item tower, dot-product similarity, ANN index with FAISS. Design doc for the two-tower retrieval architecture.', author: 'Navigator', updatedAt: '2026-02-15' },
            { id: 'rek2', title: 'Feature Drift Detection Runbook', type: 'runbook', summary: 'Detect and respond to feature drift: KL divergence monitoring, retraining triggers, canary evaluation before full promotion.', author: 'Operon AI', updatedAt: '2026-01-28' },
          ],
          notifications: mkNotifications(), dataSources: mkDS(),
        },
        {
          id: 'ab-platform', name: 'A/B Testing Platform', description: 'Experimentation infrastructure — 1,200+ concurrent tests, Bayesian stopping rules',
          environment: 'production', serviceUrl: 'https://experimentation.netflix.internal', repoUrl: 'github.com/netflix/ab-platform',
          agents: ['Operon AI'], investigations: 0, docs: 7,
          healthScore: 99.6, sloTarget: '99.5%', sloActual: '99.63%',
          lastDeploy: { who: 'Experimentation CI', when: '2d ago', commit: 'exp-112', message: 'feat: Bayesian stopping rule for faster conclusions', status: 'success' },
          recentActivity: [{ id: 'ab1', time: '2d ago', label: 'Deploy exp-112 — Bayesian stopping rule', kind: 'deploy' }],
          components: [], knowledge: mkKnowledge(), notifications: mkNotifications(), dataSources: mkDS(),
        },
      ],
    },
    {
      id: 'consumer-products', name: 'Consumer Products', description: 'Account management, billing, search, and discovery surfaces',
      owner: 'Consumer Engineering', notificationChannel: '#consumer-alerts',
      knowledge: [],
      projects: [
        {
          id: 'account-service', name: 'Account Service', description: 'User authentication, profiles, and subscription management — 238M active accounts',
          environment: 'production', serviceUrl: 'https://account.netflix.com', repoUrl: 'github.com/netflix/account-service',
          agents: ['Sentinel'], investigations: 0, docs: 10,
          healthScore: 99.99, sloTarget: '99.99%', sloActual: '99.99%',
          onCall: { name: 'Spencer Neumann', until: 'Until Fri 08:00 PT' },
          lastDeploy: { who: 'Account CI', when: '1d ago', commit: 'd9a33e', message: 'feat: password-less magic link login', status: 'success' },
          recentActivity: [{ id: 'acc1', time: '1d ago', label: 'Deploy d9a33e — password-less magic link login', kind: 'deploy' }],
          components: [], knowledge: mkKnowledge(), notifications: mkNotifications(), dataSources: mkDS(),
        },
        {
          id: 'billing-service', name: 'Billing Service', description: 'Subscription billing, invoicing, and payment retry — $33B ARR processed',
          environment: 'production', serviceUrl: 'https://billing.netflix.com', repoUrl: 'github.com/netflix/billing-service',
          agents: ['Operon AI', 'Sentinel'], investigations: 2, docs: 8,
          healthScore: 93.5, sloTarget: '99.9%', sloActual: '99.61%',
          onCall: { name: 'Spencer Neumann', until: 'Until Fri 08:00 PT' },
          lastDeploy: { who: 'Billing CI', when: '12h ago', commit: 'bill-88', message: 'fix: Stripe webhook retry storm mitigation', status: 'success' },
          recentActivity: [
            { id: 'bl1', time: '2d ago', label: 'Operon AI opened INV-1201 — Stripe webhook lag > 45s (P1)', kind: 'incident' },
            { id: 'bl2', time: '1d ago', label: 'Operon AI opened INV-1203 — payment retry rate 8.4% elevated (P2)', kind: 'incident' },
            { id: 'bl3', time: '12h ago', label: 'Deploy bill-88 — Stripe webhook retry storm mitigation', kind: 'deploy' },
          ],
          components: [],
          knowledge: [
            { id: 'blk1', title: 'Billing Webhook Runbook', type: 'runbook', summary: 'Diagnose Stripe webhook delivery failures: retry queue depth, circuit breaker config, Stripe incident escalation.', author: 'Operon AI', updatedAt: '2026-03-01' },
            { id: 'blk2', title: 'Billing Postmortem — Feb 2026', type: 'postmortem', summary: 'P1: payment lag from Stripe API rate limiting during invoice batch. Fixed with request batching and exponential backoff.', author: 'Operon AI', updatedAt: '2026-02-20' },
          ],
          notifications: { enabled: true, platform: 'both', slackChannel: '#billing-critical', teamsChannel: 'Finance Incidents', events: { new_investigation: true, root_cause_identified: true, remediation_suggested: true, investigation_resolved: true, agent_health_alerts: true }, alertLevels: { p1: true, p2: true, p3: true } },
          dataSources: mkDS(),
        },
        {
          id: 'search-api', name: 'Search API', description: 'Global content search — titles, people, genres across 190 countries in 30+ languages',
          environment: 'production', serviceUrl: 'https://search.netflix.com', repoUrl: 'github.com/netflix/search-api',
          agents: [], investigations: 0, docs: 5,
          healthScore: 99.7, sloTarget: '99.5%', sloActual: '99.71%',
          lastDeploy: { who: 'Search CI', when: '3d ago', commit: 'srch-44', message: 'feat: semantic search v2 with multilingual BERT', status: 'success' },
          recentActivity: [{ id: 'se1', time: '3d ago', label: 'Deploy srch-44 — semantic search v2, multilingual BERT', kind: 'deploy' }],
          components: [], knowledge: mkKnowledge(), notifications: mkNotifications(), dataSources: mkDS(),
        },
      ],
    },
  ],
  stripe: [
    {
      id: 'core-payments', name: 'Core Payments', description: 'Charges, refunds, payment intents, and authorization flows',
      owner: 'Payments SRE', notificationChannel: '#payments-critical',
      knowledge: [{ id: 'cpk1', title: 'Payment Processing Runbook', type: 'runbook', summary: 'Charge failure rate spikes: network partitions, idempotency key collisions, bank decline interpretation.', author: 'Payments SRE', updatedAt: '2026-02-22' }],
      projects: [
        {
          id: 'charges-api', name: 'Charges API', description: 'Core payment intent creation, authorization, and capture — 250M req/day',
          environment: 'production', serviceUrl: 'https://api.stripe.com/v1/charges', repoUrl: 'github.com/stripe/charges-api',
          agents: ['Operon AI', 'Sentinel'], investigations: 0, docs: 18,
          healthScore: 99.999, sloTarget: '99.999%', sloActual: '99.999%',
          onCall: { name: 'Patrick Collison', until: 'Until Thu 09:00 CT' },
          lastDeploy: { who: 'Payments CI', when: '2d ago', commit: 'chg-901', message: 'feat: 3D Secure 2.2 compliance for EU SCA', status: 'success' },
          recentActivity: [
            { id: 'chg1', time: '2d ago', label: 'Deploy chg-901 — 3D Secure 2.2 EU SCA compliance', kind: 'deploy' },
            { id: 'chg2', time: '5d ago', label: 'Operon AI completed synthetic transaction monitoring calibration', kind: 'agent' },
          ],
          components: [
            { id: 'chgc1', name: 'Authorization Engine', description: 'Card auth with network routing optimization', tech: 'Elixir' },
            { id: 'chgc2', name: 'Idempotency Layer', description: 'Distributed key deduplication', tech: 'Go / Redis' },
            { id: 'chgc3', name: 'Network Router', description: 'Intelligent routing across Visa, MC, Amex', tech: 'Go' },
          ],
          knowledge: mkKnowledge(),
          notifications: { enabled: true, platform: 'both', slackChannel: '#charges-p0', teamsChannel: 'Payments War Room', events: { new_investigation: true, root_cause_identified: true, remediation_suggested: true, investigation_resolved: true, agent_health_alerts: true }, alertLevels: { p1: true, p2: true, p3: true } },
          dataSources: mkDS(),
        },
        {
          id: 'payment-methods', name: 'Payment Methods', description: 'Bank transfer, BNPL, digital wallets — 50+ global payment methods across 135+ currencies',
          environment: 'production', repoUrl: 'github.com/stripe/payment-methods',
          agents: ['Operon AI'], investigations: 1, docs: 22,
          healthScore: 98.2, sloTarget: '99.5%', sloActual: '99.31%',
          onCall: { name: 'Dhivya Suryadevara', until: 'Until Wed 10:00 CT' },
          lastDeploy: { who: 'PM CI', when: '1d ago', commit: 'pm-441', message: 'feat: Klarna BNPL checkout flow v3', status: 'success' },
          recentActivity: [
            { id: 'pm1', time: '2d ago', label: 'Operon AI opened INV-2041 — Klarna API degradation affecting EU checkout (P2)', kind: 'incident' },
            { id: 'pm2', time: '1d ago', label: 'Deploy pm-441 — Klarna BNPL checkout flow v3', kind: 'deploy' },
          ],
          components: [], knowledge: mkKnowledge(), notifications: mkNotifications(), dataSources: mkDS(),
        },
        {
          id: 'refunds-engine', name: 'Refunds Engine', description: 'Full and partial refund processing with bank network settlement',
          environment: 'production', repoUrl: 'github.com/stripe/refunds-engine',
          agents: ['Sentinel'], investigations: 0, docs: 6,
          healthScore: 99.95, sloTarget: '99.9%', sloActual: '99.95%',
          lastDeploy: { who: 'Refunds Team', when: '4d ago', commit: 'ref-211', message: 'fix: ACH refund settlement timing edge case', status: 'success' },
          recentActivity: [{ id: 'ref1', time: '4d ago', label: 'Deploy ref-211 — ACH refund settlement timing fix', kind: 'deploy' }],
          components: [], knowledge: mkKnowledge(), notifications: mkNotifications(), dataSources: mkDS(),
        },
      ],
    },
    {
      id: 'developer-platform', name: 'Developer Platform', description: 'API gateway, webhooks, Stripe.js, and developer tooling infrastructure',
      owner: 'Developer Experience SRE', notificationChannel: '#devplatform-alerts',
      knowledge: [],
      projects: [
        {
          id: 'api-gateway-stripe', name: 'API Gateway', description: 'Unified API entry point — 1B+ req/day, 99.999% availability SLO',
          environment: 'production', serviceUrl: 'https://api.stripe.com', repoUrl: 'github.com/stripe/api-gateway',
          agents: ['Operon AI', 'Arbiter'], investigations: 0, docs: 11,
          healthScore: 99.999, sloTarget: '99.999%', sloActual: '99.999%',
          onCall: { name: 'John Collison', until: 'Until Thu 09:00 CT' },
          lastDeploy: { who: 'Gateway CI', when: '3h ago', commit: 'gw-229', message: 'feat: per-key rate limit granularity by endpoint', status: 'success' },
          recentActivity: [
            { id: 'gw1', time: '3h ago', label: 'Deploy gw-229 — per-key rate limit granularity', kind: 'deploy' },
            { id: 'gw2', time: '1d ago', label: 'Arbiter detected TLS cert near expiry on eu-west-1 — rotated automatically', kind: 'agent' },
          ],
          components: [], knowledge: mkKnowledge(), notifications: mkNotifications(), dataSources: mkDS(),
        },
        {
          id: 'webhooks-service', name: 'Webhooks Service', description: 'Reliable event delivery — retry, circuit breakers, endpoint health scoring',
          environment: 'production', repoUrl: 'github.com/stripe/webhooks-service',
          agents: ['Sentinel'], investigations: 0, docs: 7,
          healthScore: 99.8, sloTarget: '99.9%', sloActual: '99.82%',
          lastDeploy: { who: 'Webhooks Team', when: '5d ago', commit: 'wh-119', message: 'feat: smart retry backoff with endpoint health scoring', status: 'success' },
          recentActivity: [{ id: 'wh1', time: '5d ago', label: 'Deploy wh-119 — smart retry backoff', kind: 'deploy' }],
          components: [], knowledge: mkKnowledge(), notifications: mkNotifications(), dataSources: mkDS(),
        },
      ],
    },
    {
      id: 'risk-fraud', name: 'Risk & Fraud', description: 'Real-time fraud detection, chargeback management, and identity verification',
      owner: 'Risk Engineering', notificationChannel: '#fraud-alerts',
      knowledge: [{ id: 'rfk1', title: 'Fraud Spike Response Playbook', type: 'playbook', summary: 'Elevated fraud response: automatic model block thresholds, manual review queue, card network escalation.', author: 'Risk SRE', updatedAt: '2026-02-08' }],
      projects: [
        {
          id: 'radar-engine', name: 'Radar Engine', description: 'ML-powered fraud prevention — 500M decisions/day at < 50ms P99',
          environment: 'production', serviceUrl: 'https://radar.stripe.com', repoUrl: 'github.com/stripe/radar-engine',
          agents: ['Operon AI', 'Navigator'], investigations: 0, docs: 14,
          healthScore: 99.92, sloTarget: '99.9%', sloActual: '99.92%',
          onCall: { name: 'Cristina Cordova', until: 'Until Wed 09:00 CT' },
          lastDeploy: { who: 'Radar ML Pipeline', when: '1d ago', commit: 'radar-v11.3', message: 'model: card testing detection — 18% precision gain', status: 'success' },
          recentActivity: [
            { id: 'rad1', time: '1d ago', label: 'Radar v11.3 — card testing precision +18%', kind: 'deploy' },
            { id: 'rad2', time: '3d ago', label: 'Navigator flagged velocity spike from 3 EU BINs — temporary block applied', kind: 'agent' },
          ],
          components: [
            { id: 'radc1', name: 'Score Engine', description: 'Real-time GBM fraud scorer', tech: 'Scala / Spark' },
            { id: 'radc2', name: 'Rule Engine', description: 'Merchant-customizable fraud rules', tech: 'Go' },
            { id: 'radc3', name: 'ML Feature Store', description: 'Online features at <1ms P99', tech: 'Redis / Flink' },
          ],
          knowledge: mkKnowledge(), notifications: mkNotifications(), dataSources: mkDS(),
        },
        {
          id: 'identity-verification', name: 'Identity Verification', description: 'Stripe Identity — document scanning, face match, and KYC compliance for 40+ countries',
          environment: 'production', serviceUrl: 'https://identity.stripe.com', repoUrl: 'github.com/stripe/identity-verification',
          agents: ['Operon AI'], investigations: 0, docs: 9,
          healthScore: 99.5, sloTarget: '99.5%', sloActual: '99.53%',
          lastDeploy: { who: 'Identity CI', when: '3d ago', commit: 'id-v4.1', message: 'feat: EU passcard support for 12 new countries', status: 'success' },
          recentActivity: [{ id: 'id1', time: '3d ago', label: 'Deploy id-v4.1 — EU passcard support, 12 countries', kind: 'deploy' }],
          components: [], knowledge: mkKnowledge(), notifications: mkNotifications(), dataSources: mkDS(),
        },
      ],
    },
  ],
  vercel: [
    {
      id: 'edge-network', name: 'Edge Network', description: 'Global CDN and edge compute — 100+ PoPs, Anycast routing, V8 isolation',
      owner: 'Edge Infrastructure SRE', notificationChannel: '#edge-incidents',
      knowledge: [],
      projects: [
        {
          id: 'edge-functions', name: 'Edge Functions Runtime', description: 'V8-isolated serverless at the CDN edge — 100+ PoPs, sub-5ms cold start',
          environment: 'production', serviceUrl: 'https://vercel.com/edge', repoUrl: 'github.com/vercel/edge-runtime',
          agents: ['Operon AI', 'Cortex'], investigations: 0, docs: 8,
          healthScore: 99.7, sloTarget: '99.9%', sloActual: '99.73%',
          onCall: { name: 'Guillermo Rauch', until: 'Until Fri 10:00 ET' },
          lastDeploy: { who: 'Edge CI', when: '8h ago', commit: 'edge-v2.9', message: 'feat: Node.js 22 compat layer for edge runtime', status: 'success' },
          recentActivity: [
            { id: 'ef1', time: '8h ago', label: 'Deploy edge-v2.9 — Node.js 22 compatibility layer', kind: 'deploy' },
            { id: 'ef2', time: '2d ago', label: 'Cortex auto-rolled back edge-v2.8 after 0.3% error rate spike at ORD PoP', kind: 'resolved' },
          ],
          components: [], knowledge: mkKnowledge(), notifications: mkNotifications(), dataSources: mkDS(),
        },
        {
          id: 'cdn-router', name: 'CDN Router', description: 'Intelligent request routing — cache, origin selection, and geo-steering at the edge',
          environment: 'production', repoUrl: 'github.com/vercel/cdn-router',
          agents: ['Arbiter'], investigations: 1, docs: 5,
          healthScore: 96.8, sloTarget: '99.5%', sloActual: '99.21%',
          onCall: { name: 'Malte Ubl', until: 'Until Thu 10:00 ET' },
          lastDeploy: { who: 'Router CI', when: '2h ago', commit: 'rt-109', message: 'fix: geo-steering miss for APAC traffic during US off-peak', status: 'success' },
          recentActivity: [
            { id: 'cdr1', time: '6h ago', label: 'Arbiter opened INV-882 — APAC cache hit ratio drop 12% (P2)', kind: 'incident' },
            { id: 'cdr2', time: '2h ago', label: 'Deploy rt-109 — geo-steering fix for APAC traffic', kind: 'deploy' },
          ],
          components: [], knowledge: mkKnowledge(), notifications: mkNotifications(), dataSources: mkDS(),
        },
      ],
    },
    {
      id: 'build-system', name: 'Build System', description: 'Turborepo-powered CI/CD — instant remote cache, preview deployments, build analytics',
      owner: 'Build Platform SRE', notificationChannel: '#builds-alerts',
      knowledge: [],
      projects: [
        {
          id: 'build-cache', name: 'Build Cache', description: 'Remote build cache — Turborepo, Nx, and GitHub Actions integration',
          environment: 'production', serviceUrl: 'https://cache.vercel.com', repoUrl: 'github.com/vercel/build-cache',
          agents: ['Operon AI'], investigations: 0, docs: 4,
          healthScore: 99.8, sloTarget: '99.5%', sloActual: '99.82%',
          lastDeploy: { who: 'Build CI', when: '3d ago', commit: 'bc-77', message: 'feat: artifact compression — 40% size reduction', status: 'success' },
          recentActivity: [{ id: 'bc1', time: '3d ago', label: 'Deploy bc-77 — 40% artifact size reduction', kind: 'deploy' }],
          components: [], knowledge: mkKnowledge(), notifications: mkNotifications(), dataSources: mkDS(),
        },
        {
          id: 'preview-deployments', name: 'Preview Deployments', description: 'Automatic preview URLs for every Git branch and PR — GitHub, GitLab, Bitbucket',
          environment: 'production', serviceUrl: 'https://vercel.com/docs/deployments/preview', repoUrl: 'github.com/vercel/deployments',
          agents: ['Sentinel'], investigations: 0, docs: 6,
          healthScore: 99.4, sloTarget: '99.0%', sloActual: '99.41%',
          lastDeploy: { who: 'Deploy Team', when: '1d ago', commit: 'dep-222', message: 'feat: GitHub Checks API for deployment status', status: 'success' },
          recentActivity: [{ id: 'pd1', time: '1d ago', label: 'Deploy dep-222 — GitHub Checks API integration', kind: 'deploy' }],
          components: [], knowledge: mkKnowledge(), notifications: mkNotifications(), dataSources: mkDS(),
        },
      ],
    },
  ],
}

// ─── Integrations Catalog ─────────────────────────────────────────────────────
export const INT_CATEGORIES: IntCategory[] = [
  { id: 'monitoring', label: 'Monitoring', color: '#60a5fa', items: [
    { id: 'datadog',    name: 'Datadog',     logo: '🐕', connected: true,  description: 'APM, metrics, logs and distributed tracing', badge: 'Primary', config: { 'API Key': 'dd-api-••••••••••••••••', Region: 'US1' }, dsFields: { 'Service Name': 'e.g. video-encoder', 'Environment': 'prod', 'APM Service': 'e.g. encoder' } },
    { id: 'grafana',    name: 'Grafana',     logo: '📊', connected: true,  description: 'Dashboards and observability platform', config: { URL: 'https://netflix.grafana.net', 'Token': 'glsa_••••••••••' }, dsFields: { 'Dashboard UID': '', 'Panel ID': '', 'Data Source': 'prometheus' } },
    { id: 'newrelic',   name: 'New Relic',   logo: '📈', connected: false, description: 'Full-stack observability and error tracking', dsFields: {} },
    { id: 'prometheus', name: 'Prometheus',  logo: '🔥', connected: false, description: 'Open-source metrics and alerting toolkit', dsFields: {} },
  ] },
  { id: 'logging', label: 'Logging', color: '#a78bfa', items: [
    { id: 'splunk',     name: 'Splunk',      logo: '🔍', connected: true,  description: 'Log aggregation, search, and SIEM', badge: 'Primary', config: { Host: 'splunk.internal:8089', Token: 'Splunk ••••••••' }, dsFields: { 'Index': '', 'Search Filter': '', 'Source': '' } },
    { id: 'cloudwatch', name: 'CloudWatch',  logo: '☁️', connected: true,  description: 'AWS native monitoring and log management', config: { Region: 'us-east-1' }, dsFields: { 'Log Group': '', 'Region': 'us-east-1', 'Namespace': '' } },
    { id: 'elk',        name: 'Elastic/ELK', logo: '🟡', connected: false, description: 'Elasticsearch, Logstash, and Kibana stack', dsFields: {} },
  ] },
  { id: 'alerting', label: 'Alerting', color: '#f87171', items: [
    { id: 'pagerduty',  name: 'PagerDuty',  logo: '🚨', connected: true,  description: 'On-call management and incident escalation', badge: 'Primary', config: { 'Integration Key': 'pd-••••••••', 'Service ID': 'PNFLX01' }, dsFields: { 'Service ID': '', 'Escalation Policy': 'Default' } },
    { id: 'opsgenie',   name: 'OpsGenie',   logo: '🛎️', connected: false, description: 'Alerting and on-call scheduling by Atlassian', dsFields: {} },
  ] },
  { id: 'source', label: 'Source Control', color: '#34d399', items: [
    { id: 'github',     name: 'GitHub',     logo: '🐙', connected: true,  description: 'Repository events, deployments, PR webhooks', config: { Organization: 'netflix', 'Repos Tracked': '47' }, dsFields: { 'Repository': '', 'Branch': 'main' } },
    { id: 'gitlab',     name: 'GitLab',     logo: '🦊', connected: false, description: 'Self-hosted or GitLab.com CI/CD events', dsFields: {} },
  ] },
  { id: 'flags', label: 'Feature Flags', color: '#fb923c', items: [
    { id: 'launchdarkly', name: 'LaunchDarkly', logo: '🚩', connected: true, description: 'Feature flag changes correlated with incidents', config: { 'SDK Key': 'sdk-••••••••' }, dsFields: { 'Project Key': '', 'Environment': 'production' } },
    { id: 'flagsmith',    name: 'Flagsmith',    logo: '🏴', connected: false, description: 'Open-source feature flags', dsFields: {} },
  ] },
  { id: 'ticketing', label: 'Ticketing', color: '#22d3ee', items: [
    { id: 'jira',        name: 'Jira',        logo: '🎯', connected: false, description: 'Auto-create incidents as Jira issues', dsFields: {} },
    { id: 'linear',      name: 'Linear',      logo: '⬡',  connected: false, description: 'Modern issue tracking for engineering', dsFields: {} },
    { id: 'servicenow',  name: 'ServiceNow',  logo: '🟢', connected: false, description: 'Enterprise ITSM and incident management', dsFields: {} },
  ] },
]

export const MOCK_MEMBERS: Member[] = [
  { name: 'Bozoma Saint John', email: 'bozoma@netflix.com',  role: 'Admin',   avatar: 'B', active: true },
  { name: 'Greg Peters',        email: 'greg@netflix.com',    role: 'Admin',   avatar: 'G', active: true },
  { name: 'Jessie Banning',     email: 'jessie@netflix.com',  role: 'Engineer',avatar: 'J', active: true },
  { name: 'Reed Hastings',      email: 'reed@netflix.com',    role: 'Viewer',  avatar: 'R', active: false },
]
