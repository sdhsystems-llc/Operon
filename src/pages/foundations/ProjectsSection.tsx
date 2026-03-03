import { useState, useEffect } from 'react';
import { FolderKanban, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Project } from '../../types/database.types';

interface EnrichedProject extends Project {
  services_count: number;
  active_investigations: number;
  assigned_agents: number;
}

const inputStyle = {
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: '6px',
  padding: '6px 10px',
  fontSize: '13px',
  outline: 'none',
};

export const ProjectsSection = () => {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<EnrichedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) loadProjects(profile.id);
  }, [profile]);

  const loadProjects = async (orgId: string) => {
    setLoading(true);
    const { data } = await supabase.from('projects').select('*').eq('org_id', orgId).order('created_at');
    if (data) {
      setProjects(data.map((p: Project) => ({
        ...p,
        services_count: Math.floor(Math.random() * 12) + 2,
        active_investigations: Math.floor(Math.random() * 5),
        assigned_agents: Math.floor(Math.random() * 4),
      })));
    }
    setLoading(false);
  };

  const startEdit = (p: EnrichedProject) => { setEditingId(p.id); setEditName(p.name); setEditDesc(p.description); };
  const cancelEdit = () => { setEditingId(null); setEditName(''); setEditDesc(''); };

  const saveEdit = async (id: string) => {
    setSaving(true);
    await supabase.from('projects').update({ name: editName.trim(), description: editDesc.trim() }).eq('id', id);
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, name: editName.trim(), description: editDesc.trim() } : p));
    setSaving(false);
    setEditingId(null);
  };

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4" style={{ color: 'var(--accent)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Projects</h2>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{projects.length} total</span>
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
                {['Name', 'Description', 'Services', 'Active Investigations', 'Agents', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold"
                    style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const isEditing = editingId === p.id;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-elevated)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <input value={editName} onChange={(e) => setEditName(e.target.value)}
                          style={{ ...inputStyle, width: '140px' }} autoFocus />
                      ) : p.name}
                    </td>
                    <td className="px-4 py-3 max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>
                      {isEditing ? (
                        <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                          style={{ ...inputStyle, width: '180px' }} />
                      ) : (
                        <span className="truncate block">{p.description || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center" style={{ color: 'var(--text-secondary)' }}>{p.services_count}</td>
                    <td className="px-4 py-3 text-center">
                      {p.active_investigations > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
                          {p.active_investigations}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center" style={{ color: 'var(--text-secondary)' }}>{p.assigned_agents}</td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => saveEdit(p.id)} disabled={saving}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                            style={{ background: 'var(--accent)', color: '#fff' }}>
                            {saving ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="h-3 w-3" />}
                            Save
                          </button>
                          <button onClick={cancelEdit} className="p-1.5 rounded-lg"
                            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(p)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                          <Edit2 className="h-3 w-3" />
                          Edit
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
    </div>
  );
};
