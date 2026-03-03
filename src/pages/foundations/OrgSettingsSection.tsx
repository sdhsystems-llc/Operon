import { useState } from 'react';
import { Save, CheckCircle2, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Sao_Paulo', 'Europe/London',
  'Europe/Paris', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Kolkata',
  'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney',
];

const INDUSTRIES = [
  'Financial Services', 'Healthcare', 'E-commerce', 'SaaS / Software',
  'Telecommunications', 'Media & Entertainment', 'Government', 'Education', 'Other',
];

const inputStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
};

export const OrgSettingsSection = () => {
  const { user, profile } = useAuth();
  const [orgName, setOrgName] = useState(profile?.org_name || '');
  const [timezone, setTimezone] = useState(profile?.timezone || 'UTC');
  const [industry, setIndustry] = useState('SaaS / Software');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('user_profiles').update({ org_name: orgName, timezone }).eq('user_id', user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="rounded-xl p-6 space-y-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.12)' }}>
          <Building2 className="h-4 w-4" style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Organization Settings</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Manage your org profile and preferences</p>
        </div>
        <div className="ml-auto px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)' }}>
          Enterprise
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Organization Name
          </label>
          <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)}
            placeholder="Your organization" style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Industry
          </label>
          <select value={industry} onChange={(e) => setIndustry(e.target.value)} style={inputStyle}>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Timezone
          </label>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} style={inputStyle}>
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Plan
          </label>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <span style={{ color: '#6ee7b7' }}>Enterprise</span>
            <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>— Unlimited agents & integrations</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        {saved && (
          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--success)' }}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Saved
          </span>
        )}
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          {saving ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};
