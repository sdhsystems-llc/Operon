import { useState } from 'react';
import { Save, Copy, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { NotificationToggles } from './NotificationToggles';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  TEAMS_CHANNELS,
} from './types';
import type { TeamIntegrationRow, NotificationSettings } from './types';

interface Props {
  integration: TeamIntegrationRow | null;
  onSave: (data: Partial<TeamIntegrationRow>) => Promise<void>;
  onToast: (msg: string) => void;
}

const MOCK_WEBHOOK_URL = 'https://operon.app/webhooks/teams/ms-inbound/a1b2c3d4e5f6';

export const TeamsSection = ({ integration, onSave, onToast }: Props) => {
  const [tenantId, setTenantId] = useState(integration?.tenant_id ?? '');
  const [botToken, setBotToken] = useState(integration?.bot_token ?? '');
  const [showToken, setShowToken] = useState(false);
  const [defaultChannel, setDefaultChannel] = useState(integration?.default_channel ?? 'Incidents');
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(
    integration?.notification_settings && Object.keys(integration.notification_settings).length
      ? integration.notification_settings
      : DEFAULT_NOTIFICATION_SETTINGS
  );
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const connected = !!(integration?.tenant_id && integration.tenant_id.length > 0);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      connected: !!(tenantId && botToken),
      tenant_id: tenantId,
      bot_token: botToken,
      webhook_url: MOCK_WEBHOOK_URL,
      default_channel: defaultChannel,
      notification_settings: notifSettings,
    });
    setSaving(false);
    onToast('Microsoft Teams settings saved');
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(MOCK_WEBHOOK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#6264A7]/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#6264A7">
              <path d="M20.625 7.5H13.5v8.625c0 .207-.168.375-.375.375H8.25A3.75 3.75 0 0 1 4.5 12.75V9h-.75A2.25 2.25 0 0 0 1.5 11.25v5.25A2.25 2.25 0 0 0 3.75 18.75h7.125L13.5 21v-2.25h1.125A2.25 2.25 0 0 0 16.875 16.5V9.75h3.75a.375.375 0 0 0 .375-.375V7.875A.375.375 0 0 0 20.625 7.5z"/>
              <path d="M13.5 3.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5zM4.5 6.375a1.875 1.875 0 1 0 0 3.75 1.875 1.875 0 0 0 0-3.75zM8.25 4.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-secondary-900">Microsoft Teams</h2>
            <p className="text-xs text-secondary-500 mt-0.5">
              {connected ? `Tenant: ${tenantId}` : 'Configure with your Azure tenant credentials'}
            </p>
          </div>
          {connected && (
            <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-success-600 bg-success-50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-success-500 rounded-full" />
              Configured
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
              Tenant ID
            </label>
            <input
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="input-field font-mono text-sm"
            />
            <p className="text-xs text-secondary-400 mt-1">
              Found in Azure Portal → Azure Active Directory → Properties
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
              Bot Token
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="Enter your bot token"
                className="input-field font-mono text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-secondary-400 mt-1">
              Your Teams bot application token from Azure Bot Service
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1.5">
              Default Channel
            </label>
            <select
              value={defaultChannel}
              onChange={(e) => setDefaultChannel(e.target.value)}
              className="input-field"
            >
              {TEAMS_CHANNELS.map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-secondary-900">Incoming Webhook URL</h3>
          <p className="text-xs text-secondary-500 mt-0.5">
            Add this URL in your Teams channel connector settings to receive notifications
          </p>
        </div>
        <div className="flex items-center gap-2 bg-secondary-50 rounded-lg px-3 py-2.5 border border-secondary-200">
          <code className="text-xs font-mono text-secondary-700 flex-1 truncate">
            {MOCK_WEBHOOK_URL}
          </code>
          <button
            onClick={handleCopyWebhook}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-800 transition-colors"
          >
            {copied ? (
              <span className="flex items-center gap-1 text-success-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Copied
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Copy className="h-3.5 w-3.5" />
                Copy
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-secondary-900">Notification Events</h3>
          <p className="text-xs text-secondary-500 mt-0.5">
            Choose which events trigger Teams notifications
          </p>
        </div>
        <NotificationToggles settings={notifSettings} onChange={setNotifSettings} />
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Teams Settings
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
