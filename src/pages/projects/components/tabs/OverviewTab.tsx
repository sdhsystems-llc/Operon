import { useState } from 'react'
import type { Project } from '../../types'
import { ENV_STYLE } from '../../mockData'
import { Slab } from '../Slab'

const ACTIVITY_COLORS: Record<string, string> = {
  incident: '#f87171', deploy: '#34d399', agent: '#818cf8', alert: '#fbbf24', resolved: '#60a5fa'
}

export function OverviewTab({ project, onUpdate }: { project: Project; onUpdate: (p: Project) => void }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: project.name, description: project.description, serviceUrl: project.serviceUrl ?? '', repoUrl: project.repoUrl ?? '' })
  const envStyle = ENV_STYLE[project.environment] ?? ENV_STYLE['production']

  const saveEdit = () => { onUpdate({ ...project, ...form }); setEditing(false) }

  const fieldStyle = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Health + SLO row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '0.75rem' }}>
        {[
          { label: 'Health Score', value: `${project.healthScore ?? '–'}%`, color: (project.healthScore ?? 0) >= 99 ? '#34d399' : (project.healthScore ?? 0) >= 95 ? '#fbbf24' : '#f87171' },
          { label: 'SLO Target', value: project.sloTarget ?? '–', color: '#818cf8' },
          { label: 'SLO Actual', value: project.sloActual ?? '–', color: (project.sloActual ?? '0%') >= (project.sloTarget ?? '99%') ? '#34d399' : '#fbbf24' },
          { label: 'Active Incidents', value: String(project.investigations ?? 0), color: project.investigations ? '#f87171' : '#34d399' },
          { label: 'AI Agents', value: String(project.agents.length), color: '#60a5fa' },
          { label: 'Knowledge Docs', value: String(project.docs), color: '#a78bfa' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.75rem 1rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{s.label}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, margin: '0.25rem 0 0' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Service Details */}
      <Slab title="Service Details" action={
        editing
          ? <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setEditing(false)} style={{ padding: '0.35rem 0.75rem', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
              <button onClick={saveEdit} style={{ padding: '0.35rem 0.75rem', borderRadius: 7, border: 'none', background: '#818cf8', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Save</button>
            </div>
          : <button onClick={() => setEditing(true)} style={{ padding: '0.35rem 0.75rem', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>Edit</button>
      }>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div><label style={labelStyle}>Name</label><input style={fieldStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label style={labelStyle}>Description</label><textarea style={{ ...fieldStyle, minHeight: 64, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><label style={labelStyle}>Service URL</label><input style={fieldStyle} value={form.serviceUrl} onChange={e => setForm(f => ({ ...f, serviceUrl: e.target.value }))} /></div>
            <div><label style={labelStyle}>Repository</label><input style={fieldStyle} value={form.repoUrl} onChange={e => setForm(f => ({ ...f, repoUrl: e.target.value }))} /></div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '1rem' }}>
            {[
              { label: 'Description', value: project.description || '—' },
              { label: 'Environment', value: <span style={{ background: envStyle.bg, color: envStyle.color, border: `1px solid ${envStyle.border}`, borderRadius: 6, padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>{project.environment}</span> },
              { label: 'Service URL', value: project.serviceUrl ? <a href={project.serviceUrl} target="_blank" rel="noreferrer" style={{ color: '#818cf8', textDecoration: 'none' }}>{project.serviceUrl}</a> : '—' },
              { label: 'Repository', value: project.repoUrl ? <a href={`https://${project.repoUrl}`} target="_blank" rel="noreferrer" style={{ color: '#818cf8', textDecoration: 'none' }}>{project.repoUrl}</a> : '—' },
              { label: 'On-Call', value: project.onCall ? `${project.onCall.name} · ${project.onCall.until}` : '—' },
              { label: 'Last Deploy', value: project.lastDeploy ? `${project.lastDeploy.commit} · ${project.lastDeploy.when} · ${project.lastDeploy.message}` : '—' },
            ].map(f => (
              <div key={f.label}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{f.label}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>{f.value}</p>
              </div>
            ))}
          </div>
        )}
      </Slab>

      {/* Components */}
      {project.components.length > 0 && (
        <Slab title="Components" subtitle={`${project.components.length} components in this service`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {project.components.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '1rem' }}>⚙️</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>{c.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{c.description}</p>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#818cf8', background: 'rgba(129,140,248,0.12)', borderRadius: 6, padding: '0.2rem 0.5rem', whiteSpace: 'nowrap' }}>{c.tech}</span>
              </div>
            ))}
          </div>
        </Slab>
      )}

      {/* Recent Activity */}
      {(project.recentActivity?.length ?? 0) > 0 && (
        <Slab title="Recent Activity" subtitle="Latest events from agents, deploys, and incidents">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {project.recentActivity!.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACTIVITY_COLORS[a.kind] ?? '#818cf8', flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', margin: 0 }}>{a.label}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Slab>
      )}
    </div>
  )
}
