import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check, Cpu } from 'lucide-react';
import { ALL_CAPABILITIES } from './mockData';

interface Props {
  onClose: () => void;
  onDeploy: (data: { name: string; type: string; capabilities: string[] }) => void;
}

const AGENT_TYPES = [
  { id: 'investigator', label: 'Investigator', desc: 'Root cause analysis and correlation' },
  { id: 'monitor', label: 'Monitor', desc: 'Real-time metric and log surveillance' },
  { id: 'remediation', label: 'Remediation', desc: 'Automated fixes and rollbacks' },
  { id: 'reporter', label: 'Reporter', desc: 'Postmortems and stakeholder comms' },
  { id: 'triage', label: 'Triage', desc: 'Severity scoring and escalation routing' },
  { id: 'knowledge', label: 'Knowledge', desc: 'Document indexing and semantic search' },
];

const STEPS = ['Name & Type', 'Capabilities', 'Configure'];

export const DeployWizard = ({ onClose, onDeploy }: Props) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [type, setType] = useState('investigator');
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);

  const toggleCap = (cap: string) =>
    setCapabilities((prev) => prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]);

  const handleDeploy = async () => {
    setDeploying(true);
    await new Promise((r) => setTimeout(r, 1400));
    setDeploying(false);
    setDeployed(true);
    setTimeout(() => {
      onDeploy({ name, type, capabilities });
    }, 1000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="pointer-events-auto w-full max-w-lg rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4" style={{ color: 'var(--accent)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Deploy New Agent</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 pt-5">
            <div className="flex items-center gap-2 mb-6">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                      style={{
                        background: i < step ? 'var(--success)' : i === step ? 'var(--accent)' : 'var(--bg-elevated)',
                        color: i <= step ? '#fff' : 'var(--text-muted)',
                      }}>
                      {i < step ? <Check className="h-3 w-3" /> : i + 1}
                    </div>
                    <span className="text-xs font-medium hidden sm:block"
                      style={{ color: i === step ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {s}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-2" style={{ background: i < step ? 'var(--success)' : 'var(--border)' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 pb-2 min-h-[260px]">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Agent Name
                    </label>
                    <input
                      autoFocus
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Argus, Nexus, Oracle"
                      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Agent Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {AGENT_TYPES.map((t) => (
                        <button key={t.id} onClick={() => setType(t.id)}
                          className="text-left p-3 rounded-lg transition-all"
                          style={{
                            background: type === t.id ? 'rgba(99,102,241,0.12)' : 'var(--bg-elevated)',
                            border: `1px solid ${type === t.id ? 'var(--accent)' : 'var(--border)'}`,
                          }}>
                          <p className="text-xs font-semibold" style={{ color: type === t.id ? '#818cf8' : 'var(--text-primary)' }}>
                            {t.label}
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    Select the capabilities this agent should have access to:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_CAPABILITIES.map((cap) => {
                      const active = capabilities.includes(cap);
                      return (
                        <button key={cap} onClick={() => toggleCap(cap)}
                          className="text-xs px-3 py-1.5 rounded-full transition-all"
                          style={{
                            background: active ? 'rgba(99,102,241,0.15)' : 'var(--bg-elevated)',
                            border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                            color: active ? '#818cf8' : 'var(--text-secondary)',
                          }}>
                          {cap}
                        </button>
                      );
                    })}
                  </div>
                  {capabilities.length > 0 && (
                    <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                      {capabilities.length} capabilit{capabilities.length === 1 ? 'y' : 'ies'} selected
                    </p>
                  )}
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-4">
                  <div className="rounded-xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Review Configuration</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Name</span>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{name || '—'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Type</span>
                        <span className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{type}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Capabilities</span>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{capabilities.length}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Initial status</span>
                        <span className="font-medium" style={{ color: '#94a3b8' }}>Idle</span>
                      </div>
                    </div>
                  </div>
                  {deployed && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                      style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <Check className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--success)' }} />
                      <span className="text-xs font-medium" style={{ color: '#6ee7b7' }}>
                        Agent deployed successfully!
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderTop: '1px solid var(--border)' }}>
            <button onClick={step === 0 ? onClose : () => setStep(step - 1)}
              className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg transition-all"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {step === 0 ? <X className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
              {step === 0 ? 'Cancel' : 'Back'}
            </button>

            {step < 2 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 0 && !name.trim()}
                className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg transition-all"
                style={{
                  background: step === 0 && !name.trim() ? 'var(--bg-elevated)' : 'var(--accent)',
                  color: step === 0 && !name.trim() ? 'var(--text-muted)' : '#fff',
                  border: '1px solid transparent',
                  opacity: step === 0 && !name.trim() ? 0.5 : 1,
                }}>
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={handleDeploy}
                disabled={deploying || deployed}
                className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg transition-all"
                style={{ background: deployed ? 'var(--success)' : 'var(--accent)', color: '#fff' }}>
                {deploying ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Deploying...
                  </>
                ) : deployed ? (
                  <><Check className="h-3.5 w-3.5" /> Deployed</>
                ) : (
                  <><Cpu className="h-3.5 w-3.5" /> Deploy Agent</>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};
