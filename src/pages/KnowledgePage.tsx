import { useState, useMemo, useRef } from 'react'
import {
  BookOpen, Search, Plus, Clock, Bot, Building2, FolderOpen, Package,
  ChevronDown, X, Upload, Link, Check, AlertCircle,
  File, Loader2, RefreshCw,
} from 'lucide-react'

type DocType = 'runbook' | 'architecture' | 'postmortem' | 'sop' | 'known-issue' | 'playbook'
type ScopeLevel = 'org' | 'domain' | 'project'

type SourceKind =
  | 'file'
  | 'confluence'
  | 'notion'
  | 'github'
  | 'google-docs'
  | 'url'
  | 'paste'
  | 'pagerduty'
  | 'servicenow'
  | 'sharepoint'

interface KBDoc {
  id: string
  title: string
  type: DocType
  summary: string
  author: string
  updatedAt: string
  scope: ScopeLevel
  scopeName: string
  scopeParent?: string
  source: SourceKind
  sourceRef?: string   // URL, file name, page ID, etc.
  status: 'indexed' | 'syncing' | 'error'
  lastSync?: string
}

// ─── Source definitions ───────────────────────────────────────────────────────
interface SourceDef {
  id: SourceKind
  label: string
  logo: string
  color: string
  description: string
  connected: boolean
  placeholder?: string
  inputLabel?: string
  supportsAutoSync: boolean
  hint?: string
}

const SOURCES: SourceDef[] = [
  { id: 'file',        logo: '📎', label: 'File Upload',     color: '#60a5fa', description: 'PDF, Word, Markdown, TXT — drag & drop or browse', connected: true,  supportsAutoSync: false, inputLabel: 'Choose file', hint: 'Supported: .pdf .docx .md .txt .rst (max 50 MB)' },
  { id: 'confluence',  logo: '🔷', label: 'Confluence',      color: '#0052cc', description: 'Paste a Confluence page URL to index it', connected: true,  supportsAutoSync: true,  placeholder: 'https://acme.atlassian.net/wiki/spaces/ENG/pages/123456', inputLabel: 'Confluence Page URL', hint: 'The page and all child pages will be indexed. Auto-syncs every 24h.' },
  { id: 'notion',      logo: '⬛', label: 'Notion',          color: '#ffffff', description: 'Index a Notion page, database, or workspace section', connected: false, supportsAutoSync: true,  placeholder: 'https://notion.so/your-page-id', inputLabel: 'Notion Page URL', hint: 'Connect your Notion workspace in Foundations → Integrations first.' },
  { id: 'github',      logo: '🐙', label: 'GitHub / GitLab', color: '#34d399', description: 'README, wiki, or any Markdown file from a repository', connected: true,  supportsAutoSync: true,  placeholder: 'https://github.com/acme/checkout-service/blob/main/docs/runbook.md', inputLabel: 'File or Wiki URL', hint: 'Auto-syncs when the file changes on the default branch.' },
  { id: 'google-docs', logo: '📄', label: 'Google Docs',     color: '#4285f4', description: 'Share a Google Doc link to index its content', connected: false, supportsAutoSync: true,  placeholder: 'https://docs.google.com/document/d/...', inputLabel: 'Google Doc URL', hint: 'The doc must be shared with your Operon service account.' },
  { id: 'url',         logo: '🌐', label: 'Web URL',          color: '#fbbf24', description: 'Any public web page — internal wikis, status pages, docs sites', connected: true,  supportsAutoSync: false, placeholder: 'https://docs.acme.io/checkout/runbook', inputLabel: 'Page URL', hint: 'We fetch and parse the page content. Re-index manually when the page changes.' },
  { id: 'paste',       logo: '📝', label: 'Paste Text',       color: '#a78bfa', description: 'Paste raw text or Markdown directly', connected: true,  supportsAutoSync: false, inputLabel: 'Content', hint: 'Supports Markdown formatting.' },
  { id: 'pagerduty',   logo: '🚨', label: 'PagerDuty',        color: '#f87171', description: 'Import a runbook attached to a PagerDuty service', connected: true,  supportsAutoSync: true,  placeholder: 'P3KD8VX', inputLabel: 'PagerDuty Service ID', hint: 'Auto-syncs when the runbook is updated in PagerDuty.' },
  { id: 'servicenow',  logo: '🟢', label: 'ServiceNow',       color: '#81e6d9', description: 'Import a Knowledge Base article from ServiceNow', connected: false, supportsAutoSync: true,  placeholder: 'KB0001234', inputLabel: 'Article Number', hint: 'Connect ServiceNow in Foundations → Integrations first.' },
  { id: 'sharepoint',  logo: '🔶', label: 'SharePoint',       color: '#0078d4', description: 'Index a SharePoint page or document library', connected: false, supportsAutoSync: true,  placeholder: 'https://acme.sharepoint.com/sites/Engineering/...', inputLabel: 'SharePoint URL', hint: 'Connect Microsoft 365 in Foundations → Integrations first.' },
]

