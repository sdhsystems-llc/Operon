import { useState } from 'react'
import type { Project } from '../../types'
import type { IntCategory } from '../../types'
import { Slab } from '../Slab'

interface DataSourcesTabProps {
  project: Project
  intCategories: IntCategory[]
  onUpdate: (p: Project) => void
}

export function DataSourcesTab({ project, intCategories, onUpdate }: DataSourcesTabProps) {
  const [expandedConfig, setExpandedConfig] = useState<string | null>(null)
  const [configValues, setConfigValues] = useState<Record<string, Record<string, string>>>(() => {
    const init: Record<string, Record<string, string>> = {}
    project.dataSources.forEach(ds => { init[ds.integrationId] = { ...ds.config } })
    return init
  })

  const allItems = intCategories.flatMap(c => c.items)
  const getItem = (id: string) => allItems.find(i => i.id === id)
  const getDS = (id: string) => project.dataSources.find(d => d.integrationId === id)

  const toggle = (id: string, enabled: boolean) => {
    const updated = project.dataSources.map(ds =>
      ds.integrationId === id ? { ...ds, enabled } : ds
    )
    onUpdate({ ...project, dataSources: updated })
  }

  const saveConfig = (id: string) => {
    const updated = project.dataSources.map(ds =>
      ds.integrationId === id ? { ...ds, config: configValues[id] ?? ds.config } : ds
    )
    onUpdate({ ...project, dataSources: updated })
    setExpandedConfig(null)
  }

  const active = project.dataSources.filter(d => d.enabled)
  const available = project.dataSources.filter(d => !d.enabled)

  const DSCard = ({ id }: { id: string }) => {
    const item = getItem(id)
    const ds = getDS(id)
    if (!item) return null
    const isOpen = expandedConfig === id
    const fields = Object.entries(item.dsFields)

    return (
      <div style={{ background: 'var(--bg-base)', border: `1px solid ${ds?.enabled ? 'rgba(129,140,248,0.4)' : 'var(--border)'}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem' }}>
          <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{item.logo}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>{item.name}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{item.description}</p>
          </div>
          {!item.connected && <span style={{ fontSize: '0.7rem', color: '#fbbf24', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 5, padding: '0.15rem 0.5rem', whiteSpace: 'nowrap' }}>Not Connected</span>}
          {item.connected && fields.length > 0 && (
            <button onClick={() => setExpandedConfig(isOpen ? null : id)} style={{ fontSize: '0.75rem', color: '#818cf8', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem' }}>
              {isOpen ? '▲ Config' : '▼ Config'}
            </button>
          )}
          {item.connected && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flexShrink: 0 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ds?.enabled ? 'Enabled' : 'Disabled'}</span>
              <div style={{ position: 'relative', width: 36, height: 20 }} onClick={() => toggle(id, !ds?.enabled)}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: ds?.enabled ? '#818cf8' : 'var(--border)', transition: 'background 0.2s' }} />
                <div style={{ position: 'absolute', top: 2, left: ds?.enabled ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
              </div>
            </label>
          )}
        </div>
        {isOpen && fields.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '0.875rem 1rem', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.625rem', marginBottom: '0.875rem' }}>
              {fields.map(([key, placeholder]) => (
                <div key={key}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>{key}</label>
                  <input
                    value={configValues[id]?.[key] ?? ''}
                    onChange={e => setConfigValues(v => ({ ...v, [id]: { ...v[id], [key]: e.target.value } }))}
                    placeholder={placeholder}
                    style={{ width: '100%', padding: '0.4rem 0.625rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.8rem', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>
            <button onClick={() => saveConfig(id)} style={{ padding: '0.4rem 1rem', borderRadius: 7, border: 'none', background: '#818cf8', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Save Config</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Slab title="Active Data Sources" subtitle={`${active.length} source${active.length !== 1 ? 's' : ''} wiring real-time data to AI agents`}>
        {active.length === 0
          ? <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>No active data sources yet — enable one below</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>{active.map(ds => <DSCard key={ds.integrationId} id={ds.integrationId} />)}</div>
        }
      </Slab>
      <Slab title="Available Data Sources" subtitle="Connected integrations — enable to link with this project">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>{available.map(ds => <DSCard key={ds.integrationId} id={ds.integrationId} />)}</div>
      </Slab>
    </div>
  )
}
