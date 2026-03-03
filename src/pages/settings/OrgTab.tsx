import { useState, useEffect } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Project } from '../../types/database.types';

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export const OrgTab = () => {
  const { user, profile } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [defaultProjectId, setDefaultProjectId] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setOrgName(profile.org_name || '');
      setTimezone(profile.timezone || 'UTC');
      setDefaultProjectId(profile.default_project_id || '');
      loadProjects(profile.id);
    }
  }, [profile]);

  const loadProjects = async (orgId: string) => {
    const { data } = await supabase
      .from('projects')
      .select('id, name, description, status, org_id, created_at')
      .eq('org_id', orgId)
      .order('name');
    if (data) setProjects(data);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        org_name: orgName,
        timezone,
        default_project_id: defaultProjectId || null,
      })
      .eq('user_id', user.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-secondary-900">Organization Settings</h2>
        <p className="text-sm text-secondary-500 mt-1">
          Configure your organization's name, timezone, and defaults.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1.5">
            Organization Name
          </label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Your organization name"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1.5">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="input-field"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
          <p className="text-xs text-secondary-400 mt-1">
            Used for displaying timestamps and scheduling reports
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1.5">
            Default Project
          </label>
          <select
            value={defaultProjectId}
            onChange={(e) => setDefaultProjectId(e.target.value)}
            className="input-field"
          >
            <option value="">No default</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <p className="text-xs text-secondary-400 mt-1">
            New investigations will be assigned to this project by default
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-success-600">
            <CheckCircle2 className="h-4 w-4" />
            Saved successfully
          </span>
        )}
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
