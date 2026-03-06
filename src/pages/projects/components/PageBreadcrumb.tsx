import { Link } from 'react-router-dom'

interface Crumb { label: string; to?: string }

export function PageBreadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
      {crumbs.map((c, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          {i > 0 && <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>›</span>}
          {c.to
            ? <Link to={c.to} style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}
                onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
              >{c.label}</Link>
            : <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{c.label}</span>}
        </span>
      ))}
    </nav>
  )
}