// ─── Mock Data ────────────────────────────────────────────────────────────────
const ALL_DOCS: KBDoc[] = [
  { id: 'ok1', title: 'Global Incident Response Playbook', type: 'playbook', summary: 'Step-by-step guide for all engineers when an incident is declared. Covers severity levels, communication templates, and stakeholder updates.', author: 'Harish Kumar', updatedAt: '2026-02-15', scope: 'org', scopeName: 'Acme Corp', source: 'confluence', sourceRef: 'https://acme.atlassian.net/wiki/spaces/ENG/pages/111001', status: 'indexed', lastSync: '2026-02-15 09:00' },
  { id: 'ok2', title: 'SLA & SLO Definitions', type: 'sop', summary: 'Defines availability, latency, and error rate SLOs for all production services. Used by AI agents to determine incident severity.', author: 'Priya Sharma', updatedAt: '2026-01-20', scope: 'org', scopeName: 'Acme Corp', source: 'confluence', sourceRef: 'https://acme.atlassian.net/wiki/spaces/ENG/pages/111002', status: 'indexed', lastSync: '2026-01-20 14:30' },
  { id: 'ok3', title: 'Escalation Matrix', type: 'sop', summary: 'Who to contact for P1/P2 incidents outside business hours. On-call rotation schedule and direct contacts.', author: 'Jordan Blake', updatedAt: '2026-02-01', scope: 'org', scopeName: 'Acme Corp', source: 'google-docs', sourceRef: 'https://docs.google.com/document/d/1abc123', status: 'indexed' },
  { id: 'ok4', title: 'Post-Incident Review Template', type: 'postmortem', summary: 'Standard template for 5-why analysis, contributing factors, and corrective action tracking.', author: 'Alex Chen', updatedAt: '2026-01-10', scope: 'org', scopeName: 'Acme Corp', source: 'notion', sourceRef: 'https://notion.so/postmortem-template-abc', status: 'indexed' },
  { id: 'ok5', title: 'Security Incident Procedures', type: 'sop', summary: 'Runbook for data breach, credential exposure, and DDoS events. Includes legal and compliance notification steps.', author: 'Harish Kumar', updatedAt: '2025-12-01', scope: 'org', scopeName: 'Acme Corp', source: 'sharepoint', sourceRef: 'https://acme.sharepoint.com/sites/Security/...', status: 'error', lastSync: '2025-12-01' },
  { id: 'ek1', title: 'E-Commerce On-Call Runbook', type: 'runbook', summary: 'Primary runbook for the Commerce team. Covers checkout failures, payment gateway issues, cart degradation, and catalog search outages.', author: 'Commerce Team', updatedAt: '2026-02-20', scope: 'domain', scopeName: 'E-Commerce', source: 'confluence', sourceRef: 'https://acme.atlassian.net/wiki/spaces/ECOM/pages/22001', status: 'indexed', lastSync: '2026-02-20 08:00' },
  { id: 'ek2', title: 'Payment Flow Architecture', type: 'architecture', summary: 'Full architecture diagram of the payment processing pipeline — from cart to Stripe to ledger reconciliation. Includes failure modes and fallback paths.', author: 'Alex Chen', updatedAt: '2026-01-15', scope: 'domain', scopeName: 'E-Commerce', source: 'url', sourceRef: 'https://internal-wiki.acme.io/ecom/payment-architecture', status: 'indexed' },
  { id: 'ek3', title: 'Black Friday Scaling Procedures', type: 'playbook', summary: 'Step-by-step scaling playbook for peak traffic events. Pre-scaling checklists, cache warm-up, and rollback thresholds.', author: 'Harish Kumar', updatedAt: '2025-11-01', scope: 'domain', scopeName: 'E-Commerce', source: 'confluence', sourceRef: 'https://acme.atlassian.net/wiki/spaces/ECOM/pages/22002', status: 'indexed', lastSync: '2025-11-01 12:00' },
  { id: 'ek4', title: 'Common Checkout Errors & Fixes', type: 'known-issue', summary: 'Catalogue of recurring checkout errors with root causes and known fixes. Stripe timeout patterns, inventory lock contention, session expiry issues.', author: 'Priya Sharma', updatedAt: '2026-02-28', scope: 'domain', scopeName: 'E-Commerce', source: 'paste', status: 'indexed' },
  { id: 'ik1', title: 'Infrastructure Scaling Runbook', type: 'runbook', summary: 'How to scale ECS clusters, RDS read replicas, and Redis instances under load. Auto-scaling thresholds and manual override procedures.', author: 'Platform Team', updatedAt: '2026-02-05', scope: 'domain', scopeName: 'Infrastructure', source: 'github', sourceRef: 'https://github.com/acme/infra-runbooks/blob/main/scaling.md', status: 'indexed', lastSync: '2026-02-05 11:00' },
  { id: 'ik2', title: 'Network Topology Diagram', type: 'architecture', summary: 'Full network diagram for the production VPC. Subnets, security groups, NAT gateways, and peering connections.', author: 'Alex Chen', updatedAt: '2026-01-30', scope: 'domain', scopeName: 'Infrastructure', source: 'confluence', sourceRef: 'https://acme.atlassian.net/wiki/spaces/INFRA/pages/33001', status: 'indexed', lastSync: '2026-01-30 16:00' },
  { id: 'ik3', title: 'Load Balancer Configuration Guide', type: 'sop', summary: 'ALB health check settings, target group weights, sticky sessions, and SSL termination.', author: 'Jordan Blake', updatedAt: '2025-12-20', scope: 'domain', scopeName: 'Infrastructure', source: 'servicenow', sourceRef: 'KB0001001', status: 'indexed' },
  { id: 'dk1', title: 'Data Pipeline Monitoring Guide', type: 'runbook', summary: 'ETL pipeline health — lag metrics, dead letter queue depth, schema validation failures, and reprocessing procedures.', author: 'AI Agent Beta', updatedAt: '2026-02-14', scope: 'domain', scopeName: 'Data Platform', source: 'notion', sourceRef: 'https://notion.so/data-pipeline-monitoring', status: 'indexed' },
  { id: 'dk2', title: 'ML Model Deployment Procedures', type: 'sop', summary: 'Deploying new ML model versions — A/B traffic splitting, shadow mode testing, rollback criteria based on prediction drift.', author: 'Data Team', updatedAt: '2026-01-28', scope: 'domain', scopeName: 'Data Platform', source: 'github', sourceRef: 'https://github.com/acme/ml-models/blob/main/docs/deployment.md', status: 'indexed', lastSync: '2026-01-28 10:00' },
  { id: 'ck1', title: 'Checkout Service Architecture', type: 'architecture', summary: 'Component diagram for the checkout service — request lifecycle from cart validation through payment processing to order confirmation.', author: 'Alex Chen', updatedAt: '2026-02-10', scope: 'project', scopeName: 'Checkout Service', scopeParent: 'E-Commerce', source: 'confluence', sourceRef: 'https://acme.atlassian.net/wiki/spaces/ECOM/pages/44001', status: 'indexed', lastSync: '2026-02-10 09:00' },
  { id: 'ck2', title: 'Checkout Deployment Runbook', type: 'runbook', summary: 'Deployment procedure — feature flag verification, smoke tests, rollback criteria.', author: 'Harish Kumar', updatedAt: '2026-02-25', scope: 'project', scopeName: 'Checkout Service', scopeParent: 'E-Commerce', source: 'github', sourceRef: 'https://github.com/acme/checkout-service/blob/main/docs/deployment.md', status: 'indexed', lastSync: '2026-02-25 14:00' },
  { id: 'ck3', title: 'Known Issue: Stripe Timeout on High Load', type: 'known-issue', summary: 'Under sustained load > 500 req/s, Stripe webhook callbacks experience 2-5s delays. Workaround: enable async payment confirmation mode.', author: 'Priya Sharma', updatedAt: '2026-03-01', scope: 'project', scopeName: 'Checkout Service', scopeParent: 'E-Commerce', source: 'paste', status: 'indexed' },
  { id: 'ck4', title: 'Checkout Service Postmortem — March 2026', type: 'postmortem', summary: 'P1 incident: connection pool exhaustion caused 4x checkout failure rate for 75 minutes. Root cause: max_connections too low after traffic spike.', author: 'AI Agent Alpha', updatedAt: '2026-03-02', scope: 'project', scopeName: 'Checkout Service', scopeParent: 'E-Commerce', source: 'paste', status: 'indexed' },
  { id: 'gk1', title: 'API Gateway Rate Limiting Config', type: 'sop', summary: 'Per-route rate limit settings, burst allowances, IP whitelist for trusted services. Redis-backed counter setup.', author: 'Sentinel', updatedAt: '2026-02-28', scope: 'project', scopeName: 'API Gateway', scopeParent: 'Infrastructure', source: 'pagerduty', sourceRef: 'P3KD8VX', status: 'indexed', lastSync: '2026-02-28 07:00' },
  { id: 'gk2', title: 'API Gateway Architecture', type: 'architecture', summary: 'Request flow from edge to backend services — authentication middleware, rate limiting, request transformation, routing rules.', author: 'Harish Kumar', updatedAt: '2026-01-25', scope: 'project', scopeName: 'API Gateway', scopeParent: 'Infrastructure', source: 'github', sourceRef: 'https://github.com/acme/api-gateway/blob/main/ARCHITECTURE.md', status: 'indexed', lastSync: '2026-01-25 13:00' },
  { id: 'dpk1', title: 'ETL Pipeline Troubleshooting', type: 'runbook', summary: 'Pipeline failure patterns — Kafka consumer lag, Spark OOM errors, schema registry conflicts, checkpoint recovery.', author: 'AI Agent Beta', updatedAt: '2026-02-19', scope: 'project', scopeName: 'Data Pipeline', scopeParent: 'Data Platform', source: 'confluence', sourceRef: 'https://acme.atlassian.net/wiki/spaces/DATA/pages/55001', status: 'syncing', lastSync: '2026-02-19 08:00' },
  { id: 'dpk2', title: 'Data Pipeline Postmortem — Feb 2026', type: 'postmortem', summary: 'P2 incident: 3-hour data lag caused by Kafka partition rebalance after broker restart. Root cause: incorrect replication factor. Added monitoring alert.', author: 'AI Agent Beta', updatedAt: '2026-02-08', scope: 'project', scopeName: 'Data Pipeline', scopeParent: 'Data Platform', source: 'paste', status: 'indexed' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)

const TYPE_META: Record<DocType, { label: string; color: string; bg: string; icon: string }> = {
  runbook:       { label: 'Runbook',      color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',   icon: '📋' },
  architecture:  { label: 'Architecture', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: '🏗️' },
  postmortem:    { label: 'Postmortem',   color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: '📝' },
  sop:           { label: 'SOP',          color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: '📃' },
  'known-issue': { label: 'Known Issue',  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  icon: '⚠️' },
  playbook:      { label: 'Playbook',     color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  icon: '📖' },
}

const SCOPE_META: Record<ScopeLevel, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  org:     { label: 'Organization', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', icon: Building2 },
  domain:  { label: 'Domain',       color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  icon: FolderOpen },
  project: { label: 'Project',      color: '#34d399', bg: 'rgba(52,211,153,0.1)',  icon: Package },
}

const STATUS_META = {
  indexed: { label: 'Indexed',  color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  syncing: { label: 'Syncing',  color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  error:   { label: 'Error',    color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
}

const DOMAINS = ['E-Commerce', 'Infrastructure', 'Data Platform']
const PROJECTS_BY_DOMAIN: Record<string, string[]> = {
  'E-Commerce':   ['Checkout Service', 'Product Catalog', 'Cart API', 'Payment Gateway'],
  'Infrastructure': ['Auth Service', 'API Gateway', 'Load Balancer'],
  'Data Platform':  ['Data Pipeline', 'Analytics API', 'ML Models'],
}

// ─── Add Source Modal ─────────────────────────────────────────────────────────
function AddSourceModal({ onAdd, onClose }: { onAdd: (doc: KBDoc) => void; onClose: () => void }) {
  const [step, setStep] = useState<'source' | 'config' | 'indexing'>('source')
  const [selectedSource, setSelectedSource] = useState<SourceDef | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [docType, setDocType] = useState<DocType>('runbook')
  const [scope, setScope] = useState<ScopeLevel>('project')
  const [domain, setDomain] = useState('E-Commerce')
  const [project, setProject] = useState('Checkout Service')
  const [title, setTitle] = useState('')
  const [indexing, setIndexing] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const simulateIndexing = async () => {
    setStep('indexing')
    setIndexing(true)
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 180))
      setProgress(i)
    }
    setIndexing(false)
    const scopeName = scope === 'org' ? 'Acme Corp' : scope === 'domain' ? domain : project
    const scopeParent = scope === 'project' ? domain : undefined
    const sourceRef = selectedSource?.id === 'file' ? fileName
      : selectedSource?.id === 'paste' ? undefined
      : inputValue || undefined
    onAdd({
      id: uid(),
      title: title || (fileName ? fileName.replace(/\.[^.]+$/, '') : inputValue.split('/').pop() ?? 'New Document'),
      type: docType,
      summary: pasteText ? pasteText.slice(0, 180) + (pasteText.length > 180 ? '…' : '') : `Imported from ${selectedSource?.label}. Click to view full content.`,
      author: 'You',
      updatedAt: new Date().toISOString().slice(0, 10),
      scope, scopeName, scopeParent,
      source: selectedSource!.id,
      sourceRef,
      status: 'indexed',
      lastSync: new Date().toISOString().slice(0, 16).replace('T', ' '),
    })
    onClose()
  }

  const handleFile = (file: File) => {
    setFileName(file.name)
    setTitle(file.name.replace(/\.[^.]+$/, ''))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Add Knowledge Source</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {step === 'source' ? 'Choose where your document lives' : step === 'config' ? `Configure ${selectedSource?.label} source` : 'Indexing document…'}
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X className="h-4 w-4" /></button>
        </div>

        {/* Step: Choose source */}
        {step === 'source' && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SOURCES.map(src => (
                <button key={src.id}
                  onClick={() => { setSelectedSource(src); setStep('config') }}
                  className="flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
                  style={{ background: 'var(--bg-elevated)', border: `1px solid var(--border)`, opacity: 1 }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = src.color)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                  <span className="text-2xl flex-shrink-0">{src.logo}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
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
        {step === 'config' && selectedSource && (
          <div className="p-6 space-y-4">
            {/* Source header */}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: `1px solid var(--border)` }}>
              <span className="text-2xl">{selectedSource.logo}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedSource.label}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedSource.description}</p>
              </div>
              <button className="text-xs" style={{ color: 'var(--text-muted)' }} onClick={() => setStep('source')}>Change</button>
            </div>

            {/* Not connected warning */}
            {!selectedSource.connected && (
              <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
                <p className="text-xs" style={{ color: '#fbbf24' }}>
                  {selectedSource.label} is not connected. Go to <strong>Foundations → Integrations</strong> to connect it first, or paste text manually.
                </p>
              </div>
            )}

            {/* Input: File upload */}
            {selectedSource.id === 'file' && (
              <div>
                <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.md,.txt,.rst" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                <div
                  className="flex flex-col items-center justify-center py-10 rounded-xl cursor-pointer transition-colors"
                  style={{ border: `2px dashed ${dragOver ? '#60a5fa' : 'var(--border)'}`, background: dragOver ? 'rgba(96,165,250,0.05)' : 'var(--bg-elevated)' }}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]) }}>
                  {fileName ? (
                    <><File className="h-8 w-8 mb-2" style={{ color: '#60a5fa' }} /><p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{fileName}</p><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Click to change</p></>
                  ) : (
                    <><Upload className="h-8 w-8 mb-2" style={{ color: 'var(--text-muted)' }} /><p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Drop your file here or click to browse</p><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{selectedSource.hint}</p></>
                  )}
                </div>
              </div>
            )}

            {/* Input: Paste text */}
            {selectedSource.id === 'paste' && (
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Content (Markdown supported)</label>
                <textarea className="input text-sm resize-none font-mono" rows={8} value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Paste your runbook, architecture notes, postmortem, or any text here…" />
              </div>
            )}

            {/* Input: URL / integration reference */}
            {selectedSource.id !== 'file' && selectedSource.id !== 'paste' && (
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>{selectedSource.inputLabel}</label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                  <input className="input text-sm pl-9 font-mono" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder={selectedSource.placeholder} />
                </div>
                {selectedSource.hint && <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{selectedSource.hint}</p>}
                {selectedSource.supportsAutoSync && selectedSource.connected && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-7 h-3.5 rounded-full flex items-center px-0.5 cursor-pointer" style={{ background: 'var(--accent)' }}>
                      <div className="w-2.5 h-2.5 rounded-full bg-white ml-auto" />
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Auto-sync enabled — re-indexes when source changes</span>
                  </div>
                )}
              </div>
            )}

            {/* Title override */}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Title (optional — auto-detected if blank)</label>
              <input className="input text-sm" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Checkout Deployment Runbook" />
            </div>

            {/* Type + Scope */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Document Type</label>
                <select className="input text-sm" value={docType} onChange={e => setDocType(e.target.value as DocType)}>
                  {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Scope Level</label>
                <select className="input text-sm" value={scope} onChange={e => setScope(e.target.value as ScopeLevel)}>
                  <option value="org">Organization</option>
                  <option value="domain">Domain</option>
                  <option value="project">Project</option>
                </select>
              </div>
              {(scope === 'domain' || scope === 'project') && (
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Domain</label>
                  <select className="input text-sm" value={domain} onChange={e => { setDomain(e.target.value); setProject(PROJECTS_BY_DOMAIN[e.target.value]?.[0] ?? '') }}>
                    {DOMAINS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              )}
              {scope === 'project' && (
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Project</label>
                  <select className="input text-sm" value={project} onChange={e => setProject(e.target.value)}>
                    {(PROJECTS_BY_DOMAIN[domain] ?? []).map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* AI note */}
            <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <Bot className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                This document will be vectorized and added to the AI knowledge graph. When an incident fires for the selected scope, agents will retrieve relevant chunks automatically.
              </p>
            </div>

            <div className="flex justify-between pt-1">
              <button className="btn-secondary text-sm" onClick={() => setStep('source')}>Back</button>
              <button className="btn-primary text-sm" onClick={simulateIndexing}
                disabled={selectedSource.id === 'file' ? !fileName : selectedSource.id === 'paste' ? !pasteText.trim() : !inputValue.trim()}>
                Index Document
              </button>
            </div>
          </div>
        )}

        {/* Step: Indexing */}
        {step === 'indexing' && (
          <div className="p-10 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}>
              {indexing ? <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--accent)' }} /> : <Check className="h-7 w-7" style={{ color: '#34d399' }} />}
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{indexing ? 'Indexing document…' : 'Indexed successfully'}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{indexing ? 'Parsing, chunking, and vectorizing content for AI retrieval' : 'Document is now available to AI agents'}</p>
            </div>
            <div className="w-full max-w-xs rounded-full overflow-hidden h-2" style={{ background: 'var(--bg-elevated)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
            </div>
            {indexing && (
              <div className="space-y-1.5 text-left w-full max-w-xs">
                {[
                  { label: 'Fetching content', done: progress >= 20 },
                  { label: 'Parsing structure', done: progress >= 40 },
                  { label: 'Chunking text', done: progress >= 60 },
                  { label: 'Generating embeddings', done: progress >= 80 },
                  { label: 'Storing in vector DB', done: progress >= 100 },
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-2">
                    {done ? <Check className="h-3 w-3 flex-shrink-0" style={{ color: '#34d399' }} /> : <div className="w-3 h-3 rounded-full border border-current flex-shrink-0" style={{ borderColor: 'var(--border)' }} />}
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

// ─── Source badge ─────────────────────────────────────────────────────────────
function SourceBadge({ source }: { source: SourceKind }) {
  const src = SOURCES.find(s => s.id === source)
  if (!src) return null
  return (
    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
      <span>{src.logo}</span> {src.label}
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function KnowledgePage() {
  const [docs, setDocs] = useState<KBDoc[]>(ALL_DOCS)
  const [search, setSearch] = useState('')
  const [scopeFilter, setScopeFilter] = useState<ScopeLevel | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<DocType | 'all'>('all')
  const [domainFilter, setDomainFilter] = useState<string>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)

  const filtered = useMemo(() => docs.filter(d => {
    if (search && !d.title.toLowerCase().includes(search.toLowerCase()) && !d.summary.toLowerCase().includes(search.toLowerCase())) return false
    if (scopeFilter !== 'all' && d.scope !== scopeFilter) return false
    if (typeFilter !== 'all' && d.type !== typeFilter) return false
    if (domainFilter !== 'all') {
      if (d.scope === 'domain' && d.scopeName !== domainFilter) return false
      if (d.scope === 'project' && d.scopeParent !== domainFilter) return false
      if (d.scope === 'org') return false
    }
    return true
  }), [docs, search, scopeFilter, typeFilter, domainFilter])

  const counts = {
    all: docs.length,
    org: docs.filter(d => d.scope === 'org').length,
    domain: docs.filter(d => d.scope === 'domain').length,
    project: docs.filter(d => d.scope === 'project').length,
  }

  return (
    <div className="h-full overflow-y-auto">
    <div className="p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Knowledge Base</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {docs.length} documents indexed · AI agents search these during investigations
          </p>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" /> Add Source
        </button>
      </div>

      {/* AI hierarchy banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl mb-5" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)' }}>
        <Bot className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Knowledge Hierarchy</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            When investigating a "Checkout Service" incident, agents search in this order:
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {[{ icon: Package, label: 'Checkout Service docs', color: '#34d399' }, { icon: FolderOpen, label: 'E-Commerce domain docs', color: '#60a5fa' }, { icon: Building2, label: 'Acme Corp org docs', color: '#a78bfa' }].map(({ icon: I, label, color }, idx) => (
              <div key={label} className="flex items-center gap-1.5">
                {idx > 0 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>→</span>}
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: `${color}15`, color, border: `1px solid ${color}33` }}>
                  <I className="h-2.5 w-2.5" /> {label}
                </span>
              </div>
            ))}
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>— most specific first</span>
          </div>
        </div>
        {/* Source breakdown */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          {SOURCES.filter(s => s.connected && docs.some(d => d.source === s.id)).map(src => (
            <div key={src.id} className="text-center">
              <p className="text-lg">{src.logo}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{docs.filter(d => d.source === src.id).length}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scope tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {([['all', 'All', null], ['org', 'Organization', Building2], ['domain', 'Domain', FolderOpen], ['project', 'Project', Package]] as const).map(([val, label, Icon]) => (
          <button key={val} onClick={() => { setScopeFilter(val); setDomainFilter('all') }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: scopeFilter === val ? 'var(--accent)' : 'var(--bg-elevated)', color: scopeFilter === val ? '#fff' : 'var(--text-secondary)', border: `1px solid ${scopeFilter === val ? 'var(--accent)' : 'var(--border)'}` }}>
            {Icon && <Icon className="h-3 w-3" />}
            {label}
            <span className="px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: scopeFilter === val ? 'rgba(255,255,255,0.2)' : 'var(--bg-surface)', color: scopeFilter === val ? '#fff' : 'var(--text-muted)' }}>
              {counts[val]}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-9 text-sm" placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input text-sm w-40" value={typeFilter} onChange={e => setTypeFilter(e.target.value as DocType | 'all')}>
          <option value="all">All types</option>
          {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        {(scopeFilter === 'all' || scopeFilter === 'domain' || scopeFilter === 'project') && (
          <select className="input text-sm w-44" value={domainFilter} onChange={e => setDomainFilter(e.target.value)}>
            <option value="all">All domains</option>
            {DOMAINS.map(d => <option key={d}>{d}</option>)}
          </select>
        )}
        {(search || scopeFilter !== 'all' || typeFilter !== 'all' || domainFilter !== 'all') && (
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            onClick={() => { setSearch(''); setScopeFilter('all'); setTypeFilter('all'); setDomainFilter('all') }}>
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Showing {filtered.length} of {docs.length} documents</p>

      {/* Doc list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 rounded-xl" style={{ border: '1px dashed var(--border)' }}>
            <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No documents found</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Try adjusting filters or add a new source</p>
          </div>
        )}
        {filtered.map(doc => {
          const tm = TYPE_META[doc.type]
          const sm = SCOPE_META[doc.scope]
          const st = STATUS_META[doc.status]
          const ScopeIcon = sm.icon
          const isExpanded = expandedDoc === doc.id
          return (
            <div key={doc.id} className="rounded-xl overflow-hidden cursor-pointer" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <span className="text-xl flex-shrink-0">{tm.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{doc.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: tm.bg, color: tm.color, border: `1px solid ${tm.color}33` }}>{tm.label}</span>
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.color}33` }}>
                      <ScopeIcon className="h-2.5 w-2.5" />
                      {doc.scopeParent ? `${doc.scopeParent} / ${doc.scopeName}` : doc.scopeName}
                    </span>
                    <SourceBadge source={doc.source} />
                    <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>
                      {doc.status === 'syncing' && <RefreshCw className="h-2.5 w-2.5 animate-spin" />}
                      {doc.status === 'error' && <AlertCircle className="h-2.5 w-2.5" />}
                      {doc.status === 'indexed' && <Check className="h-2.5 w-2.5" />}
                      {st.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Clock className="h-2.5 w-2.5" /> {doc.updatedAt}
                    </span>
                    {doc.lastSync && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· synced {doc.lastSync}</span>}
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 transition-transform" style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
              </div>
              {isExpanded && (
                <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-sm leading-relaxed pt-3 mb-3" style={{ color: 'var(--text-secondary)' }}>{doc.summary}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--accent)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <Bot className="h-3 w-3" /> AI uses this for {doc.scopeName} incidents
                    </div>
                    {doc.sourceRef && (
                      <span className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-mono" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        <Link className="h-3 w-3" /> {doc.sourceRef.length > 60 ? doc.sourceRef.slice(0, 57) + '…' : doc.sourceRef}
                      </span>
                    )}
                    <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      <RefreshCw className="h-3 w-3" /> Re-index
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {addOpen && <AddSourceModal onAdd={doc => setDocs(d => [doc, ...d])} onClose={() => setAddOpen(false)} />}
    </div>
    </div>
  )
}
