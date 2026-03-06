import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Search, Bot, BookOpen, MessageSquare, Settings, Zap,
  ChevronRight, LogOut, Activity, Building2, Layers, FolderGit2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const COLLAPSED_W = 68
const EXPANDED_W  = 248

const navItems = [
  { to: '/',               icon: Activity,      label: 'Overview',       end: true },
  { to: '/orgs',           icon: Building2,     label: 'Organizations' },
  { to: '/domains',        icon: Layers,        label: 'Domains' },
  { to: '/projects',       icon: FolderGit2,    label: 'Projects' },
  { to: '/investigations', icon: Search,        label: 'Investigations' },
  { to: '/agents',         icon: Bot,           label: 'Agents' },
  { to: '/knowledge',      icon: BookOpen,      label: 'Knowledge' },
  { to: '/chat',           icon: MessageSquare, label: 'AI Chat' },
]

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width:    isHovered ? EXPANDED_W : COLLAPSED_W,
        minWidth: isHovered ? EXPANDED_W : COLLAPSED_W,

        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: isHovered ? '1rem 1rem' : '1rem 0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 64, transition: 'padding 0.22s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
          <div style={{
            width: 34, height: 34, backgroundColor: '#4f46e5', borderRadius: 9, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(79,70,229,0.4)',
          }}>
            <Zap style={{ width: 17, height: 17, color: 'white' }} />
          </div>
          {isHovered && (
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                Operon
              </p>
              {profile && (
                <p style={{ fontSize: '0.75rem', color: 'var(--sidebar-text)', opacity: 0.65, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                  {profile.org_name}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav style={{
        flex: 1,
        padding: isHovered ? '0.875rem 0.75rem' : '0.75rem 0.5rem',
        overflowY: 'auto', overflowX: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 3,
        transition: 'padding 0.22s ease',
      }}>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={!isHovered ? label : undefined}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: isHovered ? 'flex-start' : 'center',
              gap: '0.75rem',
              padding: isHovered ? '0.75rem 1rem' : '0.875rem 0',
              borderRadius: '0.625rem',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#ffffff' : 'var(--sidebar-text)',
              backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
              textDecoration: 'none',
              transition: 'background-color 0.15s, color 0.15s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            })}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              if (!el.getAttribute('aria-current')) el.style.backgroundColor = 'var(--sidebar-hover-bg)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              if (!el.getAttribute('aria-current')) el.style.backgroundColor = 'transparent'
            }}
          >
            {({ isActive }) => (
              <>
                <Icon style={{
                  width: isHovered ? 18 : 22, height: isHovered ? 18 : 22,
                  flexShrink: 0,
                  color: isActive ? '#a5b4fc' : 'var(--sidebar-text)',
                  transition: 'width 0.15s, height 0.15s',
                }} />
                {isHovered && <span style={{ flex: 1 }}>{label}</span>}
                {isHovered && isActive && (
                  <ChevronRight style={{ width: 13, height: 13, color: '#a5b4fc', opacity: 0.55 }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={{
        padding: isHovered ? '0.875rem 0.75rem' : '0.75rem 0.5rem',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column', gap: 4,
        transition: 'padding 0.22s ease',
      }}>
        <NavLink
          to="/settings"
          title={!isHovered ? 'Settings' : undefined}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            justifyContent: isHovered ? 'flex-start' : 'center',
            gap: '0.75rem',
            padding: isHovered ? '0.75rem 1rem' : '0.875rem 0',
            borderRadius: '0.625rem',
            fontSize: '0.875rem',
            fontWeight: isActive ? 600 : 400,
            color: isActive ? '#ffffff' : 'var(--sidebar-text)',
            backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
            textDecoration: 'none',
            transition: 'background-color 0.15s, color 0.15s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          })}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            if (!el.getAttribute('aria-current')) el.style.backgroundColor = 'var(--sidebar-hover-bg)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            if (!el.getAttribute('aria-current')) el.style.backgroundColor = 'transparent'
          }}
        >
          {({ isActive }) => (
            <>
              <Settings style={{
                width: isHovered ? 18 : 22, height: isHovered ? 18 : 22,
                flexShrink: 0,
                color: isActive ? '#a5b4fc' : 'var(--sidebar-text)',
              }} />
              {isHovered && <span>Settings</span>}
            </>
          )}
        </NavLink>

        {profile && (
          <div
            title={!isHovered ? profile.full_name : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isHovered ? 'flex-start' : 'center',
              gap: '0.625rem',
              padding: isHovered ? '0.625rem 0.875rem' : '0.625rem 0',
              borderRadius: '0.625rem',
              backgroundColor: 'rgba(255,255,255,0.05)',
            }}
          >
            <div style={{
              width: isHovered ? 26 : 30, height: isHovered ? 26 : 30,
              borderRadius: '50%', backgroundColor: '#4f46e5', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isHovered ? '0.6875rem' : '0.8125rem',
              fontWeight: 700, color: 'white',
              transition: 'width 0.15s, height 0.15s',
            }}>
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            {isHovered && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
                    {profile.full_name}
                  </p>
                  <p style={{ fontSize: '0.6875rem', textTransform: 'capitalize', color: 'var(--sidebar-text)', opacity: 0.65, lineHeight: 1.3 }}>
                    {profile.role}
                  </p>
                </div>
                <button
                  onClick={signOut}
                  title="Sign out"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 26, height: 26, borderRadius: 6, border: 'none',
                    backgroundColor: 'transparent', color: 'var(--sidebar-text)',
                    cursor: 'pointer', opacity: 0.55, flexShrink: 0,
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0.55' }}
                >
                  <LogOut style={{ width: 14, height: 14 }} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
