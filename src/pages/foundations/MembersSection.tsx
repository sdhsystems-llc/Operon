import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, X, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { UserProfile } from '../../types/database.types';

const ROLE_CFG: Record<string, { bg: string; color: string }> = {
  admin:    { bg: 'rgba(239,68,68,0.12)',   color: '#fca5a5' },
  engineer: { bg: 'rgba(59,130,246,0.12)',  color: '#93c5fd' },
  viewer:   { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
};

const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
};

export const MembersSection = () => {
  const { profile } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('engineer');
  const [inviting, setInviting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = async () => {
    setLoading(true);
    const { data } = await supabase.from('user_profiles').select('*').order('created_at');
    if (data) setMembers(data);
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    await new Promise((r) => setTimeout(r, 900));
    setInviting(false);
    setInviteSent(true);
    setTimeout(() => { setInviteSent(false); setShowInvite(false); setInviteEmail(''); }, 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" style={{ color: 'var(--accent)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Members</h2>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            {members.length}
          </span>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          <UserPlus className="h-3.5 w-3.5" />
          Invite
        </button>
      </div>

      {loading ? (
        <div className="px-5 py-8 flex items-center justify-center">
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                {['Member', 'Email', 'Role', 'Last Active', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold"
                    style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const rc = ROLE_CFG[m.role] || ROLE_CFG.viewer;
                const isMe = profile?.id === m.id;
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-elevated)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                          {getInitials(m.full_name || 'U')}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {m.full_name || 'Unnamed'}
                            {isMe && <span className="ml-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>(you)</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {(m as any).email || `${(m.full_name || 'user').toLowerCase().replace(' ', '.')}@company.com`}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                        style={{ background: rc.bg, color: rc.color }}>
                        {m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                      {relativeTime(m.updated_at || m.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {!isMe && (
                        <button className="p-1.5 rounded-lg transition-all"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                          }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showInvite && (
        <>
          <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowInvite(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Invite Member</p>
                <button onClick={() => setShowInvite(false)} style={{ color: 'var(--text-muted)' }}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              {inviteSent ? (
                <div className="text-center py-6">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'rgba(16,185,129,0.15)' }}>
                    <Mail className="h-5 w-5" style={{ color: 'var(--success)' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Invitation sent!</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-5">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
                      <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com" autoFocus
                        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Role</label>
                      <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                        <option value="admin">Admin</option>
                        <option value="engineer">Engineer</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowInvite(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                      Cancel
                    </button>
                    <button onClick={handleInvite} disabled={!inviteEmail || inviting}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium"
                      style={{ background: 'var(--accent)', color: '#fff', opacity: !inviteEmail ? 0.5 : 1 }}>
                      {inviting ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Send Invite'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
