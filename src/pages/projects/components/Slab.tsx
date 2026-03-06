import type { ReactNode } from 'react'

interface SlabProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  noPad?: boolean
}

export function Slab({ title, subtitle, action, children, noPad }: SlabProps) {
  return (
    <div style={{ borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-surface)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.125rem', borderBottom: '1px solid var(--border)', gap: '0.75rem' }}>
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</p>
          {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{subtitle}</p>}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      <div style={noPad ? undefined : { padding: '1rem 1.125rem' }}>
        {children}
      </div>
    </div>
  )
}
