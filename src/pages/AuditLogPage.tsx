import { useState, useMemo } from 'react';
import { Shield, Filter, User, Cpu, Search, ChevronDown } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { generateMockAuditEntries } from './audit/mockAuditData';
import type { AuditEntry } from './audit/mockAuditData';

const ALL_ENTRIES = generateMockAuditEntries();

const ACTION_CATEGORIES = [
  'all', 'auth', 'investigation', 'integration', 'config',
  'agent', 'apikey', 'member', 'knowledge', 'alert', 'feature_flag',
];

const ACTION_BADGE: Record<string, { bg: string; color: string }> = {
  auth:          { bg: 'rgba(16,185,129,0.1)',  color: '#6ee7b7' },
  investigation: { bg: 'rgba(59,130,246,0.1)',  color: '#93c5fd' },
  integration:   { bg: 'rgba(245,158,11,0.1)',  color: '#fcd34d' },
  config:        { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' },
  agent:         { bg: 'rgba(99,102,241,0.12)', color: '#818cf8' },
  apikey:        { bg: 'rgba(239,68,68,0.1)',   color: '#fca5a5' },
  member:        { bg: 'rgba(16,185,129,0.1)',  color: '#6ee7b7' },
  knowledge:     { bg: 'rgba(6,182,212,0.1)',   color: '#67e8f9' },
  alert:         { bg: 'rgba(239,68,68,0.12)',  color: '#fca5a5' },
  feature_flag:  { bg: 'rgba(245,158,11,0.1)',  color: '#fcd34d' },
};

const getActionCategory = (action: string) => action.split('.')[0];

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
};

const DATE_RANGES = [
  { label: 'Last 1 hour', ms: 3600000 },
  { label: 'Last 6 hours', ms: 21600000 },
  { label: 'Last 24 hours', ms: 86400000 },
  { label: 'Last 7 days', ms: 604800000 },
  { label: 'All time', ms: Infinity },
];

export const AuditLogPage = () => {
  const [search, setSearch] = useState('');
  const [actorFilter, setActorFilter] = useState<'all' | 'human' | 'agent'>('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRangeIdx, setDateRangeIdx] = useState(4);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const cutoff = DATE_RANGES[dateRangeIdx].ms === Infinity
      ? 0
      : Date.now() - DATE_RANGES[dateRangeIdx].ms;

    return ALL_ENTRIES.filter((e: AuditEntry) => {
      if (actorFilter !== 'all' && e.actor_type !== actorFilter) return false;
      if (actionFilter !== 'all' && getActionCategory(e.action) !== actionFilter) return false;
      if (cutoff && new Date(e.created_at).getTime() < cutoff) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.actor_name.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          e.resource_name.toLowerCase().includes(q) ||
          e.resource_type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, actorFilter, actionFilter, dateRangeIdx]);

  return (
    <PageTransition>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Audit Log</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Complete record of all system events
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <Shield className="h-3.5 w-3.5" />
            {filtered.length} events
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2.5 rounded-lg"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actors, actions, resources..."
              className="flex-1 bg-transparent text-xs outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: showFilters ? 'rgba(99,102,241,0.12)' : 'var(--bg-surface)',
              border: `1px solid ${showFilters ? 'var(--accent)' : 'var(--border)'}`,
              color: showFilters ? '#818cf8' : 'var(--text-secondary)',
            }}>
            <Filter className="h-3.5 w-3.5" />
            Filters
            <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 px-4 py-4 rounded-xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Actor Type
              </p>
              <div className="flex gap-1.5">
                {(['all', 'human', 'agent'] as const).map((v) => (
                  <button key={v} onClick={() => setActorFilter(v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
                    style={{
                      background: actorFilter === v ? 'rgba(99,102,241,0.12)' : 'var(--bg-elevated)',
                      border: `1px solid ${actorFilter === v ? 'var(--accent)' : 'var(--border)'}`,
                      color: actorFilter === v ? '#818cf8' : 'var(--text-secondary)',
                    }}>
                    {v === 'human' ? <User className="h-3 w-3" /> : v === 'agent' ? <Cpu className="h-3 w-3" /> : null}
                    {v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Action Type
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ACTION_CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setActionFilter(c)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
                    style={{
                      background: actionFilter === c ? 'rgba(99,102,241,0.12)' : 'var(--bg-elevated)',
                      border: `1px solid ${actionFilter === c ? 'var(--accent)' : 'var(--border)'}`,
                      color: actionFilter === c ? '#818cf8' : 'var(--text-secondary)',
                    }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Date Range
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DATE_RANGES.map((r, i) => (
                  <button key={r.label} onClick={() => setDateRangeIdx(i)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: dateRangeIdx === i ? 'rgba(99,102,241,0.12)' : 'var(--bg-elevated)',
                      border: `1px solid ${dateRangeIdx === i ? 'var(--accent)' : 'var(--border)'}`,
                      color: dateRangeIdx === i ? '#818cf8' : 'var(--text-secondary)',
                    }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  {['Timestamp', 'Actor', 'Type', 'Action', 'Resource', 'IP Address'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold"
                      style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                      No events match your filters
                    </td>
                  </tr>
                ) : (
                  filtered.map((entry: AuditEntry) => {
                    const category = getActionCategory(entry.action);
                    const badge = ACTION_BADGE[category] || ACTION_BADGE.config;
                    return (
                      <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-elevated)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                        <td className="px-4 py-3 whitespace-nowrap tabular-nums"
                          style={{ color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace', fontSize: '11px' }}>
                          {formatTime(entry.created_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: entry.actor_type === 'human' ? 'rgba(59,130,246,0.15)' : 'rgba(99,102,241,0.15)' }}>
                              {entry.actor_type === 'human'
                                ? <User className="h-2.5 w-2.5" style={{ color: '#93c5fd' }} />
                                : <Cpu className="h-2.5 w-2.5" style={{ color: '#818cf8' }} />}
                            </div>
                            <span style={{ color: 'var(--text-primary)' }}>{entry.actor_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize"
                            style={{ background: entry.actor_type === 'human' ? 'rgba(59,130,246,0.1)' : 'rgba(99,102,241,0.1)',
                              color: entry.actor_type === 'human' ? '#93c5fd' : '#818cf8' }}>
                            {entry.actor_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md font-mono text-[11px]"
                            style={{ background: badge.bg, color: badge.color }}>
                            {entry.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{entry.resource_type}</span>
                          <span className="mx-1" style={{ color: 'var(--text-muted)' }}>/</span>
                          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{entry.resource_name}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px]"
                          style={{ color: entry.ip_address ? 'var(--text-muted)' : 'var(--text-muted)', opacity: entry.ip_address ? 1 : 0.4 }}>
                          {entry.ip_address || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
