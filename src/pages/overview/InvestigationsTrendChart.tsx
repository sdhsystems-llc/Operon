import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { DayBucket } from './types';

interface Props {
  data: DayBucket[];
  loading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="text-xs px-3 py-2 rounded-lg shadow-lg"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
      <p className="font-medium">{label}</p>
      <p style={{ color: 'var(--text-muted)' }}>{payload[0].value} investigations</p>
    </div>
  );
};

export const InvestigationsTrendChart = ({ data, loading }: Props) => (
  <div className="card p-5 h-full">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Investigations — Last 7 Days</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>All statuses combined</p>
      </div>
    </div>

    {loading ? (
      <div className="h-40 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'var(--accent)' }} />
      </div>
    ) : (
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="investGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2133" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#1f2133' }} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#investGrad)"
            dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    )}
  </div>
);
