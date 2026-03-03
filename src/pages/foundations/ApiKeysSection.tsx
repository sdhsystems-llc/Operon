import { useState, useEffect } from 'react';
import { Key, Copy, CheckCircle2, Trash2, Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { ApiKey } from '../../types/database.types';

const generateKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return 'opn_' + Array.from({ length: 48 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export const ApiKeysSection = () => {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { if (user) loadKeys(); }, [user]);

  const loadKeys = async () => {
    setLoading(true);
    const { data } = await supabase.from('api_keys').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    if (data) setKeys(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !newKeyName.trim()) return;
    setCreating(true);
    const fullKey = generateKey();
    const { data } = await supabase.from('api_keys').insert({
      user_id: user.id, name: newKeyName.trim(),
      key_prefix: fullKey.slice(0, 12), key_hash: fullKey,
    }).select().single();
    setCreating(false);
    if (data) { setKeys((prev) => [data, ...prev]); setRevealedKey(fullKey); setNewKeyName(''); setShowCreate(false); }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('api_keys').delete().eq('id', id);
    setKeys((prev) => prev.filter((k) => k.id !== id));
  };

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4" style={{ color: 'var(--accent)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>API Keys</h2>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          <Plus className="h-3.5 w-3.5" />
          Generate Key
        </button>
      </div>

      {revealedKey && (
        <div className="mx-4 mt-4 p-3 rounded-lg flex items-center gap-3"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--success)' }} />
          <code className="flex-1 text-xs font-mono truncate" style={{ color: '#6ee7b7' }}>{revealedKey}</code>
          <button onClick={() => handleCopy(revealedKey, 'new')} style={{ color: 'var(--success)' }}>
            {copiedId === 'new' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => setRevealedKey(null)} style={{ color: 'var(--text-muted)' }}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="px-5 py-8 flex items-center justify-center">
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center px-5 py-10">
          <Key className="mx-auto h-8 w-8 mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No API keys yet</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {keys.map((k) => (
            <div key={k.id} className="flex items-center gap-4 px-5 py-3.5"
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <Key className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{k.name}</p>
                <code className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  {k.key_prefix}••••••••••••••••
                </code>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Created {new Date(k.created_at).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => handleCopy(k.key_prefix, k.id)} className="p-1.5 rounded transition-all"
                style={{ color: copiedId === k.id ? 'var(--success)' : 'var(--text-muted)' }}>
                {copiedId === k.id ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => handleDelete(k.id)} className="p-1.5 rounded transition-all"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <>
          <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowCreate(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Generate API Key</p>
                <button onClick={() => setShowCreate(false)} style={{ color: 'var(--text-muted)' }}><X className="h-4 w-4" /></button>
              </div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Key Name</label>
              <input type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production API" autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mb-4"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  Cancel
                </button>
                <button onClick={handleCreate} disabled={!newKeyName.trim() || creating}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: 'var(--accent)', color: '#fff', opacity: !newKeyName.trim() ? 0.5 : 1 }}>
                  {creating ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
