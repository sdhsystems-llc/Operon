import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Project, Domain } from '../types/database'
import { FolderOpen, Globe, GitBranch, Plus, ExternalLink } from 'lucide-react'

const envColors: Record<string, string> = {
  production: 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/50',
  staging: 'bg-yellow-900/40 text-yellow-300 border border-yellow-800/50',
  development: 'bg-blue-900/40 text-blue-300 border border-blue-800/50',
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('domains').select('*'),
    ]).then(([proj, dom]) => {
      setProjects(proj.data ?? [])
      setDomains(dom.data ?? [])
      setLoading(false)
    })
  }, [])

  const filtered = filter === 'all' ? projects : projects.filter(p => p.environment === filter)
  const getDomain = (id: string | null) => domains.find(d => d.id === id)

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-gray-500 text-sm">Loading...</div></div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Projects</h1>
          <p className="text-sm text-gray-400 mt-0.5">{projects.length} projects monitored</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'production', 'staging', 'development'].map(env => (
          <button
            key={env}
            onClick={() => setFilter(env)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={filter === env
              ? { backgroundColor: 'var(--accent)', color: '#ffffff' }
              : { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
            }
          >
            {env.charAt(0).toUpperCase() + env.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(project => {
          const domain = getDomain(project.domain_id)
          return (
            <div key={project.id} className="card p-5 hover:border-gray-700 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  <FolderOpen className="w-4.5 h-4.5 text-blue-400" />
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${envColors[project.environment]}`}>
                  {project.environment}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-white mb-1">{project.name}</h3>
              {project.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>
              )}

              {domain && (
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: domain.color }} />
                  <span className="text-xs text-gray-400">{domain.name}</span>
                </div>
              )}

              <div className="space-y-1.5 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                {project.service_url && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{project.service_url}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
                {project.repo_url && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <GitBranch className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{project.repo_url.replace('https://github.com/', '')}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500 text-sm">No projects found.</div>
      )}
    </div>
  )
}
