import type { Provider, ProviderStatus } from './providerConfig';
import { CATEGORY_COLORS, CATEGORY_TEXT } from './providerConfig';
import { ProviderLogo } from './ProviderLogo';
import { CheckCircle2, Clock, Loader, Unplug, Settings, Plug } from 'lucide-react';

interface IntegrationRecord {
  id: string;
  status: string;
  last_sync_at: string | null;
  events_today?: number;
  config?: Record<string, any>;
}

interface Props {
  provider: Provider;
  record?: IntegrationRecord;
  onConfigure: () => void;
  onDisconnect: (id: string) => void;
}

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  return `${Math.floor(m / 60)}h ago`;
};

const getStatus = (record?: IntegrationRecord): ProviderStatus => {
  if (!record) return 'not_connected';
  if (record.status === 'inactive') return 'pending';
  return 'connected';
};

const STATUS_CFG = {
  connected: {
    label: 'Connected',
    color: '#34d399',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.25)',
    dot: '#10b981',
    pulse: true,
  },
  pending: {
    label: 'Pending',
    color: '#fbbf24',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.25)',
    dot: '#f59e0b',
    pulse: false,
  },
  not_connected: {
    label: 'Not Connected',
    color: 'var(--text-muted)',
    bg: 'var(--bg-elevated)',
    border: 'var(--border)',
    dot: '#475569',
    pulse: false,
  },
};

export const IntegrationCard = ({ provider, record, onConfigure, onDisconnect }: Props) => {
  const status = getStatus(record);
  const scfg = STATUS_CFG[status];
  const catBg = CATEGORY_COLORS[provider.category] ?? 'rgba(99,102,241,0.1)';
  const catTxt = CATEGORY_TEXT[provider.category] ?? '#818cf8';

  return (
    <div
      className="card flex flex-col h-full transition-all duration-200"
      style={{ cursor: 'default' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#2d3050'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
    >
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: `${provider.color}18`, border: `1px solid ${provider.color}30` }}>
              <ProviderLogo id={provider.id} size={26} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{provider.name}</p>
              <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: catBg, color: catTxt }}>{provider.category}</span>
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: scfg.bg, color: scfg.color, border: `1px solid ${scfg.border}` }}>
            <span className={`w-1.5 h-1.5 rounded-full ${scfg.pulse ? 'animate-pulse' : ''}`}
              style={{ background: scfg.dot }} />
            {scfg.label}
          </div>
        </div>

        <p className="text-xs leading-relaxed flex-1 mb-4" style={{ color: 'var(--text-muted)' }}>
          {provider.description}
        </p>

        {status === 'connected' && record?.last_sync_at && (
          <div className="mb-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              Last synced: <span style={{ color: 'var(--text-secondary)' }}>{timeAgo(record.last_sync_at)}</span>
            </div>
            {(record.events_today ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#34d399' }} />
                <span style={{ color: 'var(--text-secondary)' }}>{record.events_today?.toLocaleString()} events today</span>
              </div>
            )}
          </div>
        )}

        {status === 'pending' && (
          <div className="mb-4 flex items-center gap-1.5 text-xs" style={{ color: '#fbbf24' }}>
            <Loader className="h-3.5 w-3.5 animate-spin" />
            Awaiting credentials
          </div>
        )}
      </div>

      <div className="px-5 pb-5">
        {status === 'connected' ? (
          <div className="flex gap-2">
            <button onClick={onConfigure}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2d3050'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}>
              <Settings className="h-3.5 w-3.5" />
              Configure
            </button>
            <button onClick={() => record && onDisconnect(record.id)}
              className="py-2 px-3 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; }}>
              <Unplug className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : status === 'pending' ? (
          <button onClick={onConfigure}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,158,11,0.2)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,158,11,0.12)'; }}>
            <Settings className="h-3.5 w-3.5" />
            Complete Setup
          </button>
        ) : (
          <button onClick={onConfigure}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'var(--accent)', color: 'white' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#4f51e8'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'; }}>
            <Plug className="h-3.5 w-3.5" />
            Connect
          </button>
        )}
      </div>
    </div>
  );
};
