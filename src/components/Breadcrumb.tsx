import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface Crumb {
  label: string;
  to?: string;
}

export const Breadcrumb = ({ crumbs }: { crumbs: Crumb[] }) => (
  <nav className="flex items-center gap-1.5 text-sm mb-5">
    {crumbs.map((crumb, i) => (
      <span key={i} className="flex items-center gap-1.5">
        {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />}
        {crumb.to && i < crumbs.length - 1 ? (
          <Link to={crumb.to} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            {crumb.label}
          </Link>
        ) : (
          <span className={i === crumbs.length - 1 ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'}>
            {crumb.label}
          </span>
        )}
      </span>
    ))}
  </nav>
);
