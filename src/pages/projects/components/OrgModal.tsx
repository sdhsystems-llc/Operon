import { useState } from 'react'
import type { Org } from '../types'

const TIMEZONES = ['America/Los_Angeles', 'America/New_York', 'America/Chicago', 'Europe/London', 'Europe/Berlin', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney']
const PLANS = ['Starter', 'Pro', 'Enterprise']

interface OrgModalProps {
  existing?: Org
  onSave: (org: Omit<Org, 'knowledge'>) => void
  onClose: () => void
}

export function OrgModal({ existing, onSave, onClose }: OrgModalProps) {
  const [name, setName] = useState(existing?.name ?? '')
  const [industry, setIndustry] = useState(existing?.industry ?? '')
  const [timezone, setTimezone] = useState(existing?.timezone ?? 'America/New_York')
  const [plan, setPlan] = useState(existing?.plan ?? 'Pro')

  const fieldStyle = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem', width: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
          {existing ? 'Edit Organization' : 'New Organization'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div><label style={labelStyle}>Name</label><input style={fieldStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Netflix" /></div>
          <div><label style={labelStyle}>Industry</label><input style={fieldStyle} value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Media & Entertainment" /></div>
          <div>
            <label style={labelStyle}>Timezone</label>
            <select style={fieldStyle} value={timezone} onChange={e => setTimezone(e.target.value)}>
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Plan</label>
            <select style={fieldStyle} value={plan} onChange={e => setPlan(e.target.value)}>
              {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => name && onSave({ id: existing?.id ?? name.toLowerCase().replace(/\s+/g, '-'), name, industry, timezone, plan })}
            disabled={!name}
            style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', background: '#818cf8', color: '#fff', cursor: name ? 'pointer' : 'not-allowed', fontWeight: 600 }}>
            {existing ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
