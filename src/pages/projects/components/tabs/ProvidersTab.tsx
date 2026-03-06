import { useState } from 'react'
import type { Project, IntCategory } from '../../types'

interface ProvidersTabProps {
  project: Project
  intCategories: IntCategory[]
  onUpdate: (p: Project) => void
}

export function ProvidersTab({ project, intCategories, onUpdate }: ProvidersTabProps) {
  const [expandedConfig, setExpandedConfig] = useState<string | null>(null)
  const [configValues, setConfigValues] = useState<Record<string, Record<string, string>>>(() => {
    const init: Record<string, Record<string, string>> = {}
    project.dataSources.forEach(ds => { init[ds.integrationId] = { ...ds.config } })
    return init
  })
  const [filter, setFilter] = useState<'all' | 'connected' | 'active'>('all')

  const getDS = (id: string) => project.dataSources.find(d => d.integrationId === id)

  const toggleEnable = (id: string) => {
    const ds = getDS(id)
    if (!ds) return
    onUpdate({ ...project, dataSources: project.dataSources.map(d => d.integrationId === id ? { ...d, enabled: !d.enabled } : d) })
  }

  const saveConfig = (id: string) => {
    onUpdate({ ...project, dataSources: project.dataSources.map(ds => ds.integrationId === id ? { ...ds, config: configValues[id] ?? ds.config } : ds) })
    setExpandedConfig(null)
  }

  const allItems = intCategories.flatMap(c => c.items)
  const totalConnected = allItems.filter(i => i.connected).length
  const totalActive = project.dataSources.filter(d => d.enabled).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Summary bar + filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem' }}>
          {[
            { label: 'Total Providers', value: allItems.length, color: 'var(--text-primary)' },
            { label: 'Connected', value: totalConnected, color: '#34d399' },
            { label: 'Active for Project', value: totalActive, color: '#818cf8' },
          ].map(s => (
            <div key={s.label}>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {(['all', 'connected', 'active'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '0.35rem 0.75rem', borderRadius: 7, border: `1px solid ${filter === f ? '#818cf8' : 'var(--border)'}`,
              background: filter === f ? 'rgba(129,140,248,0.12)' : 'transparent',
              color: filter === f ? '#818cf8' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.78rem', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize',
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Categories */}
      {intCategories.map(cat => {
        const catItems = cat.items.filter(item => {
          if (filter === 'connected') return item.connected
          if (filter === 'active') return getDS(item.id)?.enabled
          return true
        })
        if (catItems.length === 0) return null

        return (
          <div key={cat.id}>
            {/* Category header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{cat.label}</p>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {cat.items.filter(i => i.connected).length}/{cat.items.length} connected
              </span>
            </div>

            {/* Provider cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {catItems.map(item => {
                const ds = getDS(item.id)
                const isActive = ds?.enabled ?? false
                const isOpen = expandedConfig === item.id
                const configFields = Object.entries(item.dsFields ?? {})

                return (
                  <div key={item.id} style={{
                    background: 'var(--bg-surface)', border: `1px solid ${isActive ? 'rgba(129,140,248,0.35)' : item.connected ? 'rgba(52,211,153,0.2)' : 'var(--border)'}`,
                    borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s',
                  }}>
                    {/* Main row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.125rem' }}>
                      {/* Logo */}
                      <span style={{ fontSize: '1.5rem', flexShrink: 0, width: 36, textAlign: 'center' }}>{item.logo}</span>

                      {/* Name + description */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.125rem' }}>
                          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>{item.name}</p>
                          {item.badge && (
                            <span style={{ fontSize: '0.65rem', color: '#818cf8', background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 4, padding: '0.1rem 0.4rem', fontWeight: 600 }}>{item.badge}</span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</p>
                      </div>

                      {/* Right-side controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
                        {/* Connection badge */}
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 600, borderRadius: 6, padding: '0.2rem 0.6rem', whiteSpace: 'nowrap',
                          background: item.connected ? 'rgba(52,211,153,0.1)' : 'rgba(148,163,184,0.1)',
                          color: item.connected ? '#34d399' : 'var(--text-muted)',
                          border: `1px solid ${item.connected ? 'rgba(52,211,153,0.3)' : 'var(--border)'}`,
                        }}>
                          {item.connected ? '● Connected' : '○ Not connected'}
                        </span>

                        {/* Config toggle (only if connected and has fields) */}
                        {item.connected && configFields.length > 0 && (
                          <button onClick={() => setExpandedConfig(isOpen ? null : item.id)} style={{
                            fontSize: '0.75rem', color: '#818cf8', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.2rem 0.4rem', whiteSpace: 'nowrap',
                          }}>
                            {isOpen ? '▲ Config' : '▼ Config'}
                          </button>
                        )}

                        {/* Connect button (not connected) */}
                        {!item.connected && (
                          <button style={{
                            padding: '0.35rem 0.875rem', borderRadius: 7, border: '1px solid rgba(129,140,248,0.4)',
                            background: 'transparent', color: '#818cf8', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap',
                          }}>
                            + Connect
                          </button>
                        )}

                        {/* Active for project toggle (only if connected) */}
                        {item.connected && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <span style={{ fontSize: '0.72rem', color: isActive ? '#818cf8' : 'var(--text-muted)', fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap' }}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                            <div style={{ position: 'relative', width: 38, height: 22, flexShrink: 0 }} onClick={() => toggleEnable(item.id)}>
                              <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: isActive ? '#818cf8' : 'var(--border)', transition: 'background 0.2s' }} />
                              <div style={{ position: 'absolute', top: 3, left: isActive ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
                            </div>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Expandable config */}
                    {isOpen && configFields.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--border)', padding: '0.875rem 1.125rem', background: 'var(--bg-base)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0.625rem', marginBottom: '0.875rem' }}>
                          {configFields.map(([key, placeholder]) => (
                            <div key={key}>
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>{key}</label>
                              <input
                                value={configValues[item.id]?.[key] ?? ''}
                                onChange={e => setConfigValues(v => ({ ...v, [item.id]: { ...v[item.id], [key]: e.target.value } }))}
                                placeholder={placeholder as string}
                                style={{ width: '100%', padding: '0.4rem 0.625rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.8rem', boxSizing: 'border-box' }}
                              />
                            </div>
                          ))}
                        </div>
                        <button onClick={() => saveConfig(item.id)} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                          Save Config
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
