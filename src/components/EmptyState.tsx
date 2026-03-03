import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; to?: string; onClick?: () => void };
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
      style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
      <div className="text-[var(--accent)] opacity-70">{icon}</div>
    </div>
    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
    <p className="text-sm text-[var(--text-muted)] max-w-sm mb-6">{description}</p>
    {action && (
      action.to ? (
        <Link to={action.to} className="btn-primary">{action.label}</Link>
      ) : (
        <button onClick={action.onClick} className="btn-primary">{action.label}</button>
      )
    )}
  </div>
);
