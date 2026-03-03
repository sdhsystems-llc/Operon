import { useState } from 'react';
import { User, Shield, Users, Key, FolderKanban } from 'lucide-react';
import { ProfileTab } from './settings/ProfileTab';
import { OrgTab } from './settings/OrgTab';
import { TeamTab } from './settings/TeamTab';
import { ApiKeysTab } from './settings/ApiKeysTab';
import { ProjectsTab } from './settings/ProjectsTab';

type TabId = 'profile' | 'organization' | 'team' | 'apikeys' | 'projects';

const TABS: { id: TabId; label: string; Icon: any }[] = [
  { id: 'profile', label: 'Profile', Icon: User },
  { id: 'organization', label: 'Organization', Icon: Shield },
  { id: 'team', label: 'Team Members', Icon: Users },
  { id: 'apikeys', label: 'API Keys', Icon: Key },
  { id: 'projects', label: 'Projects', Icon: FolderKanban },
];

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-secondary-900">Settings</h1>
        <p className="mt-1 text-sm text-secondary-600">
          Manage your account, organization, and team settings
        </p>
      </div>

      <div className="flex gap-6">
        <div className="w-56 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                }`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${activeTab === id ? 'text-primary-600' : 'text-secondary-400'}`} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'organization' && <OrgTab />}
          {activeTab === 'team' && <TeamTab />}
          {activeTab === 'apikeys' && <ApiKeysTab />}
          {activeTab === 'projects' && <ProjectsTab />}
        </div>
      </div>
    </div>
  );
};
