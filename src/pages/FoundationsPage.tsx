import { useState, useRef, useEffect } from 'react'
import {
  Building2, FolderOpen, Package, ChevronRight, ChevronDown,
  Plus, Globe, GitBranch, Key, Users, Shield, Zap,
  Activity, FileText, Bot, Check, BarChart3, Cloud,
  AlertCircle, GitCommit, Flag, Radio, Mail, MessageSquare,
  Plug, CheckCircle2, XCircle, RefreshCw, Eye, EyeOff, Copy,
  Settings, ArrowRight, Layers, Pencil, Trash2, X,
  ChevronDown as DropdownIcon, Database,
  BookOpen, ExternalLink, Clock, Upload, Link, File, Loader2,
  Bell, Save,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ─── Types ────────────────────────────────────────────────────────────────────
type HierarchyMode = 'simple' | 'standard' | 'advanced'
type ProjectTab = 'overview' | 'datasources' | 'agents' | 'components' | 'knowledge' | 'notifications'
type KnowledgeDocType = 'runbook' | 'architecture' | 'postmortem' | 'sop' | 'known-issue' | 'playbook'
type SourceKind = 'file' | 'confluence' | 'notion' | 'github' | 'google-docs' | 'url' | 'paste' | 'pagerduty' | 'servicenow' | 'sharepoint'

type NodeKind =
  | { cat: 'org'; orgId: string }
  | { cat: 'members'; orgId: string }
  | { cat: 'domain'; orgId: string; id: string }
  | { cat: 'project'; orgId: string; domainId: string; id: string }
  | { cat: 'int-category'; id: string }
  | { cat: 'integration'; categoryId: string; id: string }
  | { cat: 'notif'; id: string }
  | { cat: 'apikeys' }

interface ProjectNotificationConfig {
  enabled: boolean
  platform: 'slack' | 'teams' | 'both' | 'inherit'
  slackChannel: string
  teamsChannel: string
  events: {
    new_investigation: boolean
    root_cause_identified: boolean
    remediation_suggested: boolean
    investigation_resolved: boolean
    agent_health_alerts: boolean
  }
  alertLevels: { p1: boolean; p2: boolean; p3: boolean }
}

interface ProjectDataSource {
  integrationId: string
  enabled: boolean
  config: Record<string, string>
}
interface Component { id: string; name: string; description: string; tech: string }
interface KnowledgeDoc {
  id: string; title: string; type: KnowledgeDocType; summary: string
  author: string; updatedAt: string; link?: string
  source?: SourceKind; sourceRef?: string
}
interface Project {
  id: string; name: string; description: string; environment: string
  serviceUrl?: string; repoUrl?: string; agents: string[]
  investigations: number; integrations: number; docs: number
  dataSources: ProjectDataSource[]
  components: Component[]
  knowledge: KnowledgeDoc[]
  notifications?: ProjectNotificationConfig
}
interface Domain {
  id: string; name: string; description: string; owner: string
  notificationChannel: string; projects: Project[]
  knowledge: KnowledgeDoc[]
}
interface Org {
  id: string; name: string; industry: string; timezone: string; plan: string
  knowledge: KnowledgeDoc[]
}
interface IntegrationItem {
  id: string; name: string; logo: string; connected: boolean
  description: string; badge?: string; config?: Record<string, string>
  dsFields: Record<string, string>
}
interface IntCategory { id: string; label: string; icon: React.ElementType; color: string; items: IntegrationItem[] }

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_ORGS: Org[] = [
  { id: 'acme', name: 'Acme Corp', industry: 'SaaS / Software', timezone: 'UTC', plan: 'Enterprise',
    knowledge: [
      { id: 'ok1', title: 'Global Incident Response Playbook', type: 'playbook', summary: 'Step-by-step guide for all engineers when an incident is declared. Covers severity levels, communication templates, and stakeholder updates.', author: 'Harish Kumar', updatedAt: '2026-02-15' },
      { id: 'ok2', title: 'SLA & SLO Definitions', type: 'sop', summary: 'Defines availability, latency, and error rate SLOs for all production services. Used by AI agents to determine incident severity.', author: 'Priya Sharma', updatedAt: '2026-01-20' },
      { id: 'ok3', title: 'Escalation Matrix', type: 'sop', summary: 'Who to contact for P1/P2 incidents outside business hours. Includes on-call rotation schedule and direct contacts.', author: 'Jordan Blake', updatedAt: '2026-02-01' },
      { id: 'ok4', title: 'Post-Incident Review Template', type: 'postmortem', summary: 'Standard template for conducting 5-why analysis, identifying contributing factors, and tracking corrective actions.', author: 'Alex Chen', updatedAt: '2026-01-10' },
      { id: 'ok5', title: 'Security Incident Procedures', type: 'sop', summary: 'Specific runbook for data breach, credential exposure, and DDoS events. Includes legal and compliance notification steps.', author: 'Harish Kumar', updatedAt: '2025-12-01' },
    ],
  },
  { id: 'beta', name: 'Beta Ventures', industry: 'Financial Services', timezone: 'America/New_York', plan: 'Pro',
    knowledge: [
      { id: 'bk1', title: 'Financial Services Incident Policy', type: 'sop', summary: 'Regulatory compliance requirements for incident response in financial services. Mandatory reading for all engineers.', author: 'Beta Admin', updatedAt: '2026-01-05' },
    ],
  },
]

// Default notification config for new project
const mkNotifications = (): ProjectNotificationConfig => ({
  enabled: false,
  platform: 'inherit',
  slackChannel: '',
  teamsChannel: 'Incidents',
  events: {
    new_investigation: true,
    root_cause_identified: true,
    remediation_suggested: true,
    investigation_resolved: true,
    agent_health_alerts: true,
  },
  alertLevels: { p1: true, p2: true, p3: false },
})

// Default data sources for new project
const mkKnowledge = (): KnowledgeDoc[] => []
const mkDS = (): ProjectDataSource[] => [
  { integrationId: 'datadog',     enabled: false, config: { 'Service Name': '', 'Environment': 'prod', 'APM Service': '' } },
  { integrationId: 'splunk',      enabled: false, config: { 'Index': '', 'Search Filter': '', 'Source': '' } },
  { integrationId: 'cloudwatch',  enabled: false, config: { 'Log Group': '', 'Region': 'us-east-1', 'Namespace': '' } },
  { integrationId: 'grafana',     enabled: false, config: { 'Dashboard UID': '', 'Panel ID': '', 'Data Source': 'prometheus' } },
  { integrationId: 'github',      enabled: false, config: { 'Repository': '', 'Branch': 'main' } },
  { integrationId: 'pagerduty',   enabled: false, config: { 'Service ID': '', 'Escalation Policy': 'Default' } },
  { integrationId: 'launchdarkly',enabled: false, config: { 'Project Key': '', 'Environment': 'production' } },
]

const INITIAL_DOMAINS: Record<string, Domain[]> = {
  acme: [
    { id: 'ecom', name: 'E-Commerce', description: 'Customer-facing commerce services', owner: 'Commerce Team', notificationChannel: '#ecom-incidents',
      knowledge: [
        { id: 'ek1', title: 'E-Commerce On-Call Runbook', type: 'runbook', summary: 'Primary runbook for the Commerce team. Covers checkout failures, payment gateway issues, cart service degradation, and catalog search outages.', author: 'Commerce Team', updatedAt: '2026-02-20' },
        { id: 'ek2', title: 'Payment Flow Architecture', type: 'architecture', summary: 'Full architecture diagram of the payment processing pipeline — from cart to Stripe to ledger reconciliation. Includes failure modes and fallback paths.', author: 'Alex Chen', updatedAt: '2026-01-15' },
        { id: 'ek3', title: 'Black Friday Scaling Procedures', type: 'playbook', summary: 'Step-by-step scaling playbook for peak traffic events. Includes pre-scaling checklists, cache warm-up procedures, and rollback thresholds.', author: 'Harish Kumar', updatedAt: '2025-11-01' },
        { id: 'ek4', title: 'Common Checkout Errors & Fixes', type: 'known-issue', summary: 'Catalogue of recurring checkout errors with root causes and known fixes. Includes Stripe timeout patterns, inventory lock contention, and session expiry issues.', author: 'Priya Sharma', updatedAt: '2026-02-28' },
      ],
      projects: [
        { id: 'checkout', name: 'Checkout Service', description: 'End-to-end checkout and payment flow', environment: 'production', serviceUrl: 'https://checkout.acme.io', repoUrl: 'github.com/acme/checkout-service', agents: ['AI Agent Alpha', 'Patcher'], investigations: 3, integrations: 5, docs: 8, components: [{ id: 'c1', name: 'Payment Processor', description: 'Stripe and PayPal adapter', tech: 'Node.js' }, { id: 'c2', name: 'Cart Validator', description: 'Pre-checkout cart rules engine', tech: 'Go' }],
          knowledge: [
            { id: 'ck1', title: 'Checkout Service Architecture', type: 'architecture', summary: 'Component diagram for the checkout service. Covers the request lifecycle from cart validation through payment processing to order confirmation, including all external API calls.', author: 'Alex Chen', updatedAt: '2026-02-10' },
            { id: 'ck2', title: 'Checkout Deployment Runbook', type: 'runbook', summary: 'Step-by-step deployment procedure for the checkout service. Includes feature flag verification, smoke tests, and rollback criteria.', author: 'Harish Kumar', updatedAt: '2026-02-25' },
            { id: 'ck3', title: 'Known Issue: Stripe Timeout on High Load', type: 'known-issue', summary: 'Under sustained load > 500 req/s, Stripe webhook callbacks experience 2-5s delays. Workaround: enable async payment confirmation mode in config. Permanent fix scheduled for Q2 2026.', author: 'Priya Sharma', updatedAt: '2026-03-01' },
            { id: 'ck4', title: 'Checkout Service Postmortem — March 2026', type: 'postmortem', summary: 'P1 incident on March 2 2026. Connection pool exhaustion caused 4x checkout failure rate for 75 minutes. Root cause: max_connections too low after traffic spike. Fix: increased to 200, added auto-scaling trigger.', author: 'AI Agent Alpha', updatedAt: '2026-03-02' },
          ],
          dataSources: [
            { integrationId: 'datadog',    enabled: true,  config: { 'Service Name': 'checkout-service', 'Environment': 'prod', 'APM Service': 'checkout' } },
            { integrationId: 'splunk',     enabled: true,  config: { 'Index': 'checkout-prod', 'Search Filter': 'source=checkout*', 'Source': 'checkout' } },
            { integrationId: 'cloudwatch', enabled: true,  config: { 'Log Group': '/ecs/checkout-service', 'Region': 'us-east-1', 'Namespace': 'CheckoutService' } },
            { integrationId: 'grafana',    enabled: true,  config: { 'Dashboard UID': 'checkout-dash', 'Panel ID': '12', 'Data Source': 'prometheus' } },
            { integrationId: 'github',     enabled: true,  config: { 'Repository': 'acme/checkout-service', 'Branch': 'main' } },
            { integrationId: 'pagerduty',  enabled: false, config: { 'Service ID': 'P3KD8VX', 'Escalation Policy': 'Default' } },
            { integrationId: 'launchdarkly',enabled: false,config: { 'Project Key': '', 'Environment': 'production' } },
          ] },
        { id: 'catalog', name: 'Product Catalog', description: 'Product listing and search', environment: 'production', repoUrl: 'github.com/acme/product-catalog', agents: ['AI Agent Beta'], investigations: 1, integrations: 3, docs: 5, components: [], knowledge: [
            { id: 'catk1', title: 'Product Catalog Search Tuning', type: 'sop', summary: 'How to tune Elasticsearch relevance scoring for product search. Includes field weights, boosting rules, and synonyms configuration.', author: 'AI Agent Beta', updatedAt: '2026-02-18' },
          ], dataSources: [
            { integrationId: 'datadog',    enabled: true,  config: { 'Service Name': 'product-catalog', 'Environment': 'prod', 'APM Service': 'catalog' } },
            { integrationId: 'splunk',     enabled: true,  config: { 'Index': 'catalog-prod', 'Search Filter': '', 'Source': 'catalog' } },
            { integrationId: 'cloudwatch', enabled: false, config: { 'Log Group': '', 'Region': 'us-east-1', 'Namespace': '' } },
            { integrationId: 'grafana',    enabled: false, config: { 'Dashboard UID': '', 'Panel ID': '', 'Data Source': 'prometheus' } },
            { integrationId: 'github',     enabled: true,  config: { 'Repository': 'acme/product-catalog', 'Branch': 'main' } },
            { integrationId: 'pagerduty',  enabled: false, config: { 'Service ID': '', 'Escalation Policy': 'Default' } },
            { integrationId: 'launchdarkly',enabled: false,config: { 'Project Key': '', 'Environment': 'production' } },
          ] },
        { id: 'cart', name: 'Cart API', description: 'Shopping cart persistence layer', environment: 'production', repoUrl: 'github.com/acme/cart-api', agents: [], investigations: 0, integrations: 2, docs: 3, components: [], knowledge: mkKnowledge(), dataSources: mkDS() },
        { id: 'payment', name: 'Payment Gateway', description: 'Payment processing and reconciliation', environment: 'production', serviceUrl: 'https://payments.acme.io', repoUrl: 'github.com/acme/payment-gateway', agents: ['AI Agent Alpha'], investigations: 2, integrations: 4, docs: 6, components: [], knowledge: [
            { id: 'pgk1', title: 'Payment Gateway Timeout Runbook', type: 'runbook', summary: 'Diagnose and resolve payment gateway timeout spikes. Covers Stripe, Adyen, and PayPal integration failure modes.', author: 'Harish Kumar', updatedAt: '2026-02-12' },
            { id: 'pgk2', title: 'Payment Gateway Postmortem — Jan 2026', type: 'postmortem', summary: 'P1 incident: payment gateway timeout spike affecting 18% of transactions for 22 minutes. Root cause: upstream Stripe API degradation. Added circuit breaker.', author: 'AI Agent Alpha', updatedAt: '2026-01-18' },
          ], dataSources: mkDS() },
      ] },
    { id: 'infra', name: 'Infrastructure', description: 'Core platform and reliability services', owner: 'Platform Team', notificationChannel: '#infra-alerts',
      knowledge: [
        { id: 'ik1', title: 'Infrastructure Scaling Runbook', type: 'runbook', summary: 'How to scale ECS clusters, RDS read replicas, and Redis instances under load. Includes auto-scaling thresholds and manual override procedures.', author: 'Platform Team', updatedAt: '2026-02-05' },
        { id: 'ik2', title: 'Network Topology Diagram', type: 'architecture', summary: 'Full network diagram for the Acme Corp production VPC. Includes subnets, security groups, NAT gateways, and peering connections.', author: 'Alex Chen', updatedAt: '2026-01-30' },
        { id: 'ik3', title: 'Load Balancer Configuration Guide', type: 'sop', summary: 'How to configure and troubleshoot the ALB — health check settings, target group weights, sticky sessions, and SSL termination.', author: 'Jordan Blake', updatedAt: '2025-12-20' },
      ],
      projects: [
        { id: 'auth', name: 'Auth Service', description: 'Authentication and authorization', environment: 'production', repoUrl: 'github.com/acme/auth-service', agents: ['AI Agent Gamma'], investigations: 0, integrations: 3, docs: 7, components: [], knowledge: [
            { id: 'authk1', title: 'Auth Service JWT Configuration', type: 'sop', summary: 'How to rotate JWT signing keys, configure token expiry, and handle refresh token lifecycle. Includes zero-downtime key rotation procedure.', author: 'AI Agent Gamma', updatedAt: '2026-02-22' },
          ], dataSources: mkDS() },
        { id: 'gateway', name: 'API Gateway', description: 'Unified API entry point and rate limiting', environment: 'production', serviceUrl: 'https://api.acme.io', repoUrl: 'github.com/acme/api-gateway', agents: ['Sentinel'], investigations: 1, integrations: 6, docs: 4, components: [], knowledge: [
            { id: 'gk1', title: 'API Gateway Rate Limiting Config', type: 'sop', summary: 'Per-route rate limit settings, burst allowances, and how to whitelist IP ranges for trusted services. Includes Redis-backed counter setup.', author: 'Sentinel', updatedAt: '2026-02-28' },
            { id: 'gk2', title: 'API Gateway Architecture', type: 'architecture', summary: 'Request flow from edge to backend services through the API Gateway. Covers authentication middleware, rate limiting, request transformation, and routing rules.', author: 'Harish Kumar', updatedAt: '2026-01-25' },
          ], dataSources: mkDS() },
        { id: 'lb', name: 'Load Balancer', description: 'Traffic distribution and health checking', environment: 'production', repoUrl: 'github.com/acme/load-balancer', agents: [], investigations: 0, integrations: 2, docs: 2, components: [], knowledge: mkKnowledge(), dataSources: mkDS() },
      ] },
    { id: 'data', name: 'Data Platform', description: 'Analytics, ML, and data processing', owner: 'Data Team', notificationChannel: '#data-ops',
      knowledge: [
        { id: 'dk1', title: 'Data Pipeline Monitoring Guide', type: 'runbook', summary: 'How to monitor ETL pipeline health — lag metrics, dead letter queue depth, schema validation failures, and reprocessing procedures.', author: 'AI Agent Beta', updatedAt: '2026-02-14' },
        { id: 'dk2', title: 'ML Model Deployment Procedures', type: 'sop', summary: 'Steps for deploying new ML model versions including A/B traffic splitting, shadow mode testing, and rollback criteria based on prediction drift.', author: 'Data Team', updatedAt: '2026-01-28' },
      ],
      projects: [
        { id: 'pipeline', name: 'Data Pipeline', description: 'ETL and streaming data processing', environment: 'production', repoUrl: 'github.com/acme/data-pipeline', agents: ['AI Agent Beta'], investigations: 1, integrations: 4, docs: 9, components: [], knowledge: [
            { id: 'dpk1', title: 'ETL Pipeline Troubleshooting', type: 'runbook', summary: 'Common pipeline failure patterns and fixes. Covers Kafka consumer lag, Spark OOM errors, schema registry conflicts, and checkpoint recovery.', author: 'AI Agent Beta', updatedAt: '2026-02-19' },
            { id: 'dpk2', title: 'Data Pipeline Postmortem — Feb 2026', type: 'postmortem', summary: 'P2 incident: 3-hour data lag caused by Kafka partition rebalance after broker restart. Root cause: incorrect replication factor on topic. Added monitoring alert.', author: 'AI Agent Beta', updatedAt: '2026-02-08' },
          ], dataSources: mkDS() },
        { id: 'analytics', name: 'Analytics API', description: 'Query and reporting layer', environment: 'production', serviceUrl: 'https://analytics.acme.io', repoUrl: 'github.com/acme/analytics-api', agents: [], investigations: 0, integrations: 3, docs: 5, components: [], knowledge: mkKnowledge(), dataSources: mkDS() },
        { id: 'ml', name: 'ML Models', description: 'Model serving and feature store', environment: 'staging', repoUrl: 'github.com/acme/ml-models', agents: ['AI Agent Gamma'], investigations: 0, integrations: 2, docs: 3, components: [], knowledge: mkKnowledge(), dataSources: mkDS() },
      ] },
  ],
  beta: [
    { id: 'bfinance', name: 'Finance Core', description: 'Ledger and transaction processing', owner: 'Finance Eng', notificationChannel: '#finance-alerts',
      knowledge: [],
      projects: [
        { id: 'ledger', name: 'Ledger Service', description: 'Double-entry bookkeeping engine', environment: 'production', repoUrl: 'github.com/beta/ledger', agents: [], investigations: 0, integrations: 2, docs: 4, components: [], knowledge: mkKnowledge(), dataSources: mkDS() },
      ] },
  ],
}

const INT_CATEGORIES: IntCategory[] = [
  { id: 'monitoring', label: 'Monitoring', icon: BarChart3, color: '#60a5fa', items: [
    { id: 'datadog', name: 'Datadog', logo: '🐕', connected: true, description: 'APM, metrics, logs and distributed tracing', badge: 'Primary', config: { 'API Key': 'dd-api-••••••••••••••••', 'App Key': 'dd-app-••••••••••••••••', Region: 'US1' }, dsFields: { 'Service Name': 'e.g. checkout-service', 'Environment': 'prod', 'APM Service': 'e.g. checkout' } },
    { id: 'grafana', name: 'Grafana', logo: '📊', connected: true, description: 'Dashboards and observability platform', config: { URL: 'https://acme.grafana.net', 'Service Account Token': 'glsa_••••••••••••••••' }, dsFields: { 'Dashboard UID': 'e.g. checkout-dash', 'Panel ID': 'e.g. 12', 'Data Source': 'prometheus' } },
    { id: 'newrelic', name: 'New Relic', logo: '📈', connected: false, description: 'Full-stack observability and error tracking', dsFields: {} },
    { id: 'prometheus', name: 'Prometheus', logo: '🔥', connected: false, description: 'Open-source metrics and alerting toolkit', dsFields: {} },
  ] },
  { id: 'logging', label: 'Logging', icon: FileText, color: '#a78bfa', items: [
    { id: 'splunk', name: 'Splunk', logo: '🔍', connected: true, description: 'Log aggregation, search, and SIEM', badge: 'Primary', config: { Host: 'splunk.acme.internal:8089', Token: 'Splunk ••••••••••••••••', Index: 'main' }, dsFields: { 'Index': 'e.g. checkout-prod', 'Search Filter': 'e.g. source=checkout*', 'Source': 'e.g. checkout' } },
    { id: 'cloudwatch', name: 'CloudWatch', logo: '☁️', connected: true, description: 'AWS native monitoring and log management', config: { Region: 'us-east-1', 'Log Groups': '12 configured' }, dsFields: { 'Log Group': 'e.g. /ecs/checkout-service', 'Region': 'us-east-1', 'Namespace': 'e.g. CheckoutService' } },
    { id: 'elk', name: 'Elastic / ELK', logo: '🟡', connected: false, description: 'Elasticsearch, Logstash, and Kibana stack', dsFields: {} },
    { id: 'loki', name: 'Grafana Loki', logo: '📦', connected: false, description: 'Log aggregation system inspired by Prometheus', dsFields: {} },
  ] },
  { id: 'alerting', label: 'Alerting', icon: AlertCircle, color: '#f87171', items: [
    { id: 'pagerduty', name: 'PagerDuty', logo: '🚨', connected: true, description: 'On-call management and incident escalation', badge: 'Primary', config: { 'Integration Key': 'pd-••••••••••••••••', 'Service ID': 'P3KD8VX', 'Escalation Policy': 'Default' }, dsFields: { 'Service ID': 'e.g. P3KD8VX', 'Escalation Policy': 'Default' } },
    { id: 'opsgenie', name: 'OpsGenie', logo: '🛎️', connected: false, description: 'Alerting and on-call scheduling by Atlassian', dsFields: {} },
  ] },
  { id: 'cloud', label: 'Cloud Providers', icon: Cloud, color: '#fbbf24', items: [
    { id: 'aws', name: 'Amazon Web Services', logo: '☁️', connected: true, description: 'EC2, ECS, RDS, CloudWatch and 200+ services', config: { 'Account ID': '123456789012', Region: 'us-east-1', Role: 'arn:aws:iam::123456789012:role/OpAi' }, dsFields: { 'Account ID': '123456789012', 'Region': 'us-east-1', 'ECS Cluster': 'e.g. checkout-cluster' } },
    { id: 'gcp', name: 'Google Cloud Platform', logo: '🌐', connected: false, description: 'GKE, BigQuery, Cloud Run and GCP services', dsFields: {} },
    { id: 'azure', name: 'Microsoft Azure', logo: '🔷', connected: false, description: 'AKS, Azure Monitor, App Insights', dsFields: {} },
  ] },
  { id: 'source', label: 'Source Control', icon: GitCommit, color: '#34d399', items: [
    { id: 'github', name: 'GitHub', logo: '🐙', connected: true, description: 'Repository events, deployments, and PR webhooks', config: { Organization: 'acme-corp', 'Webhook Secret': '••••••••••••••••', 'Repos Tracked': '24' }, dsFields: { 'Repository': 'e.g. acme/checkout-service', 'Branch': 'main' } },
    { id: 'gitlab', name: 'GitLab', logo: '🦊', connected: false, description: 'Self-hosted or GitLab.com CI/CD pipeline events', dsFields: {} },
  ] },
  { id: 'flags', label: 'Feature Flags', icon: Flag, color: '#fb923c', items: [
    { id: 'launchdarkly', name: 'LaunchDarkly', logo: '🚩', connected: true, description: 'Feature flag changes correlated with incidents', config: { 'SDK Key': 'sdk-••••••••••••••••', Project: 'production' }, dsFields: { 'Project Key': 'e.g. checkout', 'Environment': 'production' } },
    { id: 'flagsmith', name: 'Flagsmith', logo: '🏴', connected: false, description: 'Open-source feature flags and remote config', dsFields: {} },
  ] },
  { id: 'ticketing', label: 'Ticketing', icon: Layers, color: '#22d3ee', items: [
    { id: 'jira', name: 'Jira', logo: '🎯', connected: false, description: 'Auto-create incidents as Jira issues', dsFields: {} },
    { id: 'linear', name: 'Linear', logo: '⬡', connected: false, description: 'Modern issue tracking for engineering teams', dsFields: {} },
    { id: 'servicenow', name: 'ServiceNow', logo: '🟢', connected: false, description: 'Enterprise ITSM and incident management', dsFields: {} },
  ] },
]

const NOTIF_CHANNELS = [
  { id: 'slack', label: 'Slack', icon: MessageSquare, color: '#60a5fa', connected: true, desc: 'Route alerts and incident updates to Slack channels' },
  { id: 'teams', label: 'Microsoft Teams', icon: Users, color: '#818cf8', connected: false, desc: 'Post incident notifications to Teams channels via webhooks' },
  { id: 'email', label: 'Email Rules', icon: Mail, color: '#fbbf24', connected: true, desc: 'SMTP-based email routing for escalations and digests' },
  { id: 'pagerduty-notif', label: 'PagerDuty Routing', icon: Radio, color: '#f87171', connected: true, desc: 'Map incident severity to PagerDuty escalation policies' },
]

const MOCK_MEMBERS = [
  { name: 'Harish Kumar', email: 'harish@acme.io', role: 'Admin', avatar: 'H', active: true },
  { name: 'Priya Sharma', email: 'priya@acme.io', role: 'Engineer', avatar: 'P', active: true },
  { name: 'Alex Chen', email: 'alex@acme.io', role: 'Engineer', avatar: 'A', active: true },
  { name: 'Jordan Blake', email: 'jordan@acme.io', role: 'Viewer', avatar: 'J', active: false },
]

const ALL_AGENTS = ['AI Agent Alpha', 'AI Agent Beta', 'AI Agent Gamma', 'Sentinel', 'Patcher', 'Nexus']

const ENV_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  production:  { bg: 'rgba(16,185,129,0.1)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
  staging:     { bg: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  development: { bg: 'rgba(99,102,241,0.1)', color: '#818cf8', border: 'rgba(99,102,241,0.3)' },
}
const DOMAIN_COLORS = ['#f87171', '#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#fb923c']

// ─── Utility ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)

// ─── Shared UI ────────────────────────────────────────────────────────────────
const Slab = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="rounded-xl p-5 space-y-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{title}</p>
      {action}
    </div>
    {children}
  </div>
)

const Stat = ({ icon: I, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
    <I className="h-3.5 w-3.5" style={{ color }} />
    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
  </div>
)

const ConnBadge = ({ on }: { on: boolean }) => (
  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
    style={{ background: on ? 'rgba(16,185,129,0.1)' : 'var(--bg-elevated)', color: on ? '#34d399' : 'var(--text-muted)', border: `1px solid ${on ? 'rgba(16,185,129,0.3)' : 'var(--border)'}` }}>
    {on ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
    {on ? 'Connected' : 'Not connected'}
  </span>
)

const Dot = ({ on }: { on: boolean }) => (
  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: on ? '#34d399' : 'var(--text-muted)' }} />
)

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ConfirmModal({ title, message, onConfirm, onClose }: { title: string; message: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{message}</p>
      <div className="flex justify-end gap-3 pt-2">
        <button className="btn-secondary text-sm" onClick={onClose}>Cancel</button>
        <button className="text-sm px-4 py-2 rounded-lg font-medium" style={{ background: '#ef4444', color: '#fff' }} onClick={onConfirm}>Delete</button>
      </div>
    </Modal>
  )
}

// ─── Add/Edit Org Modal ────────────────────────────────────────────────────────
function OrgModal({ initial, onSave, onClose }: { initial?: Org; onSave: (o: Org) => void; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [industry, setIndustry] = useState(initial?.industry ?? 'SaaS / Software')
  const [tz, setTz] = useState(initial?.timezone ?? 'UTC')
  return (
    <Modal title={initial ? 'Edit Organization' : 'Add Organization'} onClose={onClose}>
      <div className="space-y-3">
        <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Organization Name *</label><input className="input text-sm" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Acme Corp" /></div>
        <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Industry</label>
          <select className="input text-sm" value={industry} onChange={e => setIndustry(e.target.value)}>
            {['SaaS / Software', 'Financial Services', 'E-commerce', 'Healthcare', 'Media & Entertainment', 'Logistics'].map(i => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Timezone</label>
          <select className="input text-sm" value={tz} onChange={e => setTz(e.target.value)}>
            {['UTC', 'America/New_York', 'America/Los_Angeles', 'Asia/Kolkata', 'Europe/London', 'Asia/Tokyo'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button className="btn-secondary text-sm" onClick={onClose}>Cancel</button>
        <button className="btn-primary text-sm" disabled={!name.trim()} onClick={() => { if (name.trim()) { onSave({ id: initial?.id ?? uid(), name: name.trim(), industry, timezone: tz, plan: initial?.plan ?? 'Pro', knowledge: initial?.knowledge ?? [] }); onClose() } }}>
          {initial ? 'Save Changes' : 'Create Organization'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Add/Edit Domain Modal ─────────────────────────────────────────────────────
function DomainModal({ initial, onSave, onClose }: { initial?: Domain; colorIdx?: number; onSave: (d: Domain) => void; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [desc, setDesc] = useState(initial?.description ?? '')
  const [owner, setOwner] = useState(initial?.owner ?? '')
  const [channel, setChannel] = useState(initial?.notificationChannel ?? '')
  return (
    <Modal title={initial ? 'Edit Domain' : 'Add Domain'} onClose={onClose}>
      <div className="space-y-3">
        <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Domain Name *</label><input className="input text-sm" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. E-Commerce" /></div>
        <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Description</label><input className="input text-sm" value={desc} onChange={e => setDesc(e.target.value)} placeholder="What services does this domain own?" /></div>
        <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Owner Team</label><input className="input text-sm" value={owner} onChange={e => setOwner(e.target.value)} placeholder="e.g. Commerce Team" /></div>
        <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Alert Channel</label><input className="input text-sm font-mono" value={channel} onChange={e => setChannel(e.target.value)} placeholder="#ecom-incidents" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button className="btn-secondary text-sm" onClick={onClose}>Cancel</button>
        <button className="btn-primary text-sm" disabled={!name.trim()} onClick={() => { if (name.trim()) { onSave({ id: initial?.id ?? uid(), name: name.trim(), description: desc, owner, notificationChannel: channel, projects: initial?.projects ?? [], knowledge: initial?.knowledge ?? [] }); onClose() } }}>
          {initial ? 'Save Changes' : 'Create Domain'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Add/Edit Project Modal ────────────────────────────────────────────────────
function ProjectModal({ initial, onSave, onClose }: { initial?: Project; onSave: (p: Project) => void; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [desc, setDesc] = useState(initial?.description ?? '')
  const [env, setEnv] = useState(initial?.environment ?? 'production')
  const [svcUrl, setSvcUrl] = useState(initial?.serviceUrl ?? '')
  const [repoUrl, setRepoUrl] = useState(initial?.repoUrl ?? '')
  return (
    <Modal title={initial ? 'Edit Project' : 'Add Project'} onClose={onClose}>
      <div className="space-y-3">
        <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Project Name *</label><input className="input text-sm" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Checkout Service" /></div>
        <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Description</label><input className="input text-sm" value={desc} onChange={e => setDesc(e.target.value)} placeholder="What does this service do?" /></div>
        <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Environment</label>
          <select className="input text-sm" value={env} onChange={e => setEnv(e.target.value)}>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
        </div>
        <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Service URL</label><input className="input text-sm font-mono" value={svcUrl} onChange={e => setSvcUrl(e.target.value)} placeholder="https://api.example.com" /></div>
        <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Repository URL</label><input className="input text-sm font-mono" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="github.com/org/repo" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button className="btn-secondary text-sm" onClick={onClose}>Cancel</button>
        <button className="btn-primary text-sm" disabled={!name.trim()} onClick={() => { if (name.trim()) { onSave({ id: initial?.id ?? uid(), name: name.trim(), description: desc, environment: env, serviceUrl: svcUrl || undefined, repoUrl: repoUrl || undefined, agents: initial?.agents ?? [], investigations: initial?.investigations ?? 0, integrations: initial?.integrations ?? 0, docs: initial?.docs ?? 0, dataSources: initial?.dataSources ?? mkDS(), components: initial?.components ?? [], knowledge: initial?.knowledge ?? [] }); onClose() } }}>
          {initial ? 'Save Changes' : 'Create Project'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Project Panel ────────────────────────────────────────────────────────────
function ProjectPanel({ project, mode, onUpdate }: {
  project: Project; domainId?: string; orgId?: string; mode: HierarchyMode
  onUpdate: (p: Project) => void
}) {
  const [tab, setTab] = useState<ProjectTab>('overview')
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ name: project.name, description: project.description, environment: project.environment, serviceUrl: project.serviceUrl ?? '', repoUrl: project.repoUrl ?? '' })
  const [saved, setSaved] = useState(false)
  const [notifConfig, setNotifConfig] = useState<ProjectNotificationConfig>(project.notifications ?? mkNotifications())
  const [notifSaved, setNotifSaved] = useState(false)

  // keep form in sync when project changes (e.g. switching between projects)
  useEffect(() => {
    setForm({ name: project.name, description: project.description, environment: project.environment, serviceUrl: project.serviceUrl ?? '', repoUrl: project.repoUrl ?? '' })
    setNotifConfig(project.notifications ?? mkNotifications())
    setEditMode(false)
    setTab('overview')
  }, [project.id])

  const saveOverview = () => {
    onUpdate({ ...project, ...form, serviceUrl: form.serviceUrl || undefined, repoUrl: form.repoUrl || undefined })
    setEditMode(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const saveNotifications = () => {
    onUpdate({ ...project, notifications: notifConfig })
    setNotifSaved(true); setTimeout(() => setNotifSaved(false), 2000)
  }

  const toggleAgent = (agent: string) => {
    const agents = project.agents.includes(agent) ? project.agents.filter(a => a !== agent) : [...project.agents, agent]
    onUpdate({ ...project, agents })
  }

  const toggleDS = (integrationId: string) => {
    const ds = project.dataSources.map(d => d.integrationId === integrationId ? { ...d, enabled: !d.enabled } : d)
    onUpdate({ ...project, dataSources: ds })
  }

  const updateDSField = (integrationId: string, field: string, value: string) => {
    const ds = project.dataSources.map(d => d.integrationId === integrationId ? { ...d, config: { ...d.config, [field]: value } } : d)
    onUpdate({ ...project, dataSources: ds })
  }

  const addComponent = () => {
    const components = [...project.components, { id: uid(), name: 'New Component', description: '', tech: '' }]
    onUpdate({ ...project, components })
  }

  const updateComponent = (id: string, field: string, value: string) => {
    const components = project.components.map(c => c.id === id ? { ...c, [field]: value } : c)
    onUpdate({ ...project, components })
  }

  const deleteComponent = (id: string) => {
    onUpdate({ ...project, components: project.components.filter(c => c.id !== id) })
  }

  const e = ENV_STYLE[project.environment] ?? ENV_STYLE.development
  const enabledDSCount = project.dataSources.filter(d => d.enabled).length
  const configuredDSCount = project.dataSources.filter(d => d.enabled && Object.values(d.config).some(v => v.trim() !== '')).length

  const TABS = [
    { id: 'overview' as ProjectTab, label: 'Overview', icon: Settings },
    { id: 'datasources' as ProjectTab, label: 'Data Sources', icon: Database, badge: enabledDSCount > 0 ? `${configuredDSCount}/${enabledDSCount}` : undefined },
    { id: 'agents' as ProjectTab, label: 'Agents', icon: Bot, badge: project.agents.length > 0 ? String(project.agents.length) : undefined },
    { id: 'knowledge' as ProjectTab, label: 'Knowledge', icon: BookOpen, badge: project.knowledge.length > 0 ? String(project.knowledge.length) : undefined },
    { id: 'notifications' as ProjectTab, label: 'Notifications', icon: Bell, badge: notifConfig.enabled ? (notifConfig.platform === 'inherit' ? undefined : notifConfig.platform.toUpperCase()) : undefined },
    ...(mode === 'advanced' ? [{ id: 'components' as ProjectTab, label: 'Components', icon: Layers, badge: project.components.length > 0 ? String(project.components.length) : undefined }] : []),
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.12)' }}>
          <Package className="h-5 w-5" style={{ color: '#60a5fa' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{project.name}</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{project.description}</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: e.bg, color: e.color, border: `1px solid ${e.border}` }}>{project.environment}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-colors"
            style={{ background: tab === t.id ? 'var(--accent)' : 'transparent', color: tab === t.id ? '#fff' : 'var(--text-secondary)' }}>
            <t.icon className="h-3 w-3" />
            <span className="hidden sm:inline">{t.label}</span>
            {t.badge && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: tab === t.id ? 'rgba(255,255,255,0.25)' : 'var(--bg-surface)', color: tab === t.id ? '#fff' : 'var(--accent)' }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Stat icon={Activity} label="incidents" value={project.investigations} color="#f87171" />
            <Stat icon={Zap} label="integrations" value={enabledDSCount} color="#fbbf24" />
            <Stat icon={FileText} label="docs" value={project.docs} color="#34d399" />
          </div>
          <Slab title="Service Details" action={
            !editMode
              ? <button className="btn-secondary text-xs py-1" onClick={() => setEditMode(true)}><Pencil className="h-3 w-3" /> Edit</button>
              : <div className="flex gap-2">
                  <button className="btn-secondary text-xs py-1" onClick={() => { setEditMode(false); setForm({ name: project.name, description: project.description, environment: project.environment, serviceUrl: project.serviceUrl ?? '', repoUrl: project.repoUrl ?? '' }) }}>Cancel</button>
                  <button className="btn-primary text-xs py-1" onClick={saveOverview}>{saved ? <><Check className="h-3 w-3" /> Saved</> : 'Save'}</button>
                </div>
          }>
            {editMode ? (
              <div className="space-y-3">
                <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Name</label><input className="input text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Description</label><input className="input text-sm" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Environment</label>
                  <select className="input text-sm" value={form.environment} onChange={e => setForm(f => ({ ...f, environment: e.target.value }))}>
                    <option value="production">Production</option><option value="staging">Staging</option><option value="development">Development</option>
                  </select>
                </div>
                <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Service URL</label><input className="input text-sm font-mono" value={form.serviceUrl} onChange={e => setForm(f => ({ ...f, serviceUrl: e.target.value }))} /></div>
                <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Repository URL</label><input className="input text-sm font-mono" value={form.repoUrl} onChange={e => setForm(f => ({ ...f, repoUrl: e.target.value }))} /></div>
              </div>
            ) : (
              <div className="space-y-2">
                {form.serviceUrl && <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} /><span className="text-sm font-mono" style={{ color: 'var(--accent)' }}>{form.serviceUrl}</span></div>}
                {form.repoUrl && <div className="flex items-center gap-2"><GitBranch className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} /><span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>{form.repoUrl}</span></div>}
                {!form.serviceUrl && !form.repoUrl && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No URLs configured. Click Edit to add.</p>}
              </div>
            )}
          </Slab>
        </div>
      )}

      {/* Tab: Data Sources */}
      {tab === 'datasources' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Bot className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Configure exactly where AI agents should look when investigating incidents for <strong style={{ color: 'var(--text-primary)' }}>{project.name}</strong>. Enable each source and fill in the project-specific identifiers — index names, log groups, service tags, etc.
            </p>
          </div>

          {project.dataSources.map(ds => {
            const allItems = INT_CATEGORIES.flatMap(c => c.items)
            const intItem = allItems.find(i => i.id === ds.integrationId)
            if (!intItem || !intItem.connected) return null
            const cat = INT_CATEGORIES.find(c => c.items.some(i => i.id === ds.integrationId))
            const fieldsConfigured = ds.enabled ? Object.values(ds.config).filter(v => v.trim() !== '').length : 0
            const totalFields = Object.keys(ds.config).length

            return (
              <div key={ds.integrationId} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${ds.enabled ? (cat?.color ?? 'var(--border)') + '44' : 'var(--border)'}` }}>
                {/* Header row */}
                <div className="flex items-center gap-3 px-4 py-3" style={{ background: ds.enabled ? `${cat?.color ?? 'var(--accent)'}11` : 'var(--bg-elevated)' }}>
                  <span className="text-xl flex-shrink-0">{intItem.logo}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{intItem.name}</p>
                      {ds.enabled && fieldsConfigured > 0 && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                          <Bot className="h-2.5 w-2.5" /> AI target · {fieldsConfigured}/{totalFields} fields
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{intItem.description}</p>
                  </div>
                  {/* Toggle */}
                  <button onClick={() => toggleDS(ds.integrationId)}
                    className="w-10 h-5 rounded-full flex items-center px-0.5 flex-shrink-0 transition-colors"
                    style={{ background: ds.enabled ? 'var(--accent)' : 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                    <div className="w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ transform: ds.enabled ? 'translateX(20px)' : 'translateX(0)' }} />
                  </button>
                </div>

                {/* Config fields */}
                {ds.enabled && Object.keys(ds.config).length > 0 && (
                  <div className="px-4 pb-4 pt-3 grid grid-cols-2 gap-3" style={{ background: 'var(--bg-elevated)' }}>
                    {Object.entries(ds.config).map(([field, value]) => (
                      <div key={field}>
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{field}</label>
                        <input className="input text-xs font-mono"
                          value={value}
                          placeholder={(intItem.dsFields ?? {})[field] ?? ''}
                          onChange={e => updateDSField(ds.integrationId, field, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
            To connect more integrations, go to the Integrations section in the left tree.
          </p>
        </div>
      )}

      {/* Tab: Agents */}
      {tab === 'agents' && (
        <div className="space-y-4">
          <Slab title="Assigned Agents">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>These agents will automatically monitor and investigate incidents for {project.name}.</p>
            <div className="space-y-2">
              {ALL_AGENTS.map(agent => {
                const assigned = project.agents.includes(agent)
                return (
                  <div key={agent} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: assigned ? 'rgba(99,102,241,0.08)' : 'var(--bg-surface)', border: `1px solid ${assigned ? 'rgba(99,102,241,0.2)' : 'var(--border)'}` }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: assigned ? 'rgba(99,102,241,0.15)' : 'var(--bg-elevated)' }}>
                        <Bot className="h-3.5 w-3.5" style={{ color: assigned ? 'var(--accent)' : 'var(--text-muted)' }} />
                      </div>
                      <span className="text-xs font-medium" style={{ color: assigned ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{agent}</span>
                    </div>
                    <button onClick={() => toggleAgent(agent)}
                      className="text-xs px-3 py-1 rounded-lg font-medium"
                      style={{ background: assigned ? 'rgba(239,68,68,0.1)' : 'var(--accent)', color: assigned ? '#f87171' : '#fff', border: `1px solid ${assigned ? 'rgba(239,68,68,0.2)' : 'transparent'}` }}>
                      {assigned ? 'Remove' : 'Assign'}
                    </button>
                  </div>
                )
              })}
            </div>
          </Slab>
        </div>
      )}

      {/* Tab: Knowledge */}
      {tab === 'knowledge' && (
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <KnowledgeSection docs={project.knowledge} scopeLabel={`${project.name}`} />
        </div>
      )}

      {/* Tab: Notifications */}
      {tab === 'notifications' && (
        <div className="space-y-4">
          {/* Info banner */}
          <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Bell className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Configure project-level alert routing for <strong style={{ color: 'var(--text-primary)' }}>{project.name}</strong>. When enabled, these settings override the team-wide Slack / Teams defaults — so incidents and AI findings for this project land in the right channel automatically.
            </p>
          </div>

          {/* Enable / override toggle */}
          <Slab title="Project-Level Override">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Override team notifications</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {notifConfig.enabled ? 'Using project-specific channels below' : 'Currently falling back to team-level notification settings'}
                </p>
              </div>
              <button
                onClick={() => setNotifConfig(c => ({ ...c, enabled: !c.enabled }))}
                className="w-11 h-6 rounded-full flex items-center px-0.5 flex-shrink-0 transition-colors"
                style={{ background: notifConfig.enabled ? 'var(--accent)' : 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: notifConfig.enabled ? 'translateX(20px)' : 'translateX(0)' }} />
              </button>
            </div>
          </Slab>

          {notifConfig.enabled && (
            <>
              {/* Platform selection */}
              <Slab title="Notification Platform">
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'slack', label: 'Slack', emoji: '💬', desc: 'Send to a Slack channel' },
                    { value: 'teams', label: 'Microsoft Teams', emoji: '🟣', desc: 'Send to a Teams channel' },
                    { value: 'both', label: 'Both', emoji: '📣', desc: 'Slack + Teams simultaneously' },
                    { value: 'inherit', label: 'Team Default', emoji: '🔗', desc: 'Use org-level channel settings' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setNotifConfig(c => ({ ...c, platform: opt.value }))}
                      className="flex items-start gap-2.5 p-3 rounded-xl text-left transition-colors"
                      style={{
                        background: notifConfig.platform === opt.value ? 'rgba(99,102,241,0.12)' : 'var(--bg-surface)',
                        border: `1px solid ${notifConfig.platform === opt.value ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                      }}
                    >
                      <span className="text-lg flex-shrink-0">{opt.emoji}</span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: notifConfig.platform === opt.value ? 'var(--accent)' : 'var(--text-primary)' }}>{opt.label}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{opt.desc}</p>
                      </div>
                      {notifConfig.platform === opt.value && (
                        <CheckCircle2 className="h-3.5 w-3.5 ml-auto flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                      )}
                    </button>
                  ))}
                </div>

                {/* Slack channel input */}
                {(notifConfig.platform === 'slack' || notifConfig.platform === 'both') && (
                  <div className="mt-4 space-y-1.5">
                    <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Slack Channel</label>
                    <input
                      className="input text-sm font-mono"
                      value={notifConfig.slackChannel}
                      onChange={e => setNotifConfig(c => ({ ...c, slackChannel: e.target.value }))}
                      placeholder={`#${project.name.toLowerCase().replace(/\s+/g, '-')}-alerts`}
                    />
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Include the # prefix. The Operon bot must be invited to this channel.</p>
                  </div>
                )}

                {/* Teams channel dropdown */}
                {(notifConfig.platform === 'teams' || notifConfig.platform === 'both') && (
                  <div className="mt-4 space-y-1.5">
                    <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Teams Channel</label>
                    <select
                      className="input text-sm"
                      value={notifConfig.teamsChannel}
                      onChange={e => setNotifConfig(c => ({ ...c, teamsChannel: e.target.value }))}
                    >
                      {['General', 'Incidents', 'Engineering', 'On-Call', 'Alerts', 'DevOps'].map(ch => (
                        <option key={ch} value={ch}>{ch}</option>
                      ))}
                    </select>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Configure the Teams bot in Team Integrations to activate this channel.</p>
                  </div>
                )}
              </Slab>

              {/* Alert severity routing */}
              <Slab title="Alert Severity">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Choose which severity levels trigger a notification for this project.</p>
                <div className="space-y-2 mt-2">
                  {([
                    { key: 'p1' as const, label: 'P1 — Critical', desc: 'Production down, immediate action required', color: '#f87171', bg: 'rgba(239,68,68,0.08)' },
                    { key: 'p2' as const, label: 'P2 — High',     desc: 'Significant degradation affecting users',    color: '#fbbf24', bg: 'rgba(245,158,11,0.08)' },
                    { key: 'p3' as const, label: 'P3 — Medium',   desc: 'Partial impact, monitoring closely',          color: '#818cf8', bg: 'rgba(99,102,241,0.08)' },
                  ]).map(sev => (
                    <div key={sev.key} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: notifConfig.alertLevels[sev.key] ? sev.bg : 'var(--bg-surface)', border: `1px solid ${notifConfig.alertLevels[sev.key] ? sev.color + '44' : 'var(--border)'}` }}>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: sev.bg, color: sev.color }}>{sev.key.toUpperCase()}</span>
                        <div>
                          <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{sev.label}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{sev.desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifConfig(c => ({ ...c, alertLevels: { ...c.alertLevels, [sev.key]: !c.alertLevels[sev.key] } }))}
                        className="w-9 h-5 rounded-full flex items-center px-0.5 flex-shrink-0 transition-colors"
                        style={{ background: notifConfig.alertLevels[sev.key] ? sev.color : 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ transform: notifConfig.alertLevels[sev.key] ? 'translateX(16px)' : 'translateX(0)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              </Slab>

              {/* Notification events */}
              <Slab title="Notification Events">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Choose which AI agent events send an alert for this project.</p>
                <div className="space-y-2 mt-2">
                  {([
                    { key: 'new_investigation'     as const, label: 'New Investigation Started',  desc: 'When an AI agent begins investigating an incident' },
                    { key: 'root_cause_identified' as const, label: 'Root Cause Identified',      desc: 'When the AI pinpoints the root cause' },
                    { key: 'remediation_suggested' as const, label: 'Remediation Suggested',      desc: 'When an automated fix or recommendation is ready' },
                    { key: 'investigation_resolved' as const, label: 'Investigation Resolved',    desc: 'When the incident is closed or marked resolved' },
                    { key: 'agent_health_alerts'   as const, label: 'Agent Health Alerts',        desc: 'When an assigned AI agent becomes unavailable' },
                  ]).map(ev => {
                    const on = notifConfig.events[ev.key]
                    return (
                      <div key={ev.key} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: on ? 'rgba(99,102,241,0.06)' : 'var(--bg-surface)', border: `1px solid ${on ? 'rgba(99,102,241,0.2)' : 'var(--border)'}` }}>
                        <div>
                          <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{ev.label}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{ev.desc}</p>
                        </div>
                        <button
                          onClick={() => setNotifConfig(c => ({ ...c, events: { ...c.events, [ev.key]: !c.events[ev.key] } }))}
                          className="w-9 h-5 rounded-full flex items-center px-0.5 flex-shrink-0 transition-colors ml-4"
                          style={{ background: on ? 'var(--accent)' : 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                        >
                          <div className="w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ transform: on ? 'translateX(16px)' : 'translateX(0)' }} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </Slab>
            </>
          )}

          {/* Save */}
          <div className="flex justify-end">
            <button onClick={saveNotifications} className="btn-primary flex items-center gap-2 text-sm">
              {notifSaved ? <><Check className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> Save Notifications</>}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Components (advanced only) */}
      {tab === 'components' && mode === 'advanced' && (
        <div className="space-y-4">
          <Slab title="Sub-components" action={<button className="btn-secondary text-xs py-1" onClick={addComponent}><Plus className="h-3 w-3" /> Add</button>}>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Microservices or modules within {project.name}. Each inherits the project's data source config.</p>
            {project.components.length === 0 && (
              <div className="text-center py-6" style={{ border: '1px dashed var(--border)', borderRadius: 8 }}>
                <Layers className="h-6 w-6 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No components yet</p>
              </div>
            )}
            {project.components.map(comp => (
              <div key={comp.id} className="p-3 rounded-lg space-y-2" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  <input className="input text-xs flex-1" value={comp.name} onChange={e => updateComponent(comp.id, 'name', e.target.value)} placeholder="Component name" />
                  <input className="input text-xs w-24" value={comp.tech} onChange={e => updateComponent(comp.id, 'tech', e.target.value)} placeholder="Tech (Go...)" />
                  <button onClick={() => deleteComponent(comp.id)}><Trash2 className="h-3.5 w-3.5" style={{ color: '#f87171' }} /></button>
                </div>
                <input className="input text-xs w-full" value={comp.description} onChange={e => updateComponent(comp.id, 'description', e.target.value)} placeholder="Description" />
              </div>
            ))}
          </Slab>
        </div>
      )}
    </div>
  )
}

// ─── Other Detail Panels ──────────────────────────────────────────────────────
// ─── Knowledge Components ─────────────────────────────────────────────────────
// ─── Knowledge source definitions ────────────────────────────────────────────
interface SourceDef {
  id: SourceKind; label: string; logo: string; color: string
  description: string; connected: boolean; placeholder?: string
  inputLabel?: string; supportsAutoSync: boolean; hint?: string
}
const KNOWLEDGE_SOURCES: SourceDef[] = [
  { id: 'file',        logo: '📎', label: 'File Upload',     color: '#60a5fa', description: 'PDF, Word, Markdown, TXT — drag & drop or browse',                                   connected: true,  supportsAutoSync: false, hint: 'Supported: .pdf .docx .md .txt .rst (max 50 MB)' },
  { id: 'confluence',  logo: '🔷', label: 'Confluence',      color: '#0052cc', description: 'Paste a Confluence page URL to index it',                                             connected: true,  supportsAutoSync: true,  placeholder: 'https://acme.atlassian.net/wiki/spaces/ENG/pages/123456', inputLabel: 'Confluence Page URL',   hint: 'The page and child pages will be indexed. Auto-syncs every 24h.' },
  { id: 'notion',      logo: '⬛', label: 'Notion',          color: '#e5e5e5', description: 'Index a Notion page, database, or workspace section',                                 connected: false, supportsAutoSync: true,  placeholder: 'https://notion.so/your-page-id',                          inputLabel: 'Notion Page URL',       hint: 'Connect your Notion workspace in Integrations first.' },
  { id: 'github',      logo: '🐙', label: 'GitHub / GitLab', color: '#34d399', description: 'README, wiki, or any Markdown file from a repository',                               connected: true,  supportsAutoSync: true,  placeholder: 'https://github.com/acme/service/blob/main/docs/runbook.md', inputLabel: 'File or Wiki URL',    hint: 'Auto-syncs when the file changes on the default branch.' },
  { id: 'google-docs', logo: '📄', label: 'Google Docs',     color: '#4285f4', description: 'Share a Google Doc link to index its content',                                       connected: false, supportsAutoSync: true,  placeholder: 'https://docs.google.com/document/d/...',                  inputLabel: 'Google Doc URL',        hint: 'The doc must be shared with your Operon service account.' },
  { id: 'url',         logo: '🌐', label: 'Web URL',          color: '#fbbf24', description: 'Any public web page — internal wikis, status pages, docs sites',                    connected: true,  supportsAutoSync: false, placeholder: 'https://docs.acme.io/service/runbook',                    inputLabel: 'Page URL',              hint: 'Re-index manually when the page changes.' },
  { id: 'paste',       logo: '📝', label: 'Paste Text',       color: '#a78bfa', description: 'Paste raw text or Markdown directly',                                               connected: true,  supportsAutoSync: false, inputLabel: 'Content',                                                  hint: 'Supports Markdown formatting.' },
  { id: 'pagerduty',   logo: '🚨', label: 'PagerDuty',        color: '#f87171', description: 'Import a runbook attached to a PagerDuty service',                                  connected: true,  supportsAutoSync: true,  placeholder: 'P3KD8VX',                                                 inputLabel: 'PagerDuty Service ID',  hint: 'Auto-syncs when the runbook is updated in PagerDuty.' },
  { id: 'servicenow',  logo: '🟢', label: 'ServiceNow',       color: '#81e6d9', description: 'Import a Knowledge Base article from ServiceNow',                                   connected: false, supportsAutoSync: true,  placeholder: 'KB0001234',                                               inputLabel: 'Article Number',        hint: 'Connect ServiceNow in Integrations first.' },
  { id: 'sharepoint',  logo: '🔶', label: 'SharePoint',       color: '#0078d4', description: 'Index a SharePoint page or document library',                                       connected: false, supportsAutoSync: true,  placeholder: 'https://acme.sharepoint.com/sites/Engineering/...',       inputLabel: 'SharePoint URL',        hint: 'Connect Microsoft 365 in Integrations first.' },
]

// ─── Add Knowledge Source Modal ───────────────────────────────────────────────
function AddKnowledgeModal({ onAdd, onClose }: { onAdd: (doc: KnowledgeDoc) => void; onClose: () => void }) {
  const [step, setStep] = useState<'source' | 'config' | 'indexing'>('source')
  const [selected, setSelected] = useState<SourceDef | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [docType, setDocType] = useState<KnowledgeDocType>('runbook')
  const [title, setTitle] = useState('')
  const [indexing, setIndexing] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const simulateIndex = async () => {
    setStep('indexing')
    setIndexing(true)
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 180))
      setProgress(i)
    }
    setIndexing(false)
    const sourceRef = selected?.id === 'file' ? fileName : selected?.id === 'paste' ? undefined : inputValue || undefined
    onAdd({
      id: uid(),
      title: title || (fileName ? fileName.replace(/\.[^.]+$/, '') : (inputValue.split('/').pop() ?? 'New Document')),
      type: docType,
      summary: pasteText ? pasteText.slice(0, 200) + (pasteText.length > 200 ? '…' : '') : `Imported from ${selected?.label}. Click to expand.`,
      author: 'You',
      updatedAt: new Date().toISOString().slice(0, 10),
      source: selected!.id,
      sourceRef,
      link: selected?.id !== 'file' && selected?.id !== 'paste' && inputValue ? inputValue : undefined,
    })
    onClose()
  }

  const handleFile = (file: File) => { setFileName(file.name); setTitle(file.name.replace(/\.[^.]+$/, '')) }

  const canSubmit = selected?.id === 'file' ? !!fileName : selected?.id === 'paste' ? !!pasteText.trim() : !!inputValue.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Add Knowledge Source</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {step === 'source' ? 'Choose where your document lives' : step === 'config' ? `Configure ${selected?.label} source` : 'Indexing document…'}
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X className="h-4 w-4" /></button>
        </div>

        {/* Step: Pick source */}
        {step === 'source' && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {KNOWLEDGE_SOURCES.map(src => (
                <button key={src.id}
                  onClick={() => { setSelected(src); setStep('config') }}
                  className="flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = src.color)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                  <span className="text-2xl flex-shrink-0">{src.logo}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{src.label}</p>
                      {!src.connected && <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Connect</span>}
                      {src.supportsAutoSync && src.connected && <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>Auto-sync</span>}
                    </div>
                    <p className="text-[10px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>{src.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Configure */}
        {step === 'config' && selected && (
          <div className="p-6 space-y-4">
            {/* Source pill */}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <span className="text-2xl">{selected.logo}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selected.label}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selected.description}</p>
              </div>
              <button className="text-xs" style={{ color: 'var(--text-muted)' }} onClick={() => setStep('source')}>Change</button>
            </div>

            {/* Not connected warning */}
            {!selected.connected && (
              <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
                <p className="text-xs" style={{ color: '#fbbf24' }}>
                  {selected.label} is not connected. Go to <strong>Integrations</strong> to connect it first, or paste text manually.
                </p>
              </div>
            )}

            {/* File upload */}
            {selected.id === 'file' && (
              <>
                <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.md,.txt,.rst" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                <div className="flex flex-col items-center justify-center py-10 rounded-xl cursor-pointer"
                  style={{ border: `2px dashed ${dragOver ? '#60a5fa' : 'var(--border)'}`, background: dragOver ? 'rgba(96,165,250,0.05)' : 'var(--bg-elevated)' }}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]) }}>
                  {fileName
                    ? <><File className="h-8 w-8 mb-2" style={{ color: '#60a5fa' }} /><p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{fileName}</p><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Click to change</p></>
                    : <><Upload className="h-8 w-8 mb-2" style={{ color: 'var(--text-muted)' }} /><p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Drop your file here or click to browse</p><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{selected.hint}</p></>}
                </div>
              </>
            )}

            {/* Paste text */}
            {selected.id === 'paste' && (
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Content (Markdown supported)</label>
                <textarea className="input text-sm resize-none font-mono" rows={8} value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Paste your runbook, architecture notes, postmortem, or any text here…" />
              </div>
            )}

            {/* URL / reference input */}
            {selected.id !== 'file' && selected.id !== 'paste' && (
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>{selected.inputLabel}</label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                  <input className="input text-sm pl-9 font-mono" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder={selected.placeholder} />
                </div>
                {selected.hint && <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{selected.hint}</p>}
                {selected.supportsAutoSync && selected.connected && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-7 h-3.5 rounded-full flex items-center px-0.5 cursor-pointer" style={{ background: 'var(--accent)' }}>
                      <div className="w-2.5 h-2.5 rounded-full bg-white ml-auto" />
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Auto-sync enabled</span>
                  </div>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Title (optional — auto-detected if blank)</label>
              <input className="input text-sm" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Checkout Deployment Runbook" />
            </div>

            {/* Doc type */}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Document Type</label>
              <select className="input text-sm" value={docType} onChange={e => setDocType(e.target.value as KnowledgeDocType)}>
                {Object.entries(DOC_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>

            {/* AI note */}
            <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <Bot className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                This document will be vectorized and added to the AI knowledge graph. Agents retrieve relevant chunks automatically during investigations.
              </p>
            </div>

            <div className="flex justify-between pt-1">
              <button className="btn-secondary text-sm" onClick={() => setStep('source')}>Back</button>
              <button className="btn-primary text-sm" onClick={simulateIndex} disabled={!canSubmit}>Index Document</button>
            </div>
          </div>
        )}

        {/* Step: Indexing progress */}
        {step === 'indexing' && (
          <div className="p-10 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}>
              {indexing ? <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--accent)' }} /> : <Check className="h-7 w-7" style={{ color: '#34d399' }} />}
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{indexing ? 'Indexing document…' : 'Indexed successfully'}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{indexing ? 'Parsing, chunking, and vectorizing for AI retrieval' : 'Document is now available to AI agents'}</p>
            </div>
            <div className="w-full max-w-xs rounded-full overflow-hidden h-2" style={{ background: 'var(--bg-elevated)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
            </div>
            {indexing && (
              <div className="space-y-1.5 text-left w-full max-w-xs">
                {[
                  { label: 'Fetching content',        done: progress >= 20 },
                  { label: 'Parsing structure',       done: progress >= 40 },
                  { label: 'Chunking text',           done: progress >= 60 },
                  { label: 'Generating embeddings',   done: progress >= 80 },
                  { label: 'Storing in vector DB',    done: progress >= 100 },
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-2">
                    {done
                      ? <Check className="h-3 w-3 flex-shrink-0" style={{ color: '#34d399' }} />
                      : <div className="w-3 h-3 rounded-full border flex-shrink-0" style={{ borderColor: 'var(--border)' }} />}
                    <span className="text-xs" style={{ color: done ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const DOC_TYPE_META: Record<KnowledgeDocType, { label: string; color: string; bg: string; icon: string }> = {
  runbook:      { label: 'Runbook',      color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',   icon: '📋' },
  architecture: { label: 'Architecture', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: '🏗️' },
  postmortem:   { label: 'Postmortem',   color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: '📝' },
  sop:          { label: 'SOP',          color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: '📃' },
  'known-issue':{ label: 'Known Issue',  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  icon: '⚠️' },
  playbook:     { label: 'Playbook',     color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  icon: '📖' },
}

function DocTypeTag({ type }: { type: KnowledgeDocType }) {
  const m = DOC_TYPE_META[type]
  return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
      style={{ background: m.bg, color: m.color, border: `1px solid ${m.color}33` }}>
      {m.icon} {m.label}
    </span>
  )
}

function KnowledgeSection({ docs, scopeLabel, onAdd }: { docs: KnowledgeDoc[]; scopeLabel: string; onAdd?: () => void }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [localDocs, setLocalDocs] = useState<KnowledgeDoc[]>(docs)

  const handleAdd = (doc: KnowledgeDoc) => {
    setLocalDocs(d => [doc, ...d])
    onAdd?.()
  }

  // Helper: logo for source badge
  const srcMeta = (s?: SourceKind) => KNOWLEDGE_SOURCES.find(x => x.id === s)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" style={{ color: 'var(--accent)' }} />
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Knowledge · {localDocs.length} doc{localDocs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn-secondary text-xs py-1" onClick={() => setModalOpen(true)}>
          <Plus className="h-3 w-3" /> Add Source
        </button>
      </div>

      {/* AI banner */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}>
        <Bot className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          AI agents read these docs first when investigating incidents scoped to <strong style={{ color: 'var(--text-primary)' }}>{scopeLabel}</strong>.
        </p>
      </div>

      {localDocs.length === 0 && (
        <div className="text-center py-8 rounded-xl" style={{ border: '1px dashed var(--border)' }}>
          <BookOpen className="h-6 w-6 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No sources yet. Add a runbook, Confluence page, GitHub file, or paste text.</p>
        </div>
      )}

      <div className="space-y-2">
        {localDocs.map(doc => {
          const sm = srcMeta(doc.source)
          return (
            <div key={doc.id} className="p-3.5 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{doc.title}</p>
                    <DocTypeTag type={doc.type} />
                    {sm && (
                      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        {sm.logo} {sm.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{doc.summary}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Clock className="h-2.5 w-2.5" /> {doc.updatedAt}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>by {doc.author}</span>
                    {doc.sourceRef && (
                      <span className="text-[10px] font-mono truncate max-w-[160px]" style={{ color: 'var(--text-muted)' }}>{doc.sourceRef.length > 40 ? doc.sourceRef.slice(0, 37) + '…' : doc.sourceRef}</span>
                    )}
                  </div>
                </div>
                {doc.link && (
                  <a href={doc.link} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {modalOpen && <AddKnowledgeModal onAdd={handleAdd} onClose={() => setModalOpen(false)} />}
    </div>
  )
}

function OrgPanel({ org, onUpdate }: { org: Org; onUpdate: (o: Org) => void }) {
  const [form, setForm] = useState({ name: org.name, industry: org.industry, timezone: org.timezone })
  const [saved, setSaved] = useState(false)
  const save = () => { onUpdate({ ...org, ...form }); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}>
          <Building2 className="h-6 w-6" style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{org.name}</h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)' }}>{org.plan} Plan</span>
        </div>
      </div>
      <Slab title="Organization Settings">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Org Name</label><input className="input text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Industry</label>
            <select className="input text-sm" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}>
              {['SaaS / Software', 'Financial Services', 'E-commerce', 'Healthcare', 'Media & Entertainment', 'Logistics'].map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div><label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Timezone</label>
            <select className="input text-sm" value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}>
              {['UTC', 'America/New_York', 'America/Los_Angeles', 'Asia/Kolkata', 'Europe/London', 'Asia/Tokyo'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Plan</label>
            <div className="input text-sm" style={{ cursor: 'default' }}><span style={{ color: '#6ee7b7' }}>{org.plan}</span></div>
          </div>
        </div>
        <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <button className="btn-primary text-xs" onClick={save}>{saved ? <><Check className="h-3.5 w-3.5" /> Saved</> : 'Save Changes'}</button>
        </div>
      </Slab>
      <Slab title="SSO & Security">
        <div className="flex items-center justify-between py-1">
          <div><p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>SAML 2.0 / OIDC Single Sign-On</p><p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Force all members to authenticate via SSO</p></div>
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Not configured</span>
        </div>
        <button className="btn-secondary text-xs"><Shield className="h-3.5 w-3.5" /> Configure SSO</button>
      </Slab>
      <div className="rounded-xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <KnowledgeSection docs={org.knowledge} scopeLabel={`${org.name} (org-wide)`} />
      </div>
    </div>
  )
}

function MembersPanel() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Members & Roles</h2><p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{MOCK_MEMBERS.length} members</p></div>
        <button className="btn-primary text-xs"><Plus className="h-3.5 w-3.5" /> Invite Member</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['Member', 'Role', 'Status', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>)}</tr></thead>
          <tbody>
            {MOCK_MEMBERS.map(m => (
              <tr key={m.email} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'var(--accent)' }}>{m.avatar}</div>
                    <div><p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.name}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.email}</p></div>
                  </div>
                </td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>{m.role}</span></td>
                <td className="px-4 py-3"><ConnBadge on={m.active} /></td>
                <td className="px-4 py-3 text-right"><button style={{ color: 'var(--text-muted)' }}><Settings className="h-3.5 w-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DomainPanel({ domain, onUpdate }: { domain: Domain; onUpdate: (d: Domain) => void }) {
  const [form, setForm] = useState({ name: domain.name, description: domain.description, owner: domain.owner, notificationChannel: domain.notificationChannel })
  const [saved, setSaved] = useState(false)
  useEffect(() => { setForm({ name: domain.name, description: domain.description, owner: domain.owner, notificationChannel: domain.notificationChannel }) }, [domain.id])
  const save = () => { onUpdate({ ...domain, ...form }); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}><FolderOpen className="h-5 w-5" style={{ color: 'var(--accent)' }} /></div>
        <div><h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{domain.name}</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{domain.description}</p></div>
      </div>
      <Slab title="Domain Configuration">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Domain Name</label><input className="input text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Owner Team</label><input className="input text-sm" value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} /></div>
          <div className="col-span-2"><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Description</label><input className="input text-sm" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="col-span-2"><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Alert Channel</label><input className="input text-sm font-mono" value={form.notificationChannel} onChange={e => setForm(f => ({ ...f, notificationChannel: e.target.value }))} /></div>
        </div>
        <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <button className="btn-primary text-xs" onClick={save}>{saved ? <><Check className="h-3.5 w-3.5" /> Saved</> : 'Save Changes'}</button>
        </div>
      </Slab>
      <Slab title={`Projects (${domain.projects.length})`}>
        <div className="space-y-2">
          {domain.projects.map(p => {
            const ev = ENV_STYLE[p.environment] ?? ENV_STYLE.development
            const dsCnt = p.dataSources.filter(d => d.enabled).length
            return (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  <div><p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{dsCnt} data source{dsCnt !== 1 ? 's' : ''} configured</p></div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: ev.bg, color: ev.color, border: `1px solid ${ev.border}` }}>{p.environment}</span>
              </div>
            )
          })}
        </div>
      </Slab>
      <div className="rounded-xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <KnowledgeSection docs={domain.knowledge} scopeLabel={`${domain.name} domain`} />
      </div>
    </div>
  )
}

function IntCategoryPanel({ cat }: { cat: IntCategory }) {
  const connected = cat.items.filter(i => i.connected).length
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${cat.color}20` }}><cat.icon className="h-5 w-5" style={{ color: cat.color }} /></div>
        <div><h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{cat.label} Integrations</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{connected} of {cat.items.length} connected</p></div>
      </div>
      <div className="space-y-3">
        {cat.items.map(item => (
          <div key={item.id} className="p-4 rounded-xl flex items-center gap-4" style={{ background: 'var(--bg-elevated)', border: `1px solid ${item.connected ? cat.color + '33' : 'var(--border)'}` }}>
            <span className="text-2xl flex-shrink-0">{item.logo}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                {item.badge && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${cat.color}20`, color: cat.color }}>{item.badge}</span>}
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <ConnBadge on={item.connected} />
              <button className="btn-secondary text-xs py-1 px-3">{item.connected ? <><Settings className="h-3 w-3" /> Configure</> : <><Plus className="h-3 w-3" /> Connect</>}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function IntegrationItemPanel({ integration, cat }: { integration: IntegrationItem; cat: IntCategory }) {
  const [showKeys, setShowKeys] = useState(false)
  const [testing, setTesting] = useState(false)
  const [tested, setTested] = useState(false)
  const testConn = async () => { setTesting(true); await new Promise(r => setTimeout(r, 1500)); setTesting(false); setTested(true); setTimeout(() => setTested(false), 3000) }
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <span className="text-4xl">{integration.logo}</span>
        <div className="flex-1"><h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{integration.name}</h2><p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{integration.description}</p></div>
        <ConnBadge on={integration.connected} />
      </div>
      {integration.connected && integration.config && (
        <Slab title="Connection Details">
          <div className="flex justify-end mb-2">
            <button className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }} onClick={() => setShowKeys(s => !s)}>
              {showKeys ? <><EyeOff className="h-3.5 w-3.5" /> Hide</> : <><Eye className="h-3.5 w-3.5" /> Show credentials</>}
            </button>
          </div>
          <div className="space-y-3">
            {Object.entries(integration.config).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{k}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                    {showKeys ? v : v.includes('••') ? v : '••••••••••••••••'}
                  </span>
                  <button onClick={() => navigator.clipboard?.writeText(v)}><Copy className="h-3 w-3" style={{ color: 'var(--text-muted)' }} /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button onClick={testConn} disabled={testing} className="btn-secondary text-xs flex items-center gap-1.5">
              {testing ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : tested ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#34d399' }} /> : <RefreshCw className="h-3.5 w-3.5" />}
              {testing ? 'Testing...' : tested ? 'Connection OK' : 'Test Connection'}
            </button>
            <button className="btn-secondary text-xs"><Settings className="h-3.5 w-3.5" /> Reconfigure</button>
          </div>
        </Slab>
      )}
      {!integration.connected && (
        <Slab title={`Connect ${integration.name}`}>
          <div className="space-y-3">
            <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>API Key / Token</label><input className="input text-sm font-mono" placeholder="Paste your API key..." /></div>
          </div>
          <button className="btn-primary text-xs w-full justify-center mt-3"><Plug className="h-3.5 w-3.5" /> Connect {integration.name}</button>
        </Slab>
      )}
      {Object.keys(integration.dsFields ?? {}).length > 0 && (
        <Slab title="Per-project Config Fields">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>When you assign this integration to a project's Data Sources, the AI agent will use these fields to know where to query for that project.</p>
          <div className="space-y-1.5 mt-2">
            {Object.entries(integration.dsFields ?? {}).map(([f, ph]) => (
              <div key={f} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: `${cat.color}15`, color: cat.color }}>{f}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{ph}</span>
              </div>
            ))}
          </div>
        </Slab>
      )}
    </div>
  )
}

function NotifPanel({ channel }: { channel: typeof NOTIF_CHANNELS[0] }) {
  const isSlack = channel.id === 'slack'; const isEmail = channel.id === 'email'; const isPD = channel.id === 'pagerduty-notif'
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${channel.color}20` }}><channel.icon className="h-5 w-5" style={{ color: channel.color }} /></div>
        <div className="flex-1"><h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{channel.label}</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{channel.desc}</p></div>
        <ConnBadge on={channel.connected} />
      </div>
      {isSlack && channel.connected && (
        <Slab title="Channel Routing">
          <div className="space-y-2">
            {[{ event: 'P1 incidents', ch: '#p1-critical', color: '#f87171' }, { event: 'P2 incidents', ch: '#incidents', color: '#fb923c' }, { event: 'P3/P4 incidents', ch: '#alerts', color: '#fbbf24' }, { event: 'AI Agent completions', ch: '#ai-ops', color: 'var(--text-muted)' }].map(({ event, ch, color }) => (
              <div key={event} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <span className="text-xs font-medium" style={{ color }}>{event}</span>
                <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{ch}</span>
              </div>
            ))}
          </div>
          <button className="btn-secondary text-xs mt-2"><Plus className="h-3.5 w-3.5" /> Add Routing Rule</button>
        </Slab>
      )}
      {isEmail && channel.connected && (
        <Slab title="Email Configuration">
          <div className="space-y-3">
            <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>SMTP Host</label><input className="input text-sm font-mono" defaultValue="smtp.sendgrid.net" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Port</label><input className="input text-sm" defaultValue="587" /></div>
              <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>From Address</label><input className="input text-sm" defaultValue="alerts@acme.io" /></div>
            </div>
          </div>
        </Slab>
      )}
      {isPD && channel.connected && (
        <Slab title="Escalation Policy Mapping">
          <div className="space-y-2">
            {[{ s: 'P1 Critical', p: 'Critical Infrastructure', c: '#f87171' }, { s: 'P2 High', p: 'Backend Engineers', c: '#fb923c' }, { s: 'P3 Medium', p: 'Low Priority Queue', c: '#fbbf24' }].map(({ s, p, c }) => (
              <div key={s} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <span className="text-xs font-semibold" style={{ color: c }}>{s}</span>
                <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}><ArrowRight className="h-3 w-3" /><span className="text-xs">{p}</span></div>
              </div>
            ))}
          </div>
        </Slab>
      )}
      {!channel.connected && (
        <Slab title={`Connect ${channel.label}`}>
          <div className="space-y-3">
            <div><label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Webhook URL</label><input className="input text-sm font-mono" placeholder="https://hooks...." /></div>
          </div>
          <button className="btn-primary text-xs w-full justify-center mt-3"><Plug className="h-3.5 w-3.5" /> Connect {channel.label}</button>
        </Slab>
      )}
    </div>
  )
}

function ApiKeysPanel() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>API Keys</h2><p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Programmatic access to Operon APIs</p></div>
        <button className="btn-primary text-xs"><Key className="h-3.5 w-3.5" /> Generate Key</button>
      </div>
      <div className="text-center py-12 rounded-xl" style={{ border: '1px dashed var(--border)' }}>
        <Key className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No API keys yet</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Create keys to integrate with CI/CD pipelines or external tools</p>
      </div>
    </div>
  )
}

// ─── Tree Node ────────────────────────────────────────────────────────────────
function TNode({ icon: I, label, color, depth, active, isExpanded, hasChildren, onSelect, onToggle, meta, actions }: {
  icon: React.ElementType; label: string; color: string; depth: number
  active: boolean; isExpanded?: boolean; hasChildren?: boolean
  onSelect: () => void; onToggle?: () => void
  meta?: React.ReactNode; actions?: React.ReactNode
}) {
  const [hover, setHover] = useState(false)
  return (
    <div className="group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer select-none"
      style={{ marginLeft: depth * 12, background: active ? 'var(--accent-light)' : hover ? 'var(--hover-overlay)' : 'transparent', border: `1px solid ${active ? 'var(--accent)' : 'transparent'}` }}
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {hasChildren
        ? <span onClick={e => { e.stopPropagation(); onToggle?.() }} className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
            {isExpanded ? <ChevronDown className="h-3 w-3" style={{ color: 'var(--text-muted)' }} /> : <ChevronRight className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />}
          </span>
        : <span className="w-4 h-4 flex-shrink-0" />
      }
      <I className="h-3.5 w-3.5 flex-shrink-0" style={{ color }} />
      <span className="text-xs font-medium flex-1 truncate" style={{ color: active ? 'var(--accent)' : 'var(--text-primary)' }}>{label}</span>
      {meta}
      {(hover || active) && actions && <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>{actions}</div>}
    </div>
  )
}

const SectionHeader = ({ label }: { label: string }) => (
  <p className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</p>
)

const IconBtn = ({ icon: I, color, onClick, title }: { icon: React.ElementType; color?: string; onClick: () => void; title: string }) => (
  <button title={title} onClick={onClick} className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
    <I className="h-3 w-3" style={{ color: color ?? 'var(--text-muted)' }} />
  </button>
)

// ─── Org Switcher ─────────────────────────────────────────────────────────────
function OrgSwitcher({ orgs, activeId, onSwitch }: { orgs: Org[]; activeId: string; onSwitch: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = orgs.find(o => o.id === activeId)!
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 w-full px-2 py-2 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent)' }}>
          <Building2 className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-xs font-semibold flex-1 truncate text-left" style={{ color: 'var(--text-primary)' }}>{active.name}</span>
        <DropdownIcon className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl z-50 overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {orgs.map(o => (
            <button key={o.id} onClick={() => { onSwitch(o.id); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
              style={{ background: o.id === activeId ? 'var(--accent-light)' : 'transparent', borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => { if (o.id !== activeId) (e.currentTarget as HTMLElement).style.background = 'var(--hover-overlay)' }}
              onMouseLeave={e => { if (o.id !== activeId) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: o.id === activeId ? 'var(--accent)' : 'var(--bg-elevated)' }}>
                <Building2 className="h-3 w-3" style={{ color: o.id === activeId ? '#fff' : 'var(--text-muted)' }} />
              </div>
              <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{o.name}</p><p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{o.plan} · {o.industry}</p></div>
              {o.id === activeId && <Check className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--accent)' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export const FoundationsPage = () => {
  useAuth()

  // ── State ──
  const [orgs, setOrgs] = useState<Org[]>(MOCK_ORGS)
  const [activeOrgId, setActiveOrgId] = useState('acme')
  const [allDomains, setAllDomains] = useState<Record<string, Domain[]>>(INITIAL_DOMAINS)
  const [mode, setMode] = useState<HierarchyMode>('standard')
  const [sel, setSel] = useState<NodeKind>({ cat: 'org', orgId: 'acme' })
  const [expDomains, setExpDomains] = useState(new Set(['ecom', 'infra', 'data']))
  const [expIntCats, setExpIntCats] = useState(new Set<string>())

  // Modals
  const [addOrgOpen, setAddOrgOpen] = useState(false)
  const [editOrg, setEditOrg] = useState<Org | null>(null)
  const [addDomainOpen, setAddDomainOpen] = useState(false)
  const [editDomain, setEditDomain] = useState<Domain | null>(null)
  const [delDomain, setDelDomain] = useState<Domain | null>(null)
  const [addProjectDomainId, setAddProjectDomainId] = useState<string | null>(null)
  const [editProject, setEditProject] = useState<{ p: Project; domainId: string } | null>(null)
  const [delProject, setDelProject] = useState<{ p: Project; domainId: string } | null>(null)

  const domains = allDomains[activeOrgId] ?? []

  // ── Helpers ──
  const setDomains = (fn: (prev: Domain[]) => Domain[]) =>
    setAllDomains(prev => ({ ...prev, [activeOrgId]: fn(prev[activeOrgId] ?? []) }))

  const updateProject = (domainId: string, p: Project) =>
    setDomains(ds => ds.map(d => d.id === domainId ? { ...d, projects: d.projects.map(pr => pr.id === p.id ? p : pr) } : d))

  const isA = (n: NodeKind) => JSON.stringify(sel) === JSON.stringify(n)
  const toggleD = (id: string) => setExpDomains(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleI = (id: string) => setExpIntCats(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  // ── Detail rendering ──
  const renderDetail = () => {
    if (sel.cat === 'org') {
      const org = orgs.find(o => o.id === sel.orgId) ?? orgs[0]
      return <OrgPanel org={org} onUpdate={updated => setOrgs(os => os.map(o => o.id === updated.id ? updated : o))} />
    }
    if (sel.cat === 'members') return <MembersPanel />
    if (sel.cat === 'domain') {
      const d = domains.find(x => x.id === sel.id)
      return d ? <DomainPanel domain={d} onUpdate={updated => setDomains(ds => ds.map(x => x.id === updated.id ? updated : x))} /> : null
    }
    if (sel.cat === 'project') {
      const d = domains.find(x => x.id === sel.domainId)
      const p = d?.projects.find(x => x.id === sel.id)
      return (d && p) ? <ProjectPanel project={p} domainId={d.id} orgId={activeOrgId} mode={mode} onUpdate={updated => updateProject(d.id, updated)} /> : null
    }
    if (sel.cat === 'int-category') { const c = INT_CATEGORIES.find(x => x.id === sel.id); return c ? <IntCategoryPanel cat={c} /> : null }
    if (sel.cat === 'integration') { const c = INT_CATEGORIES.find(x => x.id === sel.categoryId); const i = c?.items.find(x => x.id === sel.id); return (c && i) ? <IntegrationItemPanel integration={i} cat={c} /> : null }
    if (sel.cat === 'notif') { const n = NOTIF_CHANNELS.find(x => x.id === sel.id); return n ? <NotifPanel channel={n} /> : null }
    if (sel.cat === 'apikeys') return <ApiKeysPanel />
    return null
  }

  const MODES = [
    { id: 'simple' as HierarchyMode, label: 'Simple', desc: 'Org → Project' },
    { id: 'standard' as HierarchyMode, label: 'Standard', desc: 'Org → Domain → Project' },
    { id: 'advanced' as HierarchyMode, label: 'Advanced', desc: 'Org → Domain → Project → Component' },
  ]

  const connectedIntCount = INT_CATEGORIES.reduce((s, c) => s + c.items.filter(i => i.connected).length, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Foundations</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Organization structure, data source wiring, integrations, and notification routing
        </p>
      </div>

      {/* Hierarchy mode selector */}
      <div className="card p-4 mb-5">
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>HIERARCHY STRUCTURE</p>
        <div className="flex gap-6 flex-wrap">
          {MODES.map(m => (
            <label key={m.id} className="flex items-center gap-3 cursor-pointer" onClick={() => setMode(m.id)}>
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: mode === m.id ? 'var(--accent)' : 'var(--border)' }}>
                {mode === m.id && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />}
              </div>
              <span className="text-sm font-medium" style={{ color: mode === m.id ? 'var(--accent)' : 'var(--text-primary)' }}>{m.label}</span>
              <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>{m.desc}</span>
              {m.id === 'standard' && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}>default</span>}
            </label>
          ))}
        </div>
      </div>

      {/* Main two-panel layout */}
      <div className="flex gap-5" style={{ minHeight: '640px' }}>

        {/* LEFT TREE */}
        <div className="w-64 flex-shrink-0 card p-2 overflow-y-auto flex flex-col gap-1" style={{ maxHeight: '78vh' }}>

          {/* Org Switcher */}
          <div className="px-1 pb-1 pt-1">
            <OrgSwitcher orgs={orgs} activeId={activeOrgId} onSwitch={id => { setActiveOrgId(id); setSel({ cat: 'org', orgId: id }) }} />
            <button onClick={() => setAddOrgOpen(true)} className="w-full flex items-center justify-center gap-1.5 mt-1.5 py-1.5 rounded-lg text-xs" style={{ border: '1px dashed var(--border)', color: 'var(--text-muted)' }}>
              <Plus className="h-3 w-3" /> Add Organization
            </button>
          </div>

          {/* ORGANIZATION */}
          <SectionHeader label="Organization" />
          <TNode icon={Building2} label={orgs.find(o => o.id === activeOrgId)?.name ?? 'Org'} color="var(--accent)" depth={0}
            active={isA({ cat: 'org', orgId: activeOrgId })} onSelect={() => setSel({ cat: 'org', orgId: activeOrgId })}
            actions={<IconBtn icon={Pencil} onClick={() => setEditOrg(orgs.find(o => o.id === activeOrgId)!)} title="Edit org" />}
          />
          <TNode icon={Users} label="Members & Roles" color="#34d399" depth={0}
            active={isA({ cat: 'members', orgId: activeOrgId })} onSelect={() => setSel({ cat: 'members', orgId: activeOrgId })} />

          {/* HIERARCHY */}
          <SectionHeader label="Hierarchy" />
          {mode === 'simple'
            ? domains.flatMap(d => d.projects.map(proj => ({ proj, dom: d }))).map(({ proj, dom }) => (
                <TNode key={proj.id} icon={Package} label={proj.name} color="#60a5fa" depth={0}
                  active={isA({ cat: 'project', orgId: activeOrgId, domainId: dom.id, id: proj.id })}
                  onSelect={() => setSel({ cat: 'project', orgId: activeOrgId, domainId: dom.id, id: proj.id })}
                  meta={proj.dataSources.filter(d => d.enabled).length > 0 ? <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}>{proj.dataSources.filter(d => d.enabled).length}s</span> : undefined}
                  actions={<><IconBtn icon={Pencil} onClick={() => setEditProject({ p: proj, domainId: dom.id })} title="Edit" /><IconBtn icon={Trash2} color="#f87171" onClick={() => setDelProject({ p: proj, domainId: dom.id })} title="Delete" /></>}
                />
              ))
            : domains.map((domain, di) => {
                const dcolor = DOMAIN_COLORS[di % DOMAIN_COLORS.length]
                const dExp = expDomains.has(domain.id)
                return (
                  <div key={domain.id}>
                    <TNode icon={FolderOpen} label={domain.name} color={dcolor} depth={0}
                      active={isA({ cat: 'domain', orgId: activeOrgId, id: domain.id })} isExpanded={dExp} hasChildren={true}
                      onSelect={() => setSel({ cat: 'domain', orgId: activeOrgId, id: domain.id })}
                      onToggle={() => toggleD(domain.id)}
                      actions={<>
                        <IconBtn icon={Plus} onClick={() => setAddProjectDomainId(domain.id)} title="Add project" />
                        <IconBtn icon={Pencil} onClick={() => setEditDomain(domain)} title="Edit domain" />
                        <IconBtn icon={Trash2} color="#f87171" onClick={() => setDelDomain(domain)} title="Delete domain" />
                      </>}
                    />
                    {dExp && domain.projects.map(proj => {
                      const dsCnt = proj.dataSources.filter(d => d.enabled).length
                      return (
                        <TNode key={proj.id} icon={Package} label={proj.name} color="#60a5fa" depth={1}
                          active={isA({ cat: 'project', orgId: activeOrgId, domainId: domain.id, id: proj.id })}
                          onSelect={() => setSel({ cat: 'project', orgId: activeOrgId, domainId: domain.id, id: proj.id })}
                          meta={dsCnt > 0 ? <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}>{dsCnt}s</span> : undefined}
                          actions={<><IconBtn icon={Pencil} onClick={() => setEditProject({ p: proj, domainId: domain.id })} title="Edit" /><IconBtn icon={Trash2} color="#f87171" onClick={() => setDelProject({ p: proj, domainId: domain.id })} title="Delete" /></>}
                        />
                      )
                    })}
                    {dExp && (
                      <button onClick={() => setAddProjectDomainId(domain.id)} className="flex items-center gap-1.5 text-xs py-1 px-3 rounded-lg" style={{ marginLeft: 12, color: 'var(--text-muted)', border: '1px dashed var(--border)' }}>
                        <Plus className="h-3 w-3" /> Add Project
                      </button>
                    )}
                  </div>
                )
              })
          }

          {/* Add Domain */}
          <button onClick={() => setAddDomainOpen(true)} className="flex items-center gap-1.5 text-xs py-1.5 px-2 rounded-lg mt-1" style={{ color: 'var(--text-muted)', border: '1px dashed var(--border)' }}>
            <Plus className="h-3 w-3" /> Add Domain
          </button>

          {/* INTEGRATIONS */}
          <SectionHeader label={`Integrations · ${connectedIntCount} connected`} />
          {INT_CATEGORIES.map(cat => {
            const catExp = expIntCats.has(cat.id)
            const connCount = cat.items.filter(i => i.connected).length
            return (
              <div key={cat.id}>
                <TNode icon={cat.icon} label={cat.label} color={cat.color} depth={0}
                  active={isA({ cat: 'int-category', id: cat.id })} isExpanded={catExp} hasChildren={true}
                  onSelect={() => setSel({ cat: 'int-category', id: cat.id })}
                  onToggle={() => toggleI(cat.id)}
                  meta={connCount > 0 ? <span className="text-xs" style={{ color: '#34d399' }}>{connCount}</span> : undefined}
                />
                {catExp && cat.items.map(item => (
                  <TNode key={item.id} icon={item.connected ? CheckCircle2 : XCircle} label={item.name} color={item.connected ? '#34d399' : 'var(--text-muted)'} depth={1}
                    active={isA({ cat: 'integration', categoryId: cat.id, id: item.id })}
                    onSelect={() => setSel({ cat: 'integration', categoryId: cat.id, id: item.id })}
                    meta={<Dot on={item.connected} />}
                  />
                ))}
              </div>
            )
          })}

          {/* NOTIFICATIONS */}
          <SectionHeader label="Notifications" />
          {NOTIF_CHANNELS.map(ch => (
            <TNode key={ch.id} icon={ch.icon} label={ch.label} color={ch.color} depth={0}
              active={isA({ cat: 'notif', id: ch.id })}
              onSelect={() => setSel({ cat: 'notif', id: ch.id })}
              meta={<Dot on={ch.connected} />}
            />
          ))}

          {/* ACCESS */}
          <SectionHeader label="Access" />
          <TNode icon={Key} label="API Keys" color="#fbbf24" depth={0}
            active={isA({ cat: 'apikeys' })} onSelect={() => setSel({ cat: 'apikeys' })} />
        </div>

        {/* RIGHT DETAIL */}
        <div className="flex-1 overflow-y-auto pr-1" style={{ maxHeight: '78vh' }}>
          {renderDetail()}
        </div>
      </div>

      {/* ── Modals ── */}
      {addOrgOpen && (
        <OrgModal onClose={() => setAddOrgOpen(false)} onSave={org => { setOrgs(os => [...os, org]); setAllDomains(p => ({ ...p, [org.id]: [] })); setActiveOrgId(org.id); setSel({ cat: 'org', orgId: org.id }) }} />
      )}
      {editOrg && (
        <OrgModal initial={editOrg} onClose={() => setEditOrg(null)} onSave={org => setOrgs(os => os.map(o => o.id === org.id ? org : o))} />
      )}
      {addDomainOpen && (
        <DomainModal colorIdx={domains.length} onClose={() => setAddDomainOpen(false)} onSave={d => { setDomains(ds => [...ds, d]); setExpDomains(s => { const n = new Set(s); n.add(d.id); return n }) }} />
      )}
      {editDomain && (
        <DomainModal initial={editDomain} colorIdx={0} onClose={() => setEditDomain(null)} onSave={d => setDomains(ds => ds.map(x => x.id === d.id ? { ...d, projects: x.projects } : x))} />
      )}
      {delDomain && (
        <ConfirmModal title="Delete Domain" message={`Delete "${delDomain.name}" and all its ${delDomain.projects.length} project(s)? This cannot be undone.`}
          onClose={() => setDelDomain(null)} onConfirm={() => { setDomains(ds => ds.filter(d => d.id !== delDomain.id)); setDelDomain(null); setSel({ cat: 'org', orgId: activeOrgId }) }} />
      )}
      {addProjectDomainId && (
        <ProjectModal onClose={() => setAddProjectDomainId(null)} onSave={p => { setDomains(ds => ds.map(d => d.id === addProjectDomainId ? { ...d, projects: [...d.projects, p] } : d)); setSel({ cat: 'project', orgId: activeOrgId, domainId: addProjectDomainId, id: p.id }) }} />
      )}
      {editProject && (
        <ProjectModal initial={editProject.p} onClose={() => setEditProject(null)} onSave={p => { updateProject(editProject.domainId, p); setEditProject(null) }} />
      )}
      {delProject && (
        <ConfirmModal title="Delete Project" message={`Delete "${delProject.p.name}"? All data source configuration for this project will be lost.`}
          onClose={() => setDelProject(null)} onConfirm={() => { setDomains(ds => ds.map(d => d.id === delProject.domainId ? { ...d, projects: d.projects.filter(p => p.id !== delProject.p.id) } : d)); setDelProject(null); setSel({ cat: 'domain', orgId: activeOrgId, id: delProject.domainId }) }} />
      )}
    </div>
  )
}
