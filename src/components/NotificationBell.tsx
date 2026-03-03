import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import type { Investigation } from '../types/database.types';
import { Link } from 'react-router-dom';

const SEV_COLOR: Record<string, string> = {
  p1: 'text-[#f87171]',
  p2: 'text-[#fb923c]',
  p3: 'text-[#fbbf24]',
  p4: 'text-[var(--text-muted)]',
};

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Investigation[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('investigations')
        .select('*')
        .in('status', ['open', 'investigating', 'escalated'])
        .order('created_at', { ascending: false })
        .limit(5);
      setAlerts(data ?? []);
    };
    load();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hasAlerts = alerts.length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg transition-colors"
        style={{ color: 'var(--text-secondary)', background: open ? 'var(--bg-elevated)' : 'transparent' }}
      >
        <Bell className="h-4.5 w-4.5 h-[18px] w-[18px]" />
        {hasAlerts && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--danger)]" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 rounded-xl overflow-hidden shadow-2xl z-50"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Active Alerts</span>
              {hasAlerts && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {alerts.length}
                </span>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No active alerts
                </div>
              ) : (
                alerts.map((a) => (
                  <Link
                    key={a.id}
                    to={`/investigations/${a.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-surface)]"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <span className={`text-xs font-bold ${SEV_COLOR[a.severity] ?? ''}`}>
                        {a.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                      <p className="text-xs font-mono truncate" style={{ color: 'var(--text-muted)' }}>{a.service}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{timeAgo(a.created_at)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="px-4 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
              <Link
                to="/investigations"
                onClick={() => setOpen(false)}
                className="text-xs font-medium transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                View all investigations →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
