import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { ServiceBucket } from './types';

interface Props {
  data: ServiceBucket[];
  loading: boolean;
}

const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="text-xs px-3 py-2 rounded-lg shadow-lg"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
      <p className="font-medium">{label}</p>
      <p style={{ color: 'var(--text-muted)' }}>{payload[0].value} incidents</p>
    </div>
  );
};

export const IncidentsByServiceChart = ({ data, loading }: Props) => (
  <div className="card p-5 h-full">
    <div className="mb-4">
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Incidents by Service</h3>
      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Top 5 services by incident count</p>
    </div>

    {loading ? (
      <div className="h-40 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'var(--accent)' }} />
      </div>
    ) : data.length === 0 ? (
      <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>No data yet</div>
    ) : (
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2133" vertical={false} />
          <XAxis dataKey="service" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>
);
