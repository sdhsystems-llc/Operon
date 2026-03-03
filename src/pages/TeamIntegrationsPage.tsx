import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SlackSection } from './team-integrations/SlackSection';
import { TeamsSection } from './team-integrations/TeamsSection';
import { Toast } from './team-integrations/Toast';
import type { TeamIntegrationRow } from './team-integrations/types';

type TabId = 'slack' | 'teams';

export const TeamIntegrationsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('slack');
  const [slackIntegration, setSlackIntegration] = useState<TeamIntegrationRow | null>(null);
  const [teamsIntegration, setTeamsIntegration] = useState<TeamIntegrationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadIntegrations();
  }, [user]);

  const loadIntegrations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('team_integrations')
      .select('*')
      .eq('user_id', user!.id);

    if (data) {
      setSlackIntegration((data.find((d) => d.type === 'slack') as TeamIntegrationRow) ?? null);
      setTeamsIntegration((data.find((d) => d.type === 'teams') as TeamIntegrationRow) ?? null);
    }
    setLoading(false);
  };

  const handleSave = useCallback(
    async (type: TabId, updates: Partial<TeamIntegrationRow>) => {
      if (!user) return;

      const existing = type === 'slack' ? slackIntegration : teamsIntegration;

      if (existing) {
        const { data } = await supabase
          .from('team_integrations')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();

        if (data) {
          if (type === 'slack') setSlackIntegration(data as TeamIntegrationRow);
          else setTeamsIntegration(data as TeamIntegrationRow);
        }
      } else {
        const { data } = await supabase
          .from('team_integrations')
          .insert({ user_id: user.id, type, ...updates })
          .select()
          .single();

        if (data) {
          if (type === 'slack') setSlackIntegration(data as TeamIntegrationRow);
          else setTeamsIntegration(data as TeamIntegrationRow);
        }
      }
    },
    [user, slackIntegration, teamsIntegration]
  );

  const TABS: { id: TabId; label: string; badge?: boolean }[] = [
    { id: 'slack', label: 'Slack', badge: slackIntegration?.connected },
    { id: 'teams', label: 'Microsoft Teams', badge: teamsIntegration?.connected },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-secondary-900">Team Notifications</h1>
        <p className="mt-1 text-sm text-secondary-600">
          Connect Slack and Microsoft Teams to receive incident alerts and route notifications to the right channels
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1 border-b border-secondary-200">
            {TABS.map(({ id, label, badge }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === id
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                {label}
                {badge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-success-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          <div>
            {activeTab === 'slack' && (
              <SlackSection
                integration={slackIntegration}
                onSave={(data) => handleSave('slack', data)}
                onToast={setToast}
              />
            )}
            {activeTab === 'teams' && (
              <TeamsSection
                integration={teamsIntegration}
                onSave={(data) => handleSave('teams', data)}
                onToast={setToast}
              />
            )}
          </div>
        </>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};
