import { AlertTriangle, Clock, Gauge, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { DashboardMetrics } from './types';

interface Props {
  metrics: DashboardMetrics;
  loading: boolean;
}

const DonutHealth = ({ pct, degraded, critical }: { pct: number; degraded: number; critical: number }) => {
  const data = [
    { name: 'Healthy', value: pct },
    { name: 'Degraded', value: degraded },
    { name: 'Critical', value: critical },
  ].filter((d) => d.value > 0);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="relative w-16 h-16">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={22} outerRadius={30} paddingAngle={2} dataKey="value" strokeWidth={0}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
        {Math.round(pct)}%
      </span>
    </div>
  );
};

export const KpiCards = ({ metrics, loading }: Props) => {
  const { activeInvestigations, mttrMinutes, mttdMinutes, healthPct, healthDegraded, healthCritical } = metrics;

  const fmtMttr = () => {
    if (mttrMinutes == null) return '—';
    if (mttrMinutes < 60) return `${Math.round(mttrMinutes)}m`;
    return `${(mttrMinutes / 60).toFixed(1)}h`;
  };

  const activeColor = activeInvestigations > 0
    ? (activeInvestigations >= 3 ? '#f87171' : '#fbbf24')
    : 'var(--text-primary)';
  const activeBg = activeInvestigations > 0
    ? (activeInvestigations >= 3 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)')
    : 'var(--bg-elevated)';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="card p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Active Investigations</p>
            {loading
              ? <div className="skeleton h-8 w-16 mt-2" />
              : <p className="mt-2 text-3xl font-bold tabular-nums" style={{ color: activeColor }}>{activeInvestigations}</p>
            }
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>open right now</p>
          </div>
          <div className="p-2.5 rounded-lg" style={{ background: activeBg }}>
            <AlertTriangle className="h-5 w-5" style={{ color: activeColor }} />
          </div>
        </div>
        {activeInvestigations > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium" style={{ color: activeColor }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: activeColor }} />
            Needs attention
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>MTTR</p>
            {loading
              ? <div className="skeleton h-8 w-16 mt-2" />
              : <p className="mt-2 text-3xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{fmtMttr()}</p>
            }
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>mean time to resolve</p>
          </div>
          <div className="p-2.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <Clock className="h-5 w-5" style={{ color: 'var(--accent)' }} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium" style={{ color: '#34d399' }}>
          <Zap className="h-3 w-3" />
          AI-assisted resolution
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>MTTD</p>
            <p className="mt-2 text-3xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {loading ? <span className="skeleton inline-block h-8 w-16" /> : `${mttdMinutes}m`}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>mean time to detect</p>
          </div>
          <div className="p-2.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <Gauge className="h-5 w-5" style={{ color: '#34d399' }} />
          </div>
        </div>
        <div className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>avg across all services</div>
      </div>

      <div className="card p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>System Health</p>
            {loading
              ? <div className="skeleton h-8 w-16 mt-2" />
              : <p className="mt-2 text-3xl font-bold tabular-nums"
                  style={{ color: healthPct >= 95 ? '#34d399' : healthPct >= 80 ? '#fbbf24' : '#f87171' }}>
                  {healthPct.toFixed(1)}%
                </p>
            }
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>overall uptime</p>
          </div>
          {!loading && <DonutHealth pct={healthPct} degraded={healthDegraded} critical={healthCritical} />}
        </div>
      </div>
    </div>
  );
};
