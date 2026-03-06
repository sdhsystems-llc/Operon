import { useState } from 'react'
import type { Domain } from '../types'

interface DomainModalProps {
  existing?: Domain
  orgName?: string
  onSave: (domain: Omit<Domain, 'projects' | 'knowledge'>) => void
  onClose: () => void
}

export function DomainModal({ existing, orgName, onSave, onClose }: DomainModalProps) {
  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [owner, setOwner] = useState(existing?.owner ?? '')
  const [channel, setChannel] = useState(existing?.notificationChannel ?? '')

  const fieldStyle = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem', width: 480 }}>
        <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {existing ? 'Edit Domain' : 'New Domain'}
        </p>
        {orgName && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Organization: {orgName}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div><label style={labelStyle}>Name</label><input style={fieldStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Streaming Platform" /></div>
          <div><label style={labelStyle}>Description</label><input style={fieldStyle} value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this domain cover?" /></div>
          <div><label style={labelStyle}>Owner / Team</label><input style={fieldStyle} value={owner} onChange={e => setOwner(e.target.value)} placeholder="e.g. Streaming SRE" /></div>
          <div><label style={labelStyle}>Notification Channel</label><input style={fieldStyle} value={channel} onChange={e => setChannel(e.target.value)} placeholder="e.g. #streaming-incidents" /></div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => name && onSave({ id: existing?.id ?? name.toLowerCase().replace(/\s+/g, '-'), name, description, owner, notificationChannel: channel })}
            disabled={!name}
            style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', background: '#818cf8', color: '#fff', cursor: name ? 'pointer' : 'not-allowed', fontWeight: 600 }}>
            {existing ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
