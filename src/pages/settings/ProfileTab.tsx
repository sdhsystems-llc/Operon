import { useState, useEffect } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const ProfileTab = () => {
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('engineer');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setRole(profile.role || 'engineer');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ full_name: fullName, role, avatar_url: avatarUrl || null })
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
        <h2 className="text-lg font-semibold text-secondary-900">Profile Information</h2>
        <p className="text-sm text-secondary-500 mt-1">
          Update your personal details. Email is managed through your auth provider.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="input-field bg-secondary-50 text-secondary-500 cursor-not-allowed"
          />
          <p className="text-xs text-secondary-400 mt-1">Email cannot be changed here</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1.5">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="input-field"
          >
            <option value="admin">Admin</option>
            <option value="engineer">Engineer</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1.5">
            Avatar URL
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            className="input-field"
          />
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
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
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
