import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MOCK_INVESTIGATIONS } from '../lib/mockData';
import { KpiCards } from './overview/KpiCards';
import { InvestigationsTrendChart } from './overview/InvestigationsTrendChart';
import { IncidentsByServiceChart } from './overview/IncidentsByServiceChart';
import { AgentActivityPanel } from './overview/AgentActivityPanel';
import { LiveIncidentFeed } from './overview/LiveIncidentFeed';
import type { DashboardMetrics, DayBucket, ServiceBucket } from './overview/types';
import type { Investigation } from '../types/database.types';

const buildDayBuckets = (investigations: Investigation[]): DayBucket[] => {
  const buckets: DayBucket[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    const count = investigations.filter((inv) => inv.created_at.slice(0, 10) === dateStr).length;
    buckets.push({ date: dateStr, label, count });
  }
  return buckets;
};

const buildServiceBuckets = (investigations: Investigation[]): ServiceBucket[] => {
  const map: Record<string, number> = {};
  for (const inv of investigations) {
    if (inv.service) map[inv.service] = (map[inv.service] ?? 0) + 1;
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([service, count]) => ({ service: service.replace(/-service$/, ''), count }));
};

const calcMttr = (investigations: Investigation[]): number | null => {
  const resolved = investigations.filter((i) => i.status === 'resolved' && i.duration_minutes != null);
  if (!resolved.length) return null;
  return resolved.reduce((sum, i) => sum + (i.duration_minutes ?? 0), 0) / resolved.length;
};

export const OverviewPage = () => {
  const [allInvestigations, setAllInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('investigations')
        .select('*')
        .order('created_at', { ascending: false });

      setAllInvestigations((data && data.length > 0 ? data : MOCK_INVESTIGATIONS) as any);
      setLoading(false);
    };
    load();
  }, []);

  const activeCount = allInvestigations.filter((i) => i.status === 'investigating' || i.status === 'open').length;

  const metrics: DashboardMetrics = {
    activeInvestigations: activeCount,
    mttrMinutes: calcMttr(allInvestigations),
    mttdMinutes: 1.8,
    healthPct: activeCount === 0 ? 99.2 : activeCount <= 2 ? 96.5 : 88.0,
    healthDegraded: activeCount === 0 ? 0.5 : activeCount <= 2 ? 2.5 : 7.0,
    healthCritical: activeCount === 0 ? 0.3 : activeCount <= 2 ? 1.0 : 5.0,
  };

  const dayBuckets = buildDayBuckets(allInvestigations);
  const serviceBuckets = buildServiceBuckets(allInvestigations);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Overview</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Real-time SRE dashboard &middot;{' '}
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <KpiCards metrics={metrics} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 grid grid-rows-2 gap-5">
          <InvestigationsTrendChart data={dayBuckets} loading={loading} />
          <IncidentsByServiceChart data={serviceBuckets} loading={loading} />
        </div>
        <div className="lg:col-span-1">
          <AgentActivityPanel />
        </div>
      </div>

      <LiveIncidentFeed />
    </div>
  );
};
