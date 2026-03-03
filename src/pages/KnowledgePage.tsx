import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { KnowledgeDocument } from '../types/database'
import { formatDistanceToNow } from 'date-fns'
import { BookOpen, Upload, Search } from 'lucide-react'

const typeIcon: Record<string, string> = {
  pdf: '📄',
  markdown: '📝',
  runbook: '📋',
  playbook: '📖',
  architecture: '🏗️',
  sop: '📃',
  article: '📰',
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('knowledge_documents').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setDocs(data ?? [])
      setLoading(false)
    })
  }, [])

  const filtered = docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="flex items-center justify-center h-full"><div className="text-gray-500 text-sm">Loading...</div></div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Knowledge Base</h1>
          <p className="text-sm text-gray-400 mt-0.5">{docs.length} documents indexed</p>
        </div>
        <button className="btn-primary">
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <input
          type="text"
          className="input pl-9 max-w-sm"
          placeholder="Search documents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Document</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Type</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Size</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Status</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map(doc => (
              <tr key={doc.id} className="hover:bg-gray-800/40 transition-colors cursor-pointer">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="text-base">{typeIcon[doc.type] ?? '📄'}</span>
                    <div>
                      <p className="text-gray-200 font-medium">{doc.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">{doc.type}</span>
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-400">
                  {doc.size ? formatBytes(doc.size) : '—'}
                </td>
                <td className="px-5 py-3.5">
                  <span className={doc.status === 'active' ? 'badge-active' : 'badge-idle'}>{doc.status}</span>
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-400">
                  {doc.created_at ? formatDistanceToNow(new Date(doc.created_at), { addSuffix: true }) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="w-10 h-10 text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">No documents found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
