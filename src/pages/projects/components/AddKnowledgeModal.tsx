import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import type { KnowledgeDoc, KnowledgeDocType } from '../types'
import { uid } from '../mockData'

// ── source definitions ────────────────────────────────────────────────────────
const SOURCES = [
  { id: 'file',        icon: '📎', label: 'File Upload',   badge: null,          desc: 'PDF, Word, Markdown, TXT — drag & drop or browse' },
  { id: 'confluence',  icon: '🔷', label: 'Confluence',    badge: 'Auto-sync',   desc: 'Paste a Confluence page URL to index it' },
  { id: 'notion',      icon: '⬛', label: 'Notion',        badge: 'Connect',     desc: 'Index a Notion page, database, or workspace section' },
  { id: 'github',      icon: '🐙', label: 'GitHub / GitLab', badge: 'Auto-sync', desc: 'README, wiki, or any Markdown file from a repository' },
  { id: 'gdocs',       icon: '📄', label: 'Google Docs',   badge: 'Connect',     desc: 'Share a Google Doc link to index its content' },
  { id: 'url',         icon: '🌐', label: 'Web URL',        badge: null,         desc: 'Any public web page — internal wikis, status pages, docs sites' },
  { id: 'paste',       icon: '📝', label: 'Paste Text',    badge: null,          desc: 'Paste raw text or Markdown directly' },
  { id: 'pagerduty',   icon: '🚨', label: 'PagerDuty',     badge: 'Auto-sync',   desc: 'Import a runbook attached to a PagerDuty service' },
  { id: 'servicenow',  icon: '🟢', label: 'ServiceNow',    badge: 'Connect',     desc: 'Import a Knowledge Base article from ServiceNow' },
  { id: 'sharepoint',  icon: '🔶', label: 'SharePoint',    badge: 'Connect',     desc: 'Index a SharePoint page or document library' },
] as const

type SourceId = typeof SOURCES[number]['id']

const DOC_TYPES: { id: KnowledgeDocType; label: string }[] = [
  { id: 'runbook',      label: 'Runbook' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'postmortem',   label: 'Postmortem' },
  { id: 'sop',          label: 'SOP' },
  { id: 'known-issue',  label: 'Known Issue' },
  { id: 'playbook',     label: 'Playbook' },
]

const BADGE_STYLE: Record<string, React.CSSProperties> = {
  'Auto-sync': { background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' },
  'Connect':   { background: 'rgba(129,140,248,0.12)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.3)' },
}

// ── props ────────────────────────────────────────────────────────────────────
interface Props {
  onSave: (doc: KnowledgeDoc) => void
  onClose: () => void
}

// ── helpers ────────────────────────────────────────────────────────────────--
const field: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }

// ── source-specific form fields ───────────────────────────────────────────────
function SourceForm({ source, form, setForm, fileRef }: {
  source: SourceId
  form: Record<string, string>
  setForm: (fn: (p: Record<string, string>) => Record<string, string>) => void
  fileRef: React.RefObject<HTMLInputElement>
}) {
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  if (source === 'file') return (
    <div>
      <label style={lbl}>File</label>
      <div
        onClick={() => fileRef.current?.click()}
        style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '2rem', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-base)', transition: 'border-color 0.2s' }}
        onMouseOver={e => (e.currentTarget.style.borderColor = '#818cf8')}
        onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📎</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 0.25rem' }}>
          {form.fileName || 'Drop file here or click to browse'}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>PDF, DOCX, MD, TXT supported</p>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.md,.txt" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) setForm(p => ({ ...p, fileName: f.name, title: p.title || f.name.replace(/\.[^.]+$/, '') })) }} />
      </div>
    </div>
  )

  if (source === 'paste') return (
    <div>
      <label style={lbl}>Content</label>
      <textarea style={{ ...field, minHeight: 140, resize: 'vertical' }} value={form.content ?? ''} onChange={set('content')} placeholder="Paste your Markdown or plain text here..." />
    </div>
  )

  if (source === 'github') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div><label style={lbl}>Repository URL</label><input style={field} value={form.repoUrl ?? ''} onChange={set('repoUrl')} placeholder="https://github.com/org/repo" /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div><label style={lbl}>File Path</label><input style={field} value={form.filePath ?? ''} onChange={set('filePath')} placeholder="docs/runbook.md" /></div>
        <div><label style={lbl}>Branch</label><input style={field} value={form.branch ?? ''} onChange={set('branch')} placeholder="main" /></div>
      </div>
    </div>
  )

  const URL_LABELS: Partial<Record<SourceId, { url: string; placeholder: string }>> = {
    confluence:  { url: 'Confluence Page URL', placeholder: 'https://company.atlassian.net/wiki/spaces/...' },
    notion:      { url: 'Notion Page URL',      placeholder: 'https://www.notion.so/...' },
    gdocs:       { url: 'Google Doc URL',       placeholder: 'https://docs.google.com/document/d/...' },
    url:         { url: 'Page URL',             placeholder: 'https://...' },
    pagerduty:   { url: 'PagerDuty Service URL', placeholder: 'https://company.pagerduty.com/services/...' },
    servicenow:  { url: 'ServiceNow Article URL', placeholder: 'https://company.service-now.com/kb_view.do?...' },
    sharepoint:  { url: 'SharePoint URL',       placeholder: 'https://company.sharepoint.com/sites/...' },
  }

  const meta = URL_LABELS[source]
  if (meta) return (
    <div><label style={lbl}>{meta.url}</label><input style={field} value={form.link ?? ''} onChange={set('link')} placeholder={meta.placeholder} /></div>
  )

  return null
}

