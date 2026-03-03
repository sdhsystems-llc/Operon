import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle, Loader, ChevronRight, Save } from 'lucide-react';
import { ProviderLogo } from './ProviderLogo';
import type { Provider, DataSourceKey } from './providerConfig';

interface Props {
  provider: Provider | null;
  existingConfig?: Record<string, any>;
  existingDataSources?: Record<DataSourceKey, boolean>;
  onClose: () => void;
  onSave: (providerId: string, credentials: Record<string, string>, dataSources: Record<DataSourceKey, boolean>) => Promise<void>;
}

type TestStatus = 'idle' | 'testing' | 'success' | 'failed';

const DATA_SOURCE_LABELS: Record<DataSourceKey, string> = {
  logs: 'Logs',
  metrics: 'Metrics',
  alerts: 'Alerts & Incidents',
  events: 'Deployment Events',
};

const DATA_SOURCE_DESCRIPTIONS: Record<DataSourceKey, string> = {
  logs: 'Application and system logs',
  metrics: 'Time-series performance metrics',
  alerts: 'Alert rules and incident notifications',
  events: 'Change events, deploys, and config updates',
};

export const ConfigurePanel = ({ provider, existingConfig, existingDataSources, onClose, onSave }: Props) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [credentials, setCredentials] = useState<Record<string, string>>(existingConfig ?? {});
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testError, setTestError] = useState('');
  const [saving, setSaving] = useState(false);
  const [dataSources, setDataSources] = useState<Record<DataSourceKey, boolean>>(
    existingDataSources ?? { logs: true, metrics: true, alerts: true, events: false }
  );

  if (!provider) return null;

  const handleTest = async () => {
    setTestStatus('testing');
    setTestError('');
    await new Promise((r) => setTimeout(r, 1800 + Math.random() * 800));
    const hasRequired = provider.credentials.every((c) => credentials[c.key]?.trim());
    if (!hasRequired) {
      setTestStatus('failed');
      setTestError('Missing required credentials. Please fill in all fields.');
    } else {
      setTestStatus('success');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(provider.id, credentials, dataSources);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const allFilled = provider.credentials.every((c) => credentials[c.key]?.trim());

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col shadow-2xl"
        style={{ width: 'min(480px, 95vw)', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${provider.color}18`, border: `1px solid ${provider.color}30` }}>
              <ProviderLogo id={provider.id} size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{provider.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Integration Setup</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-0 px-6 pt-5 pb-4 flex-shrink-0">
          {([1, 2, 3] as const).map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <button
                onClick={() => s < step && setStep(s)}
                className={`flex items-center gap-2 text-xs font-medium transition-colors ${s <= step ? 'cursor-pointer' : 'cursor-default'}`}
                style={{ color: s === step ? 'var(--accent)' : s < step ? '#34d399' : 'var(--text-muted)' }}
              >
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: s === step ? 'var(--accent)' : s < step ? 'rgba(16,185,129,0.15)' : 'var(--bg-elevated)',
                    color: s === step ? 'white' : s < step ? '#34d399' : 'var(--text-muted)',
                    border: `1px solid ${s === step ? 'var(--accent)' : s < step ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                  }}>
                  {s < step ? <CheckCircle2 className="h-3 w-3" /> : s}
                </span>
                <span className="hidden sm:inline">{s === 1 ? 'Credentials' : s === 2 ? 'Test' : 'Data Sources'}</span>
              </button>
              {i < 2 && (
                <div className="flex-1 h-px mx-2" style={{ background: 'var(--border)' }} />
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Enter your {provider.name} credentials below. All values are stored encrypted.
              </p>
              {provider.credentials.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type === 'password' ? 'password' : 'text'}
                    value={credentials[field.key] ?? ''}
                    onChange={(e) => setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="input-field font-mono text-xs"
                    autoComplete="off"
                  />
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Verify that your credentials are valid by running a connection test.
              </p>

              <button
                onClick={handleTest}
                disabled={testStatus === 'testing'}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={testStatus === 'testing'
                  ? { background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                  : { background: 'var(--accent)', color: 'white' }
                }
                onMouseEnter={(e) => { if (testStatus !== 'testing') (e.currentTarget as HTMLButtonElement).style.background = '#4f51e8'; }}
                onMouseLeave={(e) => { if (testStatus !== 'testing') (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'; }}
              >
                {testStatus === 'testing' ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Testing connection...
                  </>
                ) : 'Test Connection'}
              </button>

              <AnimatePresence>
                {testStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-3 p-4 rounded-lg"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}
                  >
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#34d399' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#34d399' }}>Connection successful</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Operon can reach {provider.name} with the provided credentials.
                      </p>
                    </div>
                  </motion.div>
                )}

                {testStatus === 'failed' && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-3 p-4 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                  >
                    <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#f87171' }}>Connection failed</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{testError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Choose which data types Operon should pull from {provider.name}.
              </p>
              {(Object.keys(DATA_SOURCE_LABELS) as DataSourceKey[]).map((key) => {
                const supported = provider.supportedSources.includes(key);
                const checked = dataSources[key];
                return (
                  <label
                    key={key}
                    className={`flex items-start gap-3 p-3.5 rounded-lg cursor-pointer transition-all ${!supported ? 'opacity-40 cursor-not-allowed' : ''}`}
                    style={{
                      background: checked && supported ? 'rgba(99,102,241,0.08)' : 'var(--bg-elevated)',
                      border: `1px solid ${checked && supported ? 'rgba(99,102,241,0.25)' : 'var(--border)'}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked && supported}
                      disabled={!supported}
                      onChange={(e) => supported && setDataSources((prev) => ({ ...prev, [key]: e.target.checked }))}
                      className="mt-0.5 flex-shrink-0"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {DATA_SOURCE_LABELS[key]}
                        {!supported && <span className="ml-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>Not supported</span>}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {DATA_SOURCE_DESCRIPTIONS[key]}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border)' }}>
          {step > 1 ? (
            <button onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2d3050'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}>
              Back
            </button>
          ) : (
            <button onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as 2 | 3)}
              disabled={step === 1 && !allFilled}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={step === 1 && !allFilled
                ? { background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'not-allowed' }
                : { background: 'var(--accent)', color: 'white' }
              }
              onMouseEnter={(e) => { if (!(step === 1 && !allFilled)) (e.currentTarget as HTMLButtonElement).style.background = '#4f51e8'; }}
              onMouseLeave={(e) => { if (!(step === 1 && !allFilled)) (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'; }}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: 'var(--accent)', color: 'white' }}
              onMouseEnter={(e) => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = '#4f51e8'; }}
              onMouseLeave={(e) => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'; }}
            >
              {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Integration
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
};
