import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Investigation } from '../types/database.types';
import { Breadcrumb } from '../components/Breadcrumb';
import { EmptyState } from '../components/EmptyState';
import { SkeletonTableRow } from '../components/Skeleton';
import {
  Plus,
  Search,
  AlertTriangle,
  Bot,
  Clock,
  ChevronRight,
  Filter,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

type StatusFilter = 'all' | 'open' | 'investigating' | 'resolved' | 'escalated';
type SeverityFilter = 'all' | 'p1' | 'p2' | 'p3' | 'p4';
type SortKey = 'severity' | 'title' | 'status' | 'created_at' | 'duration_minutes';
type SortDir = 'asc' | 'desc';

const SEV_ORDER: Record<string, number> = { p1: 0, p2: 1, p3: 2, p4: 3 };
const STATUS_ORDER: Record<string, number> = { escalated: 0, investigating: 1, open: 2, resolved: 3 };

const getSeverityConfig = (severity: string) => {
  const cfg: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    p1: { label: 'P1', bg: 'rgba(239,68,68,0.12)', text: '#f87171', dot: '#ef4444' },
    p2: { label: 'P2', bg: 'rgba(251,146,60,0.12)', text: '#fb923c', dot: '#f97316' },
    p3: { label: 'P3', bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', dot: '#f59e0b' },
    p4: { label: 'P4', bg: 'rgba(99,102,241,0.12)', text: '#818cf8', dot: '#6366f1' },
  };
  return cfg[severity] ?? cfg.p4;
};

const getStatusConfig = (status: string) => {
  const cfg: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    open: { label: 'Open', bg: 'rgba(100,116,139,0.12)', text: '#94a3b8', dot: '#64748b' },
    investigating: { label: 'Investigating', bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', dot: '#f59e0b' },
    resolved: { label: 'Resolved', bg: 'rgba(16,185,129,0.12)', text: '#34d399', dot: '#10b981' },
    escalated: { label: 'Escalated', bg: 'rgba(239,68,68,0.12)', text: '#f87171', dot: '#ef4444' },
  };
  return cfg[status] ?? cfg.open;
};

const formatDuration = (minutes: number | null) => {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const SortIcon = ({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) => {
  if (col !== sortKey) return <ChevronsUpDown className="h-3 w-3 ml-1 opacity-30" />;
  return sortDir === 'asc'
    ? <ChevronUp className="h-3 w-3 ml-1" style={{ color: 'var(--accent)' }} />
    : <ChevronDown className="h-3 w-3 ml-1" style={{ color: 'var(--accent)' }} />;
};

const TH = ({ col, label, sortKey, sortDir, onSort, className = '' }: {
  col: SortKey; label: string; sortKey: SortKey; sortDir: SortDir; onSort: (k: SortKey) => void; className?: string;
}) => (
  <th
    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none ${className}`}
    style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}
    onClick={() => onSort(col)}
  >
    <span className="inline-flex items-center">
      {label}
      <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
    </span>
  </th>
);

export const InvestigationsPage = () => {
  const navigate = useNavigate();
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('investigations').select('*').order('created_at', { ascending: false });
      setInvestigations(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    setSortDir((d) => (sortKey === key ? (d === 'asc' ? 'desc' : 'asc') : 'desc'));
    setSortKey(key);
  }, [sortKey]);

  const filtered = investigations
    .filter((inv) => {
      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
      const matchSev = severityFilter === 'all' || inv.severity === severityFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || inv.title.toLowerCase().includes(q) || inv.service.toLowerCase().includes(q) || (inv.assigned_agent ?? '').toLowerCase().includes(q);
      return matchStatus && matchSev && matchSearch;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'severity') cmp = (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9);
      else if (sortKey === 'status') cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      else if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortKey === 'created_at') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortKey === 'duration_minutes') cmp = (a.duration_minutes ?? 0) - (b.duration_minutes ?? 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const counts = {
    all: investigations.length,
    open: investigations.filter((i) => i.status === 'open').length,
    investigating: investigations.filter((i) => i.status === 'investigating').length,
    resolved: investigations.filter((i) => i.status === 'resolved').length,
    escalated: investigations.filter((i) => i.status === 'escalated').length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <Breadcrumb crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Investigations' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Investigations</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            AI-powered root cause analysis and incident management
          </p>
        </div>
        <button onClick={() => navigate('/investigations/new')} className="btn-primary">
          <Plus className="h-4 w-4" />
          New Investigation
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'P1 Critical', count: investigations.filter((i) => i.severity === 'p1').length, color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
          { label: 'P2 High', count: investigations.filter((i) => i.severity === 'p2').length, color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.2)' },
          { label: 'Active', count: counts.investigating + counts.open, color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
          { label: 'Resolved', count: counts.resolved, color: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4" style={{ background: stat.bg, borderColor: stat.border }}>
            <p className="text-2xl font-bold tabular-nums" style={{ color: stat.color }}>{stat.count}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 space-y-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by title, service, or agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
                className="input-field"
              >
                <option value="all">All Severities</option>
                <option value="p1">P1 Critical</option>
                <option value="p2">P2 High</option>
                <option value="p3">P3 Medium</option>
                <option value="p4">P4 Low</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {(['all', 'open', 'investigating', 'resolved', 'escalated'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize"
                style={statusFilter === s
                  ? { background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }
                  : { background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                }
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}{' '}
                <span className="ml-1 opacity-60">{s === 'all' ? counts.all : counts[s as keyof typeof counts]}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <table className="w-full">
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonTableRow key={i} />)}
            </tbody>
          </table>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle className="h-8 w-8" />}
            title="No investigations found"
            description={searchQuery || statusFilter !== 'all' || severityFilter !== 'all'
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Get started by creating your first AI-powered investigation.'}
            action={(!searchQuery && statusFilter === 'all' && severityFilter === 'all')
              ? { label: 'New Investigation', onClick: () => navigate('/investigations/new') }
              : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <TH col="severity" label="Sev" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <TH col="title" label="Title / Service" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <TH col="status" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell"
                    style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}>Agent</th>
                  <TH col="duration_minutes" label="Duration" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                  <TH col="created_at" label="Opened" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                  <th className="px-4 py-3" style={{ background: 'var(--bg-elevated)' }} />
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {filtered.map((inv) => {
                  const sev = getSeverityConfig(inv.severity);
                  const st = getStatusConfig(inv.status);
                  return (
                    <tr
                      key={inv.id}
                      className="transition-colors cursor-pointer group"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-elevated)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                      onClick={() => navigate(`/investigations/${inv.id}`)}
                    >
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: sev.bg, color: sev.text }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: sev.dot }} />
                          {sev.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>{inv.title}</p>
                        <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{inv.service}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ background: st.bg, color: st.text }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        {inv.assigned_agent ? (
                          <div className="flex items-center gap-1.5">
                            <Bot className="h-3.5 w-3.5" style={{ color: '#818cf8' }} />
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{inv.assigned_agent}</span>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(inv.duration_minutes)}
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(inv.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--text-muted)' }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
