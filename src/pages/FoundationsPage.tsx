import { PageTransition } from '../components/PageTransition';
import { OrgSettingsSection } from './foundations/OrgSettingsSection';
import { ProjectsSection } from './foundations/ProjectsSection';
import { MembersSection } from './foundations/MembersSection';
import { ApiKeysSection } from './foundations/ApiKeysSection';

export const FoundationsPage = () => {
  return (
    <PageTransition>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Foundations</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Organization settings, projects, members, and API keys
          </p>
        </div>

        <OrgSettingsSection />
        <ProjectsSection />
        <MembersSection />
        <ApiKeysSection />
      </div>
    </PageTransition>
  );
};
