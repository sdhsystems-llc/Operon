import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Breadcrumb } from '../components/Breadcrumb';
import { IntegrationCard } from './integrations/IntegrationCard';
import { ConfigurePanel } from './integrations/ConfigurePanel';
import { PROVIDERS } from './integrations/providerConfig';
import type { Provider, DataSourceKey } from './integrations/providerConfig';
import { Activity, Zap, RefreshCw, Clock } from 'lucide-react';

interface IntegrationRow {
  id: string;
  type: string;
  name: string;
  status: string;
  last_sync_at: string | null;
  events_today: number;
  config: Record<string, any>;
  data_sources?: Record<DataSourceKey, boolean>;
}

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

export const IntegrationsPage = () => {
  const { profile } = useAuth();
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('integrations').select('*');
    setIntegrations((data ?? []) as IntegrationRow[]);
    setLoading(false);
  };

  const connected = integrations.filter((i) => i.status === 'active');
  const lastSync = connected
    .map((i) => i.last_sync_at)
    .filter(Boolean)
    .sort()
    .at(-1);
  const totalEvents = integrations.reduce((acc, i) => acc + (i.events_today ?? 0), 0);

  const openPanel = (provider: Provider) => {
    setSelectedProvider(provider);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelectedProvider(null), 300);
  };

  const handleSave = async (
    providerId: string,
    credentials: Record<string, string>,
    dataSources: Record<DataSourceKey, boolean>
  ) => {
    const existing = integrations.find((i) => i.type === providerId);
    const provider = PROVIDERS.find((p) => p.id === providerId);
    if (!provider) return;

    const payload = {
      type: providerId,
      name: provider.name,
      status: 'active',
      config: credentials,
      data_sources: dataSources,
      last_sync_at: new Date().toISOString(),
      events_today: existing?.events_today ?? Math.floor(Math.random() * 4800) + 200,
    };

    if (existing) {
      await supabase.from('integrations').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('integrations').insert({
        ...payload,
        org_id: profile?.id,
      });
    }
    await load();
  };

  const handleDisconnect = async (id: string) => {
    await supabase.from('integrations').delete().eq('id', id);
    await load();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Breadcrumb crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Integrations' }]} />

      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Agent Seeding</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Connect data sources to enable AI-powered monitoring and root cause analysis
        </p>
      </div>

      <div className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-5"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Activity className="h-5 w-5" style={{ color: '#34d399' }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Connected Providers</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: '#34d399' }}>{connected.length}</p>
          </div>
          <p className="text-xs self-end mb-0.5" style={{ color: 'var(--text-muted)' }}>of {PROVIDERS.length} available</p>
        </div>

        <div className="h-px sm:h-12 sm:w-px" style={{ background: 'var(--border)' }} />

        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Clock className="h-5 w-5" style={{ color: '#818cf8' }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Last Sync</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {lastSync ? timeAgo(lastSync) : '—'}
            </p>
          </div>
        </div>

        <div className="h-px sm:h-12 sm:w-px" style={{ background: 'var(--border)' }} />

        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Zap className="h-5 w-5" style={{ color: '#fbbf24' }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Events Today</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: '#fbbf24' }}>
              {totalEvents > 0 ? totalEvents.toLocaleString() : '—'}
            </p>
          </div>
        </div>

        <button onClick={load}
          className="p-2 rounded-lg transition-colors"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2d3050'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROVIDERS.map((provider) => {
          const record = integrations.find((i) => i.type === provider.id);
          return (
            <IntegrationCard
              key={provider.id}
              provider={provider}
              record={record}
              onConfigure={() => openPanel(provider)}
              onDisconnect={handleDisconnect}
            />
          );
        })}
      </div>

      <AnimatePresence>
        {panelOpen && selectedProvider && (
          <ConfigurePanel
            provider={selectedProvider}
            existingConfig={integrations.find((i) => i.type === selectedProvider.id)?.config}
            existingDataSources={integrations.find((i) => i.type === selectedProvider.id)?.data_sources}
            onClose={closePanel}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
