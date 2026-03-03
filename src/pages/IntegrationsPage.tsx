import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Integration } from '../types/database'
import { formatDistanceToNow } from 'date-fns'
import { Plug, RefreshCw, Plus } from 'lucide-react'

const integrationIcons: Record<string, string> = {
  aws: '☁️',
  azure: '🔵',
  gcp: '🌐',
  datadog: '🐕',
  splunk: '🔍',
  grafana: '📊',
  pagerduty: '🚨',
  github: '🐙',
  launchdarkly: '🚩',
  slack: '💬',
  teams: '👥',
  newrelic: '📈',
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('integrations').select('*').order('created_at').then(({ data }) => {
      setIntegrations(data ?? [])
      setLoading(false)
    })
  }, [])

  const activeCount = integrations.filter(i => i.status === 'active').length

  if (loading) return <div className="flex items-center justify-center h-full"><div className="text-gray-500 text-sm">Loading...</div></div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Integrations</h1>
          <p className="text-sm text-gray-400 mt-0.5">{activeCount} connected · {integrations.length} total</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Integration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {integrations.map(integration => (
          <div key={integration.id} className="card p-5 hover:border-gray-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-lg">
                  {integrationIcons[integration.type] ?? '🔌'}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{integration.name}</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{integration.type}</p>
                </div>
              </div>
              <span className={integration.status === 'active' ? 'badge-active' : 'badge-idle'}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${integration.status === 'active' ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                {integration.status}
              </span>
            </div>

            {integration.last_sync_at && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Synced {formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })}</span>
              </div>
            )}

            {integration.data_sources && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(integration.data_sources).map(([key, enabled]) => (
                  <span
                    key={key}
                    className={`px-2 py-0.5 rounded text-xs border ${
                      enabled
                        ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50'
                        : 'bg-gray-800 text-gray-600 border-gray-700'
                    }`}
                  >
                    {key}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {integrations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Plug className="w-10 h-10 text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm">No integrations configured yet.</p>
        </div>
      )}
    </div>
  )
}
