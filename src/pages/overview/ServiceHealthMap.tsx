import { useNavigate } from 'react-router-dom'
import type { FlatProject } from '../projects/types'

function healthColor(score?: number): { bg: string; border: string; text: string; glow: string } {
  const s = score ?? 100
  if (s >= 99.9) return { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', text: '#34d399', glow: 'rgba(16,185,129,0.15)' }
  if (s >= 99)   return { bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.30)', text: '#6ee7b7', glow: 'rgba(52,211,153,0.12)' }
  if (s >= 97)   return { bg: 'rgba(134,239,172,0.08)',border: 'rgba(134,239,172,0.25)',text: '#86efac', glow: 'transparent' }
  if (s >= 95)   return { bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.30)', text: '#fbbf24', glow: 'rgba(251,191,36,0.10)' }
  if (s >= 90)   return { bg: 'rgba(251,146,60,0.10)', border: 'rgba(251,146,60,0.30)', text: '#fb923c', glow: 'rgba(251,146,60,0.10)' }
  return           { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.35)', text: '#f87171', glow: 'rgba(248,113,113,0.15)' }
}

const ORG_COLORS: Record<string, string> = {
  netflix: '#ef4444', stripe: '#818cf8', vercel: '#000000',
}
const ORG_BG: Record<string, string> = {
  netflix: 'rgba(239,68,68,0.12)', stripe: 'rgba(129,140,248,0.12)', vercel: 'rgba(255,255,255,0.08)',
}

interface Props { projects: FlatProject[] }

export function ServiceHealthMap({ projects }: Props) {
  const navigate = useNavigate()
  const sorted = [...projects].sort((a, b) => (a.healthScore ?? 100) - (b.healthScore ?? 100))

  const legend = [
    { label: '≥99.9%', color: '#34d399' },
    { label: '≥99%',   color: '#6ee7b7' },
    { label: '≥95%',   color: '#fbbf24' },
    { label: '≥90%',   color: '#fb923c' },
    { label: '<90%',   color: '#f87171' },
  ]

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>Service Health Map</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.125rem 0 0' }}>
            {projects.length} services · sorted by health · click to investigate
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {legend.map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, display: 'inline-block' }} />
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.625rem 0.875rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))', gap: '0.4rem', alignContent: 'start' }}>
        {sorted.map(p => {
          const c = healthColor(p.healthScore)
          const orgColor = ORG_COLORS[p.orgId] ?? '#818cf8'
          const orgBg = ORG_BG[p.orgId] ?? 'rgba(129,140,248,0.12)'

          return (
            <div key={`${p.orgId}-${p.id}`}
              onClick={() => navigate(`/orgs/${p.orgId}/domains/${p.domainId}/projects/${p.id}`)}
              style={{
                background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8,
                padding: '0.5rem 0.625rem', cursor: 'pointer',
                transition: 'transform 0.12s, box-shadow 0.12s',
                boxShadow: p.investigations > 0 ? `0 0 12px ${c.glow}` : 'none',
              }}
              onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${c.glow}` }}
              onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = p.investigations > 0 ? `0 0 12px ${c.glow}` : 'none' }}
            >
              {/* Org badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, background: orgBg, color: orgColor, borderRadius: 4, padding: '0.1rem 0.375rem', border: `1px solid ${orgColor}30` }}>{p.orgName}</span>
                {p.investigations > 0 && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', animation: 'hmpulse 1.5s infinite', display: 'inline-block' }} />
                )}
              </div>

              {/* Project name */}
              <p style={{ fontWeight: 700, fontSize: '0.7rem', color: 'var(--text-primary)', margin: '0 0 0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>

              {/* Health score */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: c.text, lineHeight: 1 }}>{p.healthScore ?? '—'}</span>
                <span style={{ fontSize: '0.6rem', color: c.text, opacity: 0.7 }}>%</span>
              </div>

              {/* Mini bar */}
              <div style={{ marginTop: '0.375rem', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p.healthScore ?? 100}%`, background: c.text, borderRadius: 2, transition: 'width 1s ease' }} />
              </div>

              {/* SLO tag */}
              {p.sloActual && (
                <p style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', margin: '0.25rem 0 0' }}>SLO {p.sloActual} / {p.sloTarget}</p>
              )}
            </div>
          )
        })}
      </div>

      <style>{`@keyframes hmpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.4)}}`}</style>
    </div>
  )
}
