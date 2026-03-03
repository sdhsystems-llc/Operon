import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Cpu, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PageTransition } from '../components/PageTransition';
import { Skeleton } from '../components/Skeleton';
import { AgentCard } from './agents/AgentCard';
import { LogsPanel } from './agents/LogsPanel';
import { DeployWizard } from './agents/DeployWizard';
import { MOCK_AGENTS, generateMockLogs } from './agents/mockData';
import type { Agent, AgentLog } from './agents/types';

export const AgentsPage = () => {
  const { profile } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (profile) loadAgents();
  }, [profile]);

  const loadAgents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('agents')
      .select('*')
      .eq('org_id', profile!.id)
      .order('created_at');

    if (data && data.length > 0) {
      setAgents(data as Agent[]);
    } else {
      await seedAgents();
    }
    setLoading(false);
  };

  const seedAgents = async () => {
    const inserts = MOCK_AGENTS.map((a) => ({ ...a, org_id: profile!.id }));
    const { data } = await supabase.from('agents').insert(inserts).select();
    if (data) setAgents(data as Agent[]);
  };

  const handleViewLogs = (agent: Agent) => {
    setSelectedAgent(agent);
    setLogs(generateMockLogs(agent.type, agent.id));
  };

  const handleDeploy = async (data: { name: string; type: string; capabilities: string[] }) => {
    const { data: newAgent } = await supabase
      .from('agents')
      .insert({
        org_id: profile!.id,
        name: data.name,
        type: data.type,
        status: 'idle',
        tasks_completed_today: 0,
        current_task: null,
        capabilities: data.capabilities,
        config: {},
      })
      .select()
      .single();

    if (newAgent) setAgents((prev) => [...prev, newAgent as Agent]);
    setShowWizard(false);
  };

  const activeCount = agents.filter((a) => a.status === 'active').length;
  const idleCount = agents.filter((a) => a.status === 'idle').length;
  const errorCount = agents.filter((a) => a.status === 'error').length;
  const totalTasks = agents.reduce((s, a) => s + a.tasks_completed_today, 0);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Agents</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              AI agents running in your organization
            </p>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: 'var(--accent)', color: '#fff' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <Plus className="h-4 w-4" />
            Deploy New Agent
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total agents', value: agents.length, icon: Cpu, color: '#818cf8' },
            { label: 'Active', value: activeCount, icon: Activity, color: '#10b981' },
            { label: 'Idle', value: idleCount, icon: CheckCircle2, color: '#94a3b8' },
            { label: 'Tasks today', value: totalTasks, icon: CheckCircle2, color: '#f59e0b' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4" style={{ color }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {loading ? '—' : value}
              </p>
            </div>
          ))}
        </div>

        {errorCount > 0 && !loading && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle className="h-4 w-4 flex-shrink-0" style={{ color: '#ef4444' }} />
            <p className="text-sm" style={{ color: '#fca5a5' }}>
              {errorCount} agent{errorCount > 1 ? 's are' : ' is'} in an error state. Review logs for details.
            </p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl p-5 space-y-4"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-24 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} onViewLogs={handleViewLogs} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedAgent && (
          <LogsPanel
            agent={selectedAgent}
            logs={logs}
            onClose={() => setSelectedAgent(null)}
          />
        )}
        {showWizard && (
          <DeployWizard
            onClose={() => setShowWizard(false)}
            onDeploy={handleDeploy}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  );
};
