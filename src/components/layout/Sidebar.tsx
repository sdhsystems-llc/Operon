import { NavLink } from 'react-router-dom'
import {
  Search,
  Bot,
  BookOpen,
  MessageSquare,
  Settings,
  Zap,
  ChevronRight,
  LogOut,
  Activity,
  Building2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/', icon: Activity, label: 'Overview', end: true },
  { to: '/foundations', icon: Building2, label: 'Foundations' },
  { to: '/investigations', icon: Search, label: 'Investigations' },
  { to: '/agents', icon: Bot, label: 'Agents' },
  { to: '/knowledge', icon: BookOpen, label: 'Knowledge' },
  { to: '/chat', icon: MessageSquare, label: 'AI Chat' },
]

export default function Sidebar() {
  const { profile, signOut } = useAuth()

  return (
    <aside
      className="w-56 flex flex-col h-full flex-shrink-0"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Logo */}
      <div
        className="p-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">Operon</span>
        </div>
        {profile && (
          <p className="text-xs mt-1 truncate" style={{ color: 'var(--sidebar-text)', opacity: 0.7 }}>
            {profile.org_name}
          </p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="block"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: isActive ? 500 : 400,
              color: isActive ? '#ffffff' : 'var(--sidebar-text)',
              backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
              textDecoration: 'none',
              transition: 'background-color 0.15s, color 0.15s',
            })}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              if (!el.getAttribute('aria-current')) {
                el.style.backgroundColor = 'var(--sidebar-hover-bg)'
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              if (!el.getAttribute('aria-current')) {
                el.style.backgroundColor = 'transparent'
              }
            }}
          >
            {({ isActive }) => (
              <>
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: isActive ? '#a5b4fc' : 'var(--sidebar-text)' }}
                />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3 h-3" style={{ color: '#a5b4fc', opacity: 0.6 }} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <NavLink
          to="/settings"
          className="block mb-1"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: isActive ? 500 : 400,
            color: isActive ? '#ffffff' : 'var(--sidebar-text)',
            backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
            textDecoration: 'none',
            transition: 'background-color 0.15s, color 0.15s',
          })}
        >
          {({ isActive }) => (
            <>
              <Settings
                className="w-4 h-4 flex-shrink-0"
                style={{ color: isActive ? '#a5b4fc' : 'var(--sidebar-text)' }}
              />
              <span>Settings</span>
            </>
          )}
        </NavLink>

        {profile && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
          >
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{profile.full_name}</p>
              <p className="text-xs capitalize" style={{ color: 'var(--sidebar-text)', opacity: 0.7 }}>{profile.role}</p>
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              className="flex items-center justify-center w-5 h-5 rounded opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--sidebar-text)' }}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
