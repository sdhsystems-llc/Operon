import type { Project } from '../../types'
import type { IntCategory } from '../../types'
import { Slab } from '../Slab'

interface IntegrationsTabProps {
  project: Project
  intCategories: IntCategory[]
}

const statusBadge = (connected: boolean) => (
  <span style={{
    fontSize: '0.7rem', fontWeight: 600, borderRadius: 6, padding: '0.15rem 0.5rem',
    background: connected ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
    color: connected ? '#34d399' : '#f87171',
    border: `1px solid ${connected ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
  }}>
    {connected ? '● Connected' : '○ Not Connected'}
  </span>
)

export function IntegrationsTab({ project: _project, intCategories }: IntegrationsTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {intCategories.map(cat => (
        <Slab key={cat.id} title={cat.label}
          subtitle={`${cat.items.filter(i => i.connected).length} of ${cat.items.length} connected`}
          action={<span style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, display: 'inline-block' }} />}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: '0.75rem' }}>
            {cat.items.map(item => (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.875rem', background: 'var(--bg-base)', borderRadius: 10, border: `1px solid ${item.connected ? 'rgba(129,140,248,0.25)' : 'var(--border)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ fontSize: '1.375rem' }}>{item.logo}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>{item.name}</p>
                      {item.badge && <span style={{ fontSize: '0.68rem', color: '#818cf8', background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 5, padding: '0.1rem 0.4rem' }}>{item.badge}</span>}
                    </div>
                    {statusBadge(item.connected)}
                  </div>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{item.description}</p>
                {item.connected && item.config && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                    {Object.entries(item.config).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.125rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                        <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!item.connected && (
                  <button style={{ padding: '0.4rem', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: '#818cf8', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, marginTop: '0.25rem' }}>
                    + Connect
                  </button>
                )}
              </div>
            ))}
          </div>
        </Slab>
      ))}
    </div>
  )
}
