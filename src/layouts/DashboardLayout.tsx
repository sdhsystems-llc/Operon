import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { GlobalSearch } from '../components/GlobalSearch';
import { NotificationBell } from '../components/NotificationBell';
import { PageTransition } from '../components/PageTransition';
import {
  LayoutDashboard,
  Search,
  MessageSquare,
  Puzzle,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  ChevronLeft,
  Hexagon,
  Cpu,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface NavItem { name: string; path: string; icon: any; }
interface NavGroup { label: string; items: NavItem[]; }

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Core',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Investigations', path: '/investigations', icon: Search },
      { name: 'Chat', path: '/chat', icon: MessageSquare },
      { name: 'Agents', path: '/agents', icon: Cpu },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { name: 'Integrations', path: '/integrations', icon: Puzzle },
      { name: 'Notifications', path: '/team-integrations', icon: Bell },
      { name: 'Knowledge', path: '/knowledge', icon: BookOpen },
    ],
  },
  {
    label: 'Account',
    items: [
      { name: 'Foundations', path: '/foundations', icon: Layers },
      { name: 'Audit Log', path: '/audit', icon: ShieldCheck },
      { name: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

const isActiveRoute = (path: string, current: string) =>
  path === '/' ? current === '/' : current.startsWith(path);

interface SidebarProps {
  collapsed: boolean;
  onClose?: () => void;
  handleSignOut: () => void;
  profile: any;
  pathname: string;
}

const SidebarContent = ({ collapsed, onClose, handleSignOut, profile, pathname }: SidebarProps) => (
  <div className="h-full flex flex-col" style={{ background: 'var(--bg-surface)' }}>
    <div className="h-14 flex items-center justify-between px-4 flex-shrink-0"
      style={{ borderBottom: '1px solid var(--border)' }}>
      <Link to="/" className="flex items-center gap-2.5 min-w-0" onClick={onClose}>
        <div className="relative flex-shrink-0">
          <Hexagon className="h-7 w-7" style={{ color: 'var(--accent)' }} strokeWidth={1.5} />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: 'var(--accent)' }}>O</span>
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Operon</span>
        )}
      </Link>
      {onClose && (
        <button onClick={onClose} className="lg:hidden" style={{ color: 'var(--text-muted)' }}>
          <X className="h-5 w-5" />
        </button>
      )}
    </div>

    <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}>
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActiveRoute(item.path, pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={onClose}
                  title={collapsed ? item.name : undefined}
                  className={`relative group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${collapsed ? 'justify-center' : ''}`}
                  style={{
                    background: active ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    color: active ? '#818cf8' : 'var(--text-secondary)',
                    borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                  }}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && item.name}
                  {collapsed && (
                    <span className="absolute left-12 px-2 py-1 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>

    <div className="flex-shrink-0 p-3" style={{ borderTop: '1px solid var(--border)' }}>
      {!collapsed && (
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1 rounded-lg"
          style={{ background: 'var(--bg-elevated)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(99, 102, 241, 0.2)' }}>
            <User className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {profile?.full_name || 'User'}
            </p>
            <p className="text-[10px] truncate capitalize" style={{ color: 'var(--text-muted)' }}>
              {profile?.role || 'engineer'}
            </p>
          </div>
        </div>
      )}
      <button
        onClick={handleSignOut}
        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${collapsed ? 'justify-center' : ''}`}
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
      >
        <LogOut className="h-4 w-4 flex-shrink-0" />
        {!collapsed && 'Sign out'}
      </button>
    </div>
  </div>
);

export const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => { try { await signOut(); } catch {} };
  const sidebarW = collapsed ? 64 : 240;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:hidden transform transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: '240px', borderRight: '1px solid var(--border)' }}
      >
        <SidebarContent collapsed={false} onClose={() => setMobileOpen(false)} handleSignOut={handleSignOut} profile={profile} pathname={location.pathname} />
      </aside>

      <aside
        className="hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-200 ease-in-out"
        style={{ width: `${sidebarW}px`, borderRight: '1px solid var(--border)' }}
      >
        <SidebarContent collapsed={collapsed} handleSignOut={handleSignOut} profile={profile} pathname={location.pathname} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all z-10"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          <ChevronLeft className={`h-3 w-3 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      <div className="transition-all duration-200 ease-in-out" style={{ paddingLeft: `${sidebarW}px` }}>
        <header
          className="sticky top-0 z-30 h-14 px-4 sm:px-6 flex items-center gap-4"
          style={{ background: 'rgba(8,9,13,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}
        >
          <button onClick={() => setMobileOpen(true)} className="lg:hidden" style={{ color: 'var(--text-secondary)' }}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <GlobalSearch />
            <NotificationBell />
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname}>
              {children}
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
