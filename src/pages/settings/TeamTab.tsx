import { useState, useEffect } from 'react';
import { Users, UserPlus, X, CheckCircle2, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { UserProfile } from '../../types/database.types';

const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
  admin: { bg: 'bg-red-100', text: 'text-red-700' },
  engineer: { bg: 'bg-blue-100', text: 'text-blue-700' },
  viewer: { bg: 'bg-secondary-100', text: 'text-secondary-600' },
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const TeamTab = () => {
  const { profile } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('engineer');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at');
    if (data) setMembers(data);
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setInviting(false);
    setInviteSuccess(true);
    setInviteEmail('');
    setTimeout(() => {
      setInviteSuccess(false);
      setShowInvite(false);
    }, 2000);
  };

  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-secondary-900">Team Members</h2>
          <p className="text-sm text-secondary-500 mt-0.5">
            {members.length} member{members.length !== 1 ? 's' : ''} in your organization
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="btn-primary"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary-600" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-10 w-10 text-secondary-300" />
          <p className="mt-3 text-sm text-secondary-500">No team members yet</p>
        </div>
      ) : (
        <div className="divide-y divide-secondary-100">
          {members.map((member) => {
            const roleStyle = ROLE_STYLES[member.role] || ROLE_STYLES.viewer;
            const isCurrentUser = profile?.id === member.id;
            return (
              <div key={member.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-primary-700">
                        {getInitials(member.full_name || 'U')}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-secondary-900">
                        {member.full_name || 'Unnamed User'}
                      </p>
                      {isCurrentUser && (
                        <span className="text-xs text-secondary-400 font-normal">(you)</span>
                      )}
                    </div>
                    <p className="text-xs text-secondary-500">
                      Joined {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleStyle.bg} ${roleStyle.text}`}>
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 bg-secondary-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-secondary-900">Invite Team Member</h3>
                <p className="text-xs text-secondary-500 mt-0.5">
                  They'll receive an email invitation to join
                </p>
              </div>
              <button
                onClick={() => { setShowInvite(false); setInviteSuccess(false); }}
                className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-secondary-500" />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-success-600" />
                </div>
                <p className="text-sm font-medium text-secondary-900">Invitation sent!</p>
                <p className="text-xs text-secondary-500">
                  We've sent an invite to {inviteEmail || 'the email address'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        className="input-field pl-10"
                        onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                      Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="input-field"
                    >
                      <option value="admin">Admin — Full access</option>
                      <option value="engineer">Engineer — Can manage investigations</option>
                      <option value="viewer">Viewer — Read-only access</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowInvite(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button
                    onClick={handleInvite}
                    disabled={!inviteEmail || inviting}
                    className="btn-primary flex-1"
                  >
                    {inviting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      'Send Invitation'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
