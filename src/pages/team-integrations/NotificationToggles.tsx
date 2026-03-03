import { NOTIFICATION_EVENTS } from './types';
import type { NotificationSettings } from './types';

interface Props {
  settings: NotificationSettings;
  onChange: (settings: NotificationSettings) => void;
}

export const NotificationToggles = ({ settings, onChange }: Props) => {
  const toggle = (key: keyof NotificationSettings) => {
    onChange({ ...settings, [key]: !settings[key] });
  };

  return (
    <div className="space-y-3">
      {NOTIFICATION_EVENTS.map(({ key, label, description }) => (
        <div key={key} className="flex items-start justify-between gap-4 py-3 border-b border-secondary-100 last:border-0">
          <div className="min-w-0">
            <p className="text-sm font-medium text-secondary-900">{label}</p>
            <p className="text-xs text-secondary-500 mt-0.5">{description}</p>
          </div>
          <button
            type="button"
            onClick={() => toggle(key)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              settings[key] ? 'bg-primary-600' : 'bg-secondary-200'
            }`}
            role="switch"
            aria-checked={settings[key]}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings[key] ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
};
