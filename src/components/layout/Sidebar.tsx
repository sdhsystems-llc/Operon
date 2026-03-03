import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderOpen,
  Search,
  Bot,
  Plug,
  BookOpen,
  MessageSquare,
  Settings,
  Zap,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/investigations', icon: Search, label: 'Investigations' },
  { to: '/agents', icon: Bot, label: 'Agents' },
  { to: '/integrations', icon: Plug, label: 'Integrations' },
  { to: '/knowledge', icon: BookOpen, label: 'Knowledge' },
  { to: '/chat', icon: MessageSquare, label: 'AI Chat' },
]

export default function Sidebar() {
  const { profile, signOut } = useAuth()

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">Operon</span>
        </div>
        {profile && (
          <p className="text-xs text-gray-500 mt-1 truncate">{profile.org_name}</p>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-100 group ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 font-medium'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-100 mb-1 ${
              isActive ? 'bg-blue-600/15 text-blue-400 font-medium' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`
          }
        >
          <Settings className="w-4 h-4" />
          Settings
        </NavLink>

        {profile && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-200 truncate">{profile.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
            </div>
            <button
              onClick={signOut}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              title="Sign out"
            >
              ↩
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
