import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, CheckCircle2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { ApiKey } from '../../types/database.types';

const generateKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const prefix = 'opn_';
  const body = Array.from({ length: 48 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return prefix + body;
};

export const ApiKeysTab = () => {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadKeys();
  }, [user]);

  const loadKeys = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setKeys(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !newKeyName.trim()) return;
    setCreating(true);

    const fullKey = generateKey();
    const prefix = fullKey.slice(0, 12);

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name: newKeyName.trim(),
        key_prefix: prefix,
        key_hash: fullKey,
      })
      .select()
      .single();

    setCreating(false);
    if (!error && data) {
      setKeys((prev) => [data, ...prev]);
      setRevealedKey(fullKey);
      setNewKeyName('');
      setShowCreate(false);
    }
  };

  const handleDelete = async (keyId: string) => {
    await supabase.from('api_keys').delete().eq('id', keyId);
    setKeys((prev) => prev.filter((k) => k.id !== keyId));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {revealedKey && (
        <div className="card p-4 border-2 border-success-300 bg-success-50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-success-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-success-800">API key created — save it now!</p>
              </div>
              <p className="text-xs text-success-700 mb-2">
                This key will not be shown again. Copy it to a safe place.
              </p>
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-success-200">
                <code className="text-xs font-mono text-secondary-800 flex-1 truncate">
                  {revealedKey}
                </code>
                <button
                  onClick={() => handleCopy(revealedKey, 'new')}
                  className="flex-shrink-0 text-success-600 hover:text-success-800 transition-colors"
                >
                  {copiedId === 'new' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              onClick={() => setRevealedKey(null)}
              className="p-1 hover:bg-success-200 rounded transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4 text-success-700" />
            </button>
          </div>
        </div>
      )}

      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">API Keys</h2>
            <p className="text-sm text-secondary-500 mt-0.5">
              Use these keys to authenticate API requests from external systems
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Generate Key
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary-600" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-12">
            <Key className="mx-auto h-10 w-10 text-secondary-300" />
            <p className="mt-3 text-sm text-secondary-500">No API keys yet</p>
            <p className="text-xs text-secondary-400 mt-1">Generate a key to authenticate external integrations</p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-100">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Key className="h-4 w-4 text-secondary-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-secondary-900">{key.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <code className="text-xs font-mono text-secondary-500">
                        {key.key_prefix}••••••••••••••••••••
                      </code>
                      <button
                        onClick={() => handleCopy(key.key_prefix, key.id)}
                        className="text-secondary-400 hover:text-secondary-600 transition-colors"
                      >
                        {copiedId === key.id ? (
                          <CheckCircle2 className="h-3 w-3 text-success-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-secondary-500">Created</p>
                    <p className="text-xs font-medium text-secondary-700">
                      {new Date(key.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(key.id)}
                    className="p-1.5 text-secondary-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Revoke key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-secondary-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-secondary-900">Generate API Key</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-secondary-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Production Integration, CI/CD Pipeline"
                  className="input-field"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
                <p className="text-xs text-secondary-400 mt-1">
                  Give this key a descriptive name so you know what it's used for
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newKeyName.trim() || creating}
                className="btn-primary flex-1"
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Generating...
                  </span>
                ) : (
                  'Generate Key'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
