import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { KnowledgeDoc, KnowledgeDocType } from '../types'
import { Slab } from './Slab'
import { AddKnowledgeModal } from './AddKnowledgeModal'

const TYPE_META: Record<KnowledgeDocType, { label: string; icon: string; color: string }> = {
  runbook:       { label: 'Runbook',       icon: '📖', color: '#34d399' },
  architecture:  { label: 'Architecture',  icon: '🏗️', color: '#818cf8' },
  postmortem:    { label: 'Postmortem',    icon: '💀', color: '#f87171' },
  sop:           { label: 'SOP',           icon: '📋', color: '#60a5fa' },
  'known-issue': { label: 'Known Issue',   icon: '⚠️', color: '#fbbf24' },
  playbook:      { label: 'Playbook',      icon: '🎯', color: '#fb923c' },
}

// Source icons shown on each doc card
const SOURCE_ICON: Record<string, string> = {
  'File Upload': '📎', Confluence: '🔷', Notion: '⬛', 'GitHub / GitLab': '🐙',
  'Google Docs': '📄', 'Web URL': '🌐', 'Paste Text': '📝',
  PagerDuty: '🚨', ServiceNow: '🟢', SharePoint: '🔶', Manual: '✍️', You: '✍️',
}

interface Props {
  docs: KnowledgeDoc[]
  title?: string
  subtitle?: string
  onAdd: (doc: KnowledgeDoc) => void
  onRemove: (id: string) => void
}

export function KnowledgeDocsPanel({ docs, title = 'Knowledge Documents', subtitle, onAdd, onRemove }: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Slab
        title={title}
        subtitle={subtitle ?? `${docs.length} document${docs.length !== 1 ? 's' : ''} grounding AI investigations`}
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.875rem' }}>
            <Plus className="w-3 h-3" /> Add Knowledge
          </button>
        }
      >
        {docs.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📚</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>No knowledge sources yet</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>Connect Confluence, upload files, paste text, or link any doc to ground your AI agents.</p>
              <button onClick={() => setShowModal(true)} className="btn-primary" style={{ fontSize: '0.8rem' }}>
                <Plus className="w-3 h-3" /> Add your first source
              </button>
            </div>
          )
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {docs.map(doc => {
                const meta = TYPE_META[doc.type] ?? TYPE_META.runbook
                const srcIcon = SOURCE_ICON[doc.author] ?? '📄'
                return (
                  <div key={doc.id} style={{ display: 'flex', gap: '0.875rem', padding: '0.875rem', background: 'var(--bg-base)', borderRadius: 10, border: '1px solid var(--border)', alignItems: 'flex-start' }}>
                    {/* Source icon */}
                    <span style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: 2 }} title={doc.author}>{srcIcon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>{doc.title}</p>
                        {/* Doc type badge */}
                        <span style={{ fontSize: '0.68rem', background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}40`, borderRadius: 5, padding: '0.1rem 0.4rem' }}>{meta.label}</span>
                        {/* Source badge */}
                        {doc.author && doc.author !== 'Manual' && doc.author !== 'You' && (
                          <span style={{ fontSize: '0.68rem', background: 'rgba(129,140,248,0.1)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.25)', borderRadius: 5, padding: '0.1rem 0.4rem' }}>{doc.author}</span>
                        )}
                      </div>
                      {doc.summary && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.25rem' }}>{doc.summary}</p>}
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                        {doc.updatedAt}
                        {doc.link && <> · <a href={doc.link} target="_blank" rel="noreferrer" style={{ color: '#818cf8' }}>Open ↗</a></>}
                      </p>
                    </div>
                    <button onClick={() => onRemove(doc.id)} style={{ padding: '0.25rem 0.5rem', borderRadius: 6, border: 'none', background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 }} title="Remove">✕</button>
                  </div>
                )
              })}
            </div>
          )
        }
      </Slab>

      {showModal && (
        <AddKnowledgeModal
          onSave={onAdd}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
