import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

function Topbar() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <header
      className="h-12 flex items-center justify-end px-5 flex-shrink-0"
      style={{
        backgroundColor: 'var(--topbar-bg)',
        borderBottom: '1px solid var(--topbar-border)',
      }}
    >
      <button
        onClick={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="relative w-14 h-7 rounded-full flex items-center px-1 cursor-pointer border"
        style={{
          backgroundColor: isDark ? 'var(--accent-light)' : '#e0e7ff',
          borderColor: isDark ? 'var(--accent)' : '#a5b4fc',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {/* pill thumb */}
        <span
          className="absolute w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
          style={{
            backgroundColor: isDark ? 'var(--accent)' : '#4f46e5',
            left: isDark ? 'calc(100% - 1.5rem)' : '0.25rem',
            transition: 'left 0.3s ease, background-color 0.3s ease',
          }}
        >
          {isDark
            ? <Sun className="w-3 h-3 text-white" />
            : <Moon className="w-3 h-3 text-white" />
          }
        </span>
        {/* labels */}
        <span className="ml-1 text-xs font-medium" style={{ color: 'var(--text-muted)', minWidth: 24 }}>
          {isDark ? '🌙' : '☀️'}
        </span>
      </button>
    </header>
  )
}

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-base)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
