import { Cpu, FileText } from 'lucide-react';
import type { Agent } from './types';

const STATUS_CFG = {
  active: { label: 'Active', dot: '#10b981', bg: 'rgba(16,185,129,0.1)', text: '#10b981', pulse: true },
  idle: { label: 'Idle', dot: '#94a3b8', bg: 'rgba(148,163,184,0.1)', text: '#94a3b8', pulse: false },
  error: { label: 'Error', dot: '#ef4444', bg: 'rgba(239,68,68,0.1)', text: '#ef4444', pulse: true },
};

const TYPE_LABELS: Record<string, string> = {
  investigator: 'Investigator',
  monitor: 'Monitor',
  remediation: 'Remediation',
  reporter: 'Reporter',
  triage: 'Triage',
  knowledge: 'Knowledge',
};

const TYPE_COLORS: Record<string, string> = {
  investigator: '#3b82f6',
  monitor: '#f59e0b',
  remediation: '#10b981',
  reporter: '#8b5cf6',
  triage: '#ef4444',
  knowledge: '#06b6d4',
};

interface Props {
  agent: Agent;
  onViewLogs: (agent: Agent) => void;
}

export const AgentCard = ({ agent, onViewLogs }: Props) => {
  const s = STATUS_CFG[agent.status];
  const typeColor = TYPE_COLORS[agent.type] || '#94a3b8';

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4 transition-all duration-200"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.3)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${typeColor}18` }}>
            <Cpu className="h-5 w-5" style={{ color: typeColor }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{agent.name}</p>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: `${typeColor}18`, color: typeColor }}>
              {TYPE_LABELS[agent.type]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: s.bg }}>
          <span className="relative flex h-2 w-2">
            <span className={`rounded-full h-2 w-2 flex-shrink-0 ${s.pulse ? 'animate-ping absolute inline-flex opacity-75' : ''}`}
              style={{ background: s.dot }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: s.dot }} />
          </span>
          <span className="text-xs font-medium" style={{ color: s.text }}>{s.label}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {agent.tasks_completed_today}
          </p>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Tasks today
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Current task</p>
          {agent.current_task ? (
            <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
              {agent.current_task}
            </p>
          ) : (
            <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Waiting for work</p>
          )}
        </div>
      </div>

      {agent.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {agent.capabilities.slice(0, 4).map((cap) => (
            <span key={cap} className="text-[10px] px-2 py-0.5 rounded"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {cap}
            </span>
          ))}
          {agent.capabilities.length > 4 && (
            <span className="text-[10px] px-2 py-0.5 rounded"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              +{agent.capabilities.length - 4}
            </span>
          )}
        </div>
      )}

      <button
        onClick={() => onViewLogs(agent)}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
          (e.currentTarget as HTMLButtonElement).style.color = '#818cf8';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
        }}
      >
        <FileText className="h-3.5 w-3.5" />
        View Logs
      </button>
    </div>
  );
};
