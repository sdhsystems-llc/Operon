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
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '0.625rem 0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', margin: 0 }}>AI Agents</p>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0 }}>{activeCount} of {AGENTS.length} active</p>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', fontWeight: 700, background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '0.2rem 0.5rem' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#10b981]" />
          Live
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {AGENTS.map((agent) => {
          const cfg = statusConfig[agent.status];
          return (
            <div key={agent.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.5rem 0.875rem', borderBottom: '1px solid var(--border)', transition: 'background 0.15s', cursor: 'default' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
              <div style={{ position: 'relative', flexShrink: 0, marginTop: 3 }}>
                <span style={{ display: 'block', width: 8, height: 8, borderRadius: '50%', background: cfg.dot }} />
                {cfg.pulse && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: cfg.dot, animation: 'agPing 1s infinite', opacity: 0.6 }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.375rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</p>
                  <span style={{ flexShrink: 0, fontSize: '0.62rem', fontWeight: 700, background: cfg.bgColor, color: cfg.textColor, padding: '0.1rem 0.35rem', borderRadius: 4 }}>{cfg.label}</span>
                </div>
                <p style={{ fontSize: '0.67rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.task}</p>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes agPing{0%{transform:scale(1);opacity:0.6}100%{transform:scale(2.2);opacity:0}}`}</style>
    </div>
  );
};
