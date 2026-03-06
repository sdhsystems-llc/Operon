import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Investigation } from '../../types/database.types';
import { MOCK_INVESTIGATIONS } from '../../lib/mockData';

const SEV: Record<string, { label: string; color: string; bg: string; border: string }> = {
  p1: { label: 'P1', color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  p2: { label: 'P2', color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.25)' },
  p3: { label: 'P3', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)' },
  p4: { label: 'P4', color: '#818cf8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)' },
};

const STS: Record<string, { label: string; color: string; dot: string }> = {
  open:          { label: 'Open',          color: '#94a3b8', dot: '#64748b' },
  investigating: { label: 'Investigating', color: '#fbbf24', dot: '#f59e0b' },
  resolved:      { label: 'Resolved',      color: '#34d399', dot: '#10b981' },
  escalated:     { label: 'Escalated',     color: '#f87171', dot: '#ef4444' },
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const LiveIncidentFeed = () => {
  const [incidents, setIncidents] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    const { data } = await supabase
      .from('investigations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    setIncidents((data && data.length > 0 ? data : MOCK_INVESTIGATIONS.slice(0, 10)) as unknown as Investigation[]);
    setLastUpdated(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 30000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="card">
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Live Incident Feed</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Updated {timeAgo(lastUpdated.toISOString())} · auto-refreshes every 30s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => load(true)} disabled={refreshing}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link to="/investigations" className="text-xs font-medium flex items-center gap-1 transition-colors"
            style={{ color: 'var(--accent)' }}>
            View all
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center gap-3">
              <div className="skeleton w-8 h-5 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3.5 w-3/4" />
                <div className="skeleton h-3 w-1/3" />
              </div>
              <div className="skeleton w-14 h-3" />
            </div>
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          No incidents found. System is clear.
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {incidents.map((inc) => {
            const sev = SEV[inc.severity] ?? SEV.p4;
            const sts = STS[inc.status] ?? STS.open;
            return (
              <Link
                key={inc.id}
                to={`/investigations/${inc.id}`}
                state={{ from: { label: 'Overview', to: '/' } }}
                className="flex items-start gap-3 px-4 py-2 transition-colors group"
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-elevated)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
              >
                <span className="flex-shrink-0 mt-0.5 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>
                  {sev.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate transition-colors" style={{ color: 'var(--text-primary)' }}>
                    {inc.title}
                  </p>
                  <p className="text-xs mt-0.5 font-mono truncate" style={{ color: 'var(--text-muted)' }}>{inc.service}</p>
                </div>
                <div className="flex-shrink-0 text-right space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium justify-end" style={{ color: sts.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: sts.dot }} />
                    {sts.label}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(inc.created_at)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
