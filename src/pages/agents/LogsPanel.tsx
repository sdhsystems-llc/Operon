import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Terminal } from 'lucide-react';
import type { Agent, AgentLog } from './types';

const LEVEL_STYLES = {
  info:  { color: '#94a3b8', prefix: 'INFO ' },
  debug: { color: '#475569', prefix: 'DEBUG' },
  warn:  { color: '#f59e0b', prefix: 'WARN ' },
  error: { color: '#ef4444', prefix: 'ERROR' },
};

interface Props {
  agent: Agent;
  logs: AgentLog[];
  onClose: () => void;
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toISOString().replace('T', ' ').slice(0, 19);
};

export const LogsPanel = ({ agent, logs, onClose }: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
        style={{
          width: '520px',
          maxWidth: '95vw',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <Terminal className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {agent.name} — Logs
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Last 20 entries</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4"
          style={{ background: '#080a0f', fontFamily: 'ui-monospace, monospace' }}>
          {logs.map((log, i) => {
            const ls = LEVEL_STYLES[log.level] || LEVEL_STYLES.info;
            return (
              <div key={log.id || i} className="flex gap-3 text-xs leading-relaxed py-0.5">
                <span className="flex-shrink-0 opacity-40" style={{ color: '#94a3b8' }}>
                  {formatTime(log.created_at)}
                </span>
                <span className="flex-shrink-0 font-semibold" style={{ color: ls.color }}>
                  [{ls.prefix}]
                </span>
                <span style={{ color: log.level === 'error' ? '#fca5a5' : log.level === 'warn' ? '#fcd34d' : '#cbd5e1' }}>
                  {log.message}
                </span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </motion.div>
    </>
  );
};
