import { useState } from 'react'
import type { Project } from '../types'

const ENVS = ['production', 'staging', 'development', 'canary']

interface ProjectModalProps {
  existing?: Project
  domainName?: string
  onSave: (p: Partial<Project> & { name: string }) => void
  onClose: () => void
}

export function ProjectModal({ existing, domainName, onSave, onClose }: ProjectModalProps) {
  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [environment, setEnvironment] = useState(existing?.environment ?? 'production')
  const [serviceUrl, setServiceUrl] = useState(existing?.serviceUrl ?? '')
  const [repoUrl, setRepoUrl] = useState(existing?.repoUrl ?? '')

  const fieldStyle = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem', width: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {existing ? 'Edit Project' : 'New Project'}
        </p>
        {domainName && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Domain: {domainName}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div><label style={labelStyle}>Name</label><input style={fieldStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Video Encoder" /></div>
          <div><label style={labelStyle}>Description</label><textarea style={{ ...fieldStyle, minHeight: 72, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this service do?" /></div>
          <div>
            <label style={labelStyle}>Environment</label>
            <select style={fieldStyle} value={environment} onChange={e => setEnvironment(e.target.value)}>
              {ENVS.map(env => <option key={env} value={env}>{env}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Service URL (optional)</label><input style={fieldStyle} value={serviceUrl} onChange={e => setServiceUrl(e.target.value)} placeholder="https://..." /></div>
          <div><label style={labelStyle}>Repository URL (optional)</label><input style={fieldStyle} value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="github.com/org/repo" /></div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => name && onSave({ name, description, environment, serviceUrl, repoUrl })}
            disabled={!name}
            style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', background: '#818cf8', color: '#fff', cursor: name ? 'pointer' : 'not-allowed', fontWeight: 600 }}>
            {existing ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
