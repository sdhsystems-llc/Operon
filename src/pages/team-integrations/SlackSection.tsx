import { useState } from 'react';
import { CheckCircle2, Zap, Edit2, Save, X, Send } from 'lucide-react';
import { NotificationToggles } from './NotificationToggles';
import {
  DEFAULT_CHANNEL_ROUTES,
  DEFAULT_NOTIFICATION_SETTINGS,
  SEVERITY_LABELS,
} from './types';
import type { TeamIntegrationRow, NotificationSettings, ChannelRoute } from './types';

interface Props {
  integration: TeamIntegrationRow | null;
  onSave: (data: Partial<TeamIntegrationRow>) => Promise<void>;
  onToast: (msg: string) => void;
}

export const SlackSection = ({ integration, onSave, onToast }: Props) => {
  const connected = integration?.connected ?? false;
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [routes, setRoutes] = useState<ChannelRoute[]>(
    integration?.channel_routes?.length ? integration.channel_routes : DEFAULT_CHANNEL_ROUTES
  );
  const [editingRoute, setEditingRoute] = useState<string | null>(null);
  const [editChannel, setEditChannel] = useState('');

  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(
    integration?.notification_settings && Object.keys(integration.notification_settings).length
      ? integration.notification_settings
      : DEFAULT_NOTIFICATION_SETTINGS
  );

  const handleConnect = async () => {
    setConnecting(true);
    await new Promise((r) => setTimeout(r, 1500));
    await onSave({
      connected: true,
      workspace_name: 'Operon Demo Workspace',
      channel_routes: routes,
      notification_settings: notifSettings,
    });
    setConnecting(false);
    onToast('Slack workspace connected successfully');
  };

  const handleDisconnect = async () => {
    await onSave({ connected: false, workspace_name: '' });
    onToast('Slack workspace disconnected');
  };

  const handleTestConnection = async () => {
    setTesting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setTesting(false);
    onToast('Test message sent to #incidents-critical');
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    await onSave({ channel_routes: routes, notification_settings: notifSettings });
    setSaving(false);
    onToast('Slack settings saved');
  };

  const startEditRoute = (severity: string, channel: string) => {
    setEditingRoute(severity);
    setEditChannel(channel);
  };

  const saveRoute = (severity: string) => {
    setRoutes((prev) =>
      prev.map((r) => (r.severity === severity ? { ...r, channel: editChannel } : r))
    );
    setEditingRoute(null);
  };

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#4A154B]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#4A154B"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-secondary-900">Slack</h2>
              {connected && integration?.workspace_name ? (
                <p className="text-xs text-secondary-500 mt-0.5">{integration.workspace_name}</p>
              ) : (
                <p className="text-xs text-secondary-500 mt-0.5">Not connected</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {connected && (
              <>
                <span className="flex items-center gap-1.5 text-xs font-medium text-success-600 bg-success-50 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-success-500 rounded-full" />
                  Connected
                </span>
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="btn-secondary text-xs"
                >
                  {testing ? (
                    <span className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 border-2 border-secondary-400 border-t-secondary-700 rounded-full animate-spin" />
                      Testing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Send className="h-3.5 w-3.5" />
                      Test Connection
                    </span>
                  )}
                </button>
                <button onClick={handleDisconnect} className="btn-secondary text-xs text-error-600 hover:bg-error-50">
                  Disconnect
                </button>
              </>
            )}
            {!connected && (
              <button onClick={handleConnect} disabled={connecting} className="btn-primary">
                {connecting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Connecting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Connect Workspace
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {!connected && (
          <div className="bg-secondary-50 rounded-lg px-4 py-3 text-sm text-secondary-600">
            Connect your Slack workspace to receive incident notifications and route alerts to the right channels automatically.
          </div>
        )}

        {connected && (
          <div className="pt-3 border-t border-secondary-100">
            <p className="text-xs text-secondary-500">
              Connected {integration?.updated_at ? new Date(integration.updated_at).toLocaleDateString() : ''}
            </p>
          </div>
        )}
      </div>

      {connected && (
        <>
          <div className="card p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-secondary-900">Channel Routing Rules</h3>
              <p className="text-xs text-secondary-500 mt-0.5">
                Route alerts to different Slack channels based on incident severity
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-secondary-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary-50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-secondary-500 uppercase tracking-wide w-1/3">
                      Severity
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Channel
                    </th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {routes.map((route) => {
                    const sev = SEVERITY_LABELS[route.severity];
                    const isEditing = editingRoute === route.severity;
                    return (
                      <tr key={route.severity} className="hover:bg-secondary-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${sev?.color}`}>
                            {sev?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editChannel}
                                onChange={(e) => setEditChannel(e.target.value)}
                                className="input-field text-sm py-1 h-8"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveRoute(route.severity);
                                  if (e.key === 'Escape') setEditingRoute(null);
                                }}
                              />
                              <button onClick={() => saveRoute(route.severity)} className="p-1.5 text-success-600 hover:bg-success-50 rounded transition-colors">
                                <Save className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setEditingRoute(null)} className="p-1.5 text-secondary-400 hover:bg-secondary-100 rounded transition-colors">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <code className="text-xs font-mono text-secondary-700 bg-secondary-100 px-2 py-0.5 rounded">
                              {route.channel}
                            </code>
                          )}
                        </td>
                        <td className="px-2 py-3">
                          {!isEditing && (
                            <button
                              onClick={() => startEditRoute(route.severity, route.channel)}
                              className="p-1.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-secondary-900">Notification Events</h3>
              <p className="text-xs text-secondary-500 mt-0.5">
                Choose which events trigger Slack notifications
              </p>
            </div>
            <NotificationToggles settings={notifSettings} onChange={setNotifSettings} />
          </div>

          <div className="flex justify-end">
            <button onClick={handleSaveSettings} disabled={saving} className="btn-primary">
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Save Slack Settings
                </span>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
