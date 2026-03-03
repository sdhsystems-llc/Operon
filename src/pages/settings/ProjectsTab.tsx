import { useState, useEffect } from 'react';
import { FolderKanban, Edit2, Archive, CheckCircle2, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Project } from '../../types/database.types';

const ENV_BADGE: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-success-100', text: 'text-success-700' },
  archived: { bg: 'bg-secondary-100', text: 'text-secondary-500' },
};

export const ProjectsTab = () => {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    if (profile) loadProjects(profile.id);
  }, [profile]);

  const loadProjects = async (orgId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at');
    if (data) setProjects(data);
    setLoading(false);
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditDesc(project.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDesc('');
  };

  const saveEdit = async (projectId: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('projects')
      .update({ name: editName.trim(), description: editDesc.trim() })
      .eq('id', projectId);

    setSaving(false);
    if (!error) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, name: editName.trim(), description: editDesc.trim() } : p
        )
      );
      setEditingId(null);
      setSavedId(projectId);
      setTimeout(() => setSavedId(null), 2000);
    }
  };

  const toggleArchive = async (project: Project) => {
    const newStatus = project.status === 'active' ? 'archived' : 'active';
    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', project.id);

    if (!error) {
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, status: newStatus } : p))
      );
    }
  };

  return (
    <div className="card p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-secondary-900">Projects</h2>
        <p className="text-sm text-secondary-500 mt-0.5">
          Manage your organization's projects. Investigations are scoped to a project.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary-600" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderKanban className="mx-auto h-10 w-10 text-secondary-300" />
          <p className="mt-3 text-sm text-secondary-500">No projects found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const isEditing = editingId === project.id;
            const statusStyle = ENV_BADGE[project.status] || ENV_BADGE.active;

            return (
              <div
                key={project.id}
                className={`border rounded-xl p-4 transition-all ${
                  isEditing ? 'border-primary-300 bg-primary-50/30' : 'border-secondary-200 hover:border-secondary-300'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-secondary-600 mb-1">
                        Project Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input-field text-sm"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-secondary-600 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={2}
                        className="input-field text-sm resize-none"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={cancelEdit} className="btn-secondary text-xs px-3 py-1.5">
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(project.id)}
                        disabled={!editName.trim() || saving}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        {saving ? (
                          <span className="flex items-center gap-1.5">
                            <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Saving
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Save className="h-3.5 w-3.5" />
                            Save
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FolderKanban className="h-4 w-4 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-secondary-900">
                            {project.name}
                          </p>
                          {savedId === project.id && (
                            <span className="flex items-center gap-1 text-xs text-success-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Saved
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            {project.status === 'active' ? 'Active' : 'Archived'}
                          </span>
                        </div>
                        <p className="text-xs text-secondary-500 mt-0.5 line-clamp-2">
                          {project.description || 'No description'}
                        </p>
                        <p className="text-xs text-secondary-400 mt-1">
                          Created {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => startEdit(project)}
                        className="p-1.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit project"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleArchive(project)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          project.status === 'active'
                            ? 'text-secondary-400 hover:text-warning-600 hover:bg-warning-50'
                            : 'text-secondary-400 hover:text-success-600 hover:bg-success-50'
                        }`}
                        title={project.status === 'active' ? 'Archive project' : 'Restore project'}
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