// ── main modal ────────────────────────────────────────────────────────────────
export function AddKnowledgeModal({ onSave, onClose }: Props) {
  const [step, setStep] = useState<'pick' | 'form'>('pick')
  const [source, setSource] = useState<SourceId | null>(null)
  const [form, setForm] = useState<Record<string, string>>({ title: '', type: 'runbook', summary: '', link: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  const selectedSource = SOURCES.find(s => s.id === source)

  const canSave = form.title.trim() && (
    source === 'file' ? !!form.fileName :
    source === 'paste' ? !!form.content?.trim() :
    source === 'github' ? !!form.repoUrl?.trim() :
    source === 'url' || source === 'confluence' || source === 'notion' || source === 'gdocs' || source === 'pagerduty' || source === 'servicenow' || source === 'sharepoint' ? !!form.link?.trim() :
    true
  )

  const handleSave = () => {
    if (!canSave || !source) return
    const linkVal = form.link || form.repoUrl || ''
    const doc: KnowledgeDoc = {
      id: uid(),
      title: form.title.trim(),
      type: form.type as KnowledgeDocType,
      summary: form.summary.trim() || `Imported from ${selectedSource?.label}`,
      link: linkVal,
      author: selectedSource?.label ?? 'Manual',
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    onSave(doc)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 18, width: '100%', maxWidth: step === 'pick' ? 680 : 520, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1.375rem 1.5rem 1rem', borderBottom: '1px solid var(--border)' }}>
          <div>
            {step === 'form' && source && (
              <button onClick={() => setStep('pick')} style={{ fontSize: '0.78rem', color: '#818cf8', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '0.375rem', display: 'block' }}>
                ← Back
              </button>
            )}
            <p style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>
              {step === 'pick' ? 'Add Knowledge Source' : `Add from ${selectedSource?.label}`}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              {step === 'pick' ? 'Choose where your document lives' : 'Fill in the details below'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', borderRadius: 6, marginTop: 2 }}>
            <X size={18} />
          </button>
        </div>

        {/* Step 1 — source picker grid */}
        {step === 'pick' && (
          <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.625rem' }}>
            {SOURCES.map(s => (
              <button key={s.id} onClick={() => { setSource(s.id); setStep('form') }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.375rem', padding: '0.875rem 1rem', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, background 0.15s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#818cf8'; e.currentTarget.style.background = 'rgba(129,140,248,0.06)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-base)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                  <span style={{ fontSize: '1.375rem' }}>{s.icon}</span>
                  {s.badge && (
                    <span style={{ ...BADGE_STYLE[s.badge], fontSize: '0.62rem', fontWeight: 700, borderRadius: 5, padding: '0.1rem 0.4rem', marginLeft: 'auto' }}>
                      {s.badge}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{s.label}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>{s.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — source form */}
        {step === 'form' && source && (
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {/* Source-specific input */}
            <SourceForm source={source} form={form} setForm={setForm} fileRef={fileRef} />

            {/* Common fields */}
            <div>
              <label style={lbl}>Title <span style={{ color: '#f87171' }}>*</span></label>
              <input style={field} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={`Give this document a name`} autoFocus={source !== 'file'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={lbl}>Document Type</label>
                <select style={field} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {DOC_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Summary <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <input style={field} value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Brief description..." />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
              <button onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={handleSave} disabled={!canSave} className="btn-primary"
                style={{ opacity: canSave ? 1 : 0.45, cursor: canSave ? 'pointer' : 'not-allowed' }}>
                Add to Knowledge Base
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
