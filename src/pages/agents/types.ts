export type AgentStatus = 'active' | 'idle' | 'error';
export type AgentType = 'investigator' | 'monitor' | 'remediation' | 'reporter' | 'triage' | 'knowledge';

export interface Agent {
  id: string;
  org_id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  tasks_completed_today: number;
  current_task: string | null;
  capabilities: string[];
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AgentLog {
  id: string;
  agent_id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata: Record<string, any>;
  created_at: string;
}
