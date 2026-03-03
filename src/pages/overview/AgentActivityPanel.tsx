import type { AgentStatus } from './types';

const AGENTS: AgentStatus[] = [
  { id: 'investigation', name: 'Investigation Agent', status: 'active', task: 'Analyzing checkout-service logs...' },
  { id: 'correlation', name: 'Correlation Agent', status: 'active', task: 'Correlating deploy events with errors' },
  { id: 'remediation', name: 'Remediation Agent', status: 'idle', task: 'Idle' },
  { id: 'monitor', name: 'Monitor Agent', status: 'active', task: 'Watching payment-service metrics' },
  { id: 'chat', name: 'Chat Agent', status: 'idle', task: 'Idle' },
  { id: 'deploy', name: 'Deploy Agent', status: 'idle', task: 'Idle' },
];

const statusConfig = {
  active: { dot: '#10b981', pulse: true, label: 'Active', textColor: '#34d399', bgColor: 'rgba(16,185,129,0.1)' },
  idle:   { dot: '#475569', pulse: false, label: 'Idle',   textColor: 'var(--text-muted)', bgColor: 'var(--bg-elevated)' },
  error:  { dot: '#ef4444', pulse: false, label: 'Error',  textColor: '#f87171', bgColor: 'rgba(239,68,68,0.1)' },
};

export const AgentActivityPanel = () => {
  const activeCount = AGENTS.filter((a) => a.status === 'active').length;

  return (
    <div className="card flex flex-col h-full">
      <div className="p-5 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Agents</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{activeCount} of {AGENTS.length} active</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#10b981]" />
          Live
        </span>
      </div>

      <div className="flex-1 divide-y" style={{ borderColor: 'var(--border)' }}>
        {AGENTS.map((agent) => {
          const cfg = statusConfig[agent.status];
          return (
            <div key={agent.id} className="flex items-start gap-3 px-5 py-3.5 transition-colors"
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
              <div className="relative flex-shrink-0 mt-0.5">
                <span className="block w-2.5 h-2.5 rounded-full" style={{ background: cfg.dot }} />
                {cfg.pulse && (
                  <span className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ background: cfg.dot }} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{agent.name}</p>
                  <span className="flex-shrink-0 text-xs font-medium px-1.5 py-0.5 rounded"
                    style={{ background: cfg.bgColor, color: cfg.textColor }}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{agent.task}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
