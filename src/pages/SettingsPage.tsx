import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { User, Building2, Bell, Shield, Key } from 'lucide-react'

type Tab = 'profile' | 'organization' | 'notifications' | 'security' | 'api'

export default function SettingsPage() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>('profile')
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [orgName, setOrgName] = useState(profile?.org_name ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API Keys', icon: Key },
  ]

  async function saveProfile() {
    if (!profile) return
    setSaving(true)
    await supabase.from('user_profiles').update({ full_name: fullName, org_name: orgName }).eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        <div className="w-44 flex-shrink-0">
          <nav className="space-y-0.5">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  tab === id ? 'bg-blue-600/15 text-blue-400 font-medium' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          {tab === 'profile' && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Profile Settings</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Full name</label>
                  <input
                    type="text"
                    className="input"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
                  <input type="text" className="input" value={profile?.role ?? ''} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Timezone</label>
                  <input type="text" className="input" value={profile?.timezone ?? 'UTC'} disabled />
                </div>
                <button onClick={saveProfile} disabled={saving} className="btn-primary">
                  {saved ? 'Saved!' : saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          )}

          {tab === 'organization' && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Organization</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Organization name</label>
                  <input
                    type="text"
                    className="input"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                  />
                </div>
                <button onClick={saveProfile} disabled={saving} className="btn-primary">
                  {saved ? 'Saved!' : saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: 'P1 incidents', desc: 'Critical production incidents' },
                  { label: 'P2 incidents', desc: 'High severity issues' },
                  { label: 'Agent completions', desc: 'When AI agents finish tasks' },
                  { label: 'Weekly digest', desc: 'Weekly summary of activity' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm text-gray-200">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-10 h-5 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Security</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Current password</label>
                  <input type="password" className="input" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">New password</label>
                  <input type="password" className="input" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm new password</label>
                  <input type="password" className="input" placeholder="••••••••" />
                </div>
                <button className="btn-primary">Update password</button>
              </div>
            </div>
          )}

          {tab === 'api' && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-white mb-1">API Keys</h2>
              <p className="text-sm text-gray-400 mb-4">Generate and manage API keys for programmatic access.</p>
              <button className="btn-secondary mb-6">
                <Key className="w-4 h-4" />
                Generate new key
              </button>
              <div className="text-center py-8 text-gray-600 text-sm">No API keys created yet.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
