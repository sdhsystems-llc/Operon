import { useState } from 'react'
import type { Project, ProjectNotificationConfig } from '../../types'
import { Slab } from '../Slab'

const EVENT_LABELS: Record<string, string> = {
  new_investigation: 'New investigation opened',
  root_cause_identified: 'Root cause identified',
  remediation_suggested: 'Remediation suggested',
  investigation_resolved: 'Investigation resolved',
  agent_health_alerts: 'Agent health alerts',
}

export function AlertsTab({ project, onUpdate }: { project: Project; onUpdate: (p: Project) => void }) {
  const notif: ProjectNotificationConfig = project.notifications ?? {
    enabled: false, platform: 'inherit', slackChannel: '', teamsChannel: '',
    events: { new_investigation: true, root_cause_identified: true, remediation_suggested: true, investigation_resolved: true, agent_health_alerts: true },
    alertLevels: { p1: true, p2: true, p3: false },
  }

  const [cfg, setCfg] = useState(notif)

  const save = () => onUpdate({ ...project, notifications: cfg })

  const fieldStyle = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }

  const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ position: 'relative', width: 36, height: 20, flexShrink: 0 }} onClick={() => onChange(!value)}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: value ? '#818cf8' : 'var(--border)', transition: 'background 0.2s' }} />
        <div style={{ position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
      </div>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{label}</span>
    </label>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Enable / Platform */}
      <Slab title="Notification Settings">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Toggle value={cfg.enabled} onChange={v => setCfg(c => ({ ...c, enabled: v }))} label="Enable notifications for this project" />
          {cfg.enabled && (
            <>
              <div>
                <label style={labelStyle}>Platform</label>
                <select style={fieldStyle} value={cfg.platform} onChange={e => setCfg(c => ({ ...c, platform: e.target.value as typeof cfg.platform }))}>
                  <option value="inherit">Inherit from organization</option>
                  <option value="slack">Slack</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="both">Both (Slack + Teams)</option>
                </select>
              </div>
              {(cfg.platform === 'slack' || cfg.platform === 'both') && (
                <div><label style={labelStyle}>Slack Channel</label><input style={fieldStyle} value={cfg.slackChannel} onChange={e => setCfg(c => ({ ...c, slackChannel: e.target.value }))} placeholder="#incident-channel" /></div>
              )}
              {(cfg.platform === 'teams' || cfg.platform === 'both') && (
                <div><label style={labelStyle}>Teams Channel</label><input style={fieldStyle} value={cfg.teamsChannel} onChange={e => setCfg(c => ({ ...c, teamsChannel: e.target.value }))} placeholder="Channel name" /></div>
              )}
            </>
          )}
        </div>
      </Slab>

      {/* Events */}
      <Slab title="Notification Events" subtitle="Choose which AI agent events trigger notifications">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {Object.entries(cfg.events).map(([key, val]) => (
            <Toggle key={key} value={val} label={EVENT_LABELS[key] ?? key}
              onChange={v => setCfg(c => ({ ...c, events: { ...c.events, [key]: v } }))}
            />
          ))}
        </div>
      </Slab>

      {/* Alert Levels */}
      <Slab title="Alert Severity" subtitle="Which severity levels trigger a notification">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {(['p1', 'p2', 'p3'] as const).map(level => (
            <Toggle key={level} value={cfg.alertLevels[level]} label={`${level.toUpperCase()} — ${level === 'p1' ? 'Critical / Production down' : level === 'p2' ? 'High / Degraded' : 'Medium / Elevated error rate'}`}
              onChange={v => setCfg(c => ({ ...c, alertLevels: { ...c.alertLevels, [level]: v } }))}
            />
          ))}
        </div>
      </Slab>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={save} style={{ padding: '0.5rem 1.5rem', borderRadius: 9, border: 'none', background: '#818cf8', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem' }}>Save Alert Settings</button>
      </div>
    </div>
  )
}
