export interface DashboardMetrics {
  activeInvestigations: number;
  mttrMinutes: number | null;
  mttdMinutes: number;
  healthPct: number;
  healthDegraded: number;
  healthCritical: number;
}

export interface DayBucket {
  date: string;
  label: string;
  count: number;
}

export interface ServiceBucket {
  service: string;
  count: number;
}

export interface AgentStatus {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error';
  task: string;
}
