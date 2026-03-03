import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { KnowledgeDocument } from '../types/database.types';
import {
  Upload,
  Search,
  BookOpen,
  FileText,
  GitBranch,
  Book,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Filter,
  FileUp,
  Clock,
  HardDrive,
  Link as LinkIcon,
} from 'lucide-react';

type DocType = 'all' | 'playbook' | 'runbook' | 'architecture' | 'article' | 'documentation' | 'postmortem';

const TYPE_CONFIGS: Record<
  string,
  { label: string; bg: string; text: string; Icon: any }
> = {
  playbook: { label: 'Playbook', bg: 'bg-purple-100', text: 'text-purple-700', Icon: BookOpen },
  runbook: { label: 'Runbook', bg: 'bg-blue-100', text: 'text-blue-700', Icon: FileText },
  architecture: { label: 'Architecture', bg: 'bg-green-100', text: 'text-green-700', Icon: GitBranch },
  article: { label: 'Knowledge Article', bg: 'bg-orange-100', text: 'text-orange-700', Icon: Book },
  documentation: { label: 'Documentation', bg: 'bg-teal-100', text: 'text-teal-700', Icon: FileText },
  postmortem: { label: 'Postmortem', bg: 'bg-red-100', text: 'text-red-700', Icon: AlertCircle },
};

const getTypeConfig = (type: string) =>
  TYPE_CONFIGS[type] || { label: type, bg: 'bg-secondary-100', text: 'text-secondary-700', Icon: FileText };

const formatSize = (bytes: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const TYPE_FILTER_OPTIONS: { value: DocType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'playbook', label: 'Playbooks' },
  { value: 'runbook', label: 'Runbooks' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'article', label: 'Articles' },
  { value: 'documentation', label: 'Docs' },
  { value: 'postmortem', label: 'Postmortems' },
];

export const KnowledgePage = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<DocType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<KnowledgeDocument | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState('runbook');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) loadOrgAndDocs();
  }, [user]);

  const loadOrgAndDocs = async () => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (profile) {
        setOrgId(profile.id);
        await loadDocs(profile.id);
      }
    } catch (err) {
      console.error('Error loading org:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDocs = async (oid?: string) => {
    const id = oid || orgId;
    if (!id) return;
    const { data, error } = await supabase
      .from('knowledge_documents')
      .select('*')
      .eq('org_id', id)
      .order('created_at', { ascending: false });
    if (!error) setDocs(data || []);
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || !orgId) return;
      setUploading(true);

      for (const file of Array.from(files)) {
        setUploadProgress(`Processing ${file.name}...`);
        await new Promise((r) => setTimeout(r, 600));

        setUploadProgress(`Saving ${file.name} to knowledge base...`);
        const { error } = await supabase.from('knowledge_documents').insert({
          org_id: orgId,
          name: file.name,
          type: uploadType,
          size: file.size,
          status: 'active',
          url: null,
          created_at: new Date().toISOString(),
        });

        if (error) {
          console.error('Upload error:', error);
        }
      }

      await loadDocs();
      setUploadProgress(null);
      setUploading(false);
      setShowUpload(false);
    },
    [orgId, uploadType]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const filteredDocs = docs.filter((doc) => {
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const typeCounts = docs.reduce<Record<string, number>>((acc, doc) => {
    acc[doc.type] = (acc[doc.type] || 0) + 1;
    return acc;
  }, {});

  const getStatusConfig = (status: string) => {
    if (status === 'active') return { label: 'Ready', bg: 'bg-success-100', text: 'text-success-700', Icon: CheckCircle2 };
    if (status === 'processing') return { label: 'Processing', bg: 'bg-warning-100', text: 'text-warning-700', Icon: Loader2 };
    return { label: 'Failed', bg: 'bg-red-100', text: 'text-red-700', Icon: AlertCircle };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-900">Knowledge Base</h1>
          <p className="mt-1 text-sm text-secondary-600">
            Upload playbooks, runbooks, and documentation for your AI agents
          </p>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn-primary">
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </button>
      </div>

      {docs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(TYPE_CONFIGS).map(([type, cfg]) => {
            const count = typeCounts[type] || 0;
            const Icon = cfg.Icon;
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(typeFilter === (type as DocType) ? 'all' : (type as DocType))}
                className={`card p-3 text-left transition-all hover:shadow-md ${
                  typeFilter === type ? `ring-2 ring-offset-1 ${cfg.text.replace('text-', 'ring-')}` : ''
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${cfg.bg}`}>
                  <Icon className={`h-4 w-4 ${cfg.text}`} />
                </div>
                <p className="text-lg font-bold text-secondary-900">{count}</p>
                <p className="text-xs text-secondary-500 mt-0.5">{cfg.label}</p>
              </button>
            );
          })}
        </div>
      )}

      <div className="card">
        <div className="p-4 border-b border-secondary-200 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-secondary-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as DocType)}
                className="input-field"
              >
                {TYPE_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} {opt.value !== 'all' ? `(${typeCounts[opt.value] || 0})` : `(${docs.length})`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-16 px-6">
            <BookOpen className="mx-auto h-12 w-12 text-secondary-300" />
            <h3 className="mt-4 text-sm font-medium text-secondary-900">
              {searchQuery || typeFilter !== 'all' ? 'No documents found' : 'No documents yet'}
            </h3>
            <p className="mt-2 text-sm text-secondary-500">
              {searchQuery || typeFilter !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Upload your first document to get started'}
            </p>
            {!searchQuery && typeFilter === 'all' && (
              <button onClick={() => setShowUpload(true)} className="mt-4 btn-primary inline-flex">
                Upload Document
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200 bg-secondary-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider hidden sm:table-cell">
                    Size
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider hidden md:table-cell">
                    Uploaded
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filteredDocs.map((doc) => {
                  const typeCfg = getTypeConfig(doc.type);
                  const statusCfg = getStatusConfig(doc.status);
                  const StatusIcon = statusCfg.Icon;
                  const TypeIcon = typeCfg.Icon;
                  return (
                    <tr key={doc.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeCfg.bg}`}>
                            <TypeIcon className={`h-4 w-4 ${typeCfg.text}`} />
                          </div>
                          <p className="text-sm font-medium text-secondary-900 truncate max-w-[200px] lg:max-w-[320px]">
                            {doc.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${typeCfg.bg} ${typeCfg.text}`}>
                          {typeCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-xs text-secondary-600">
                          <HardDrive className="h-3.5 w-3.5" />
                          {formatSize(doc.size)}
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-xs text-secondary-600">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                          <StatusIcon className={`h-3 w-3 ${doc.status === 'processing' ? 'animate-spin' : ''}`} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Preview
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-xl shadow-2xl max-w-lg w-full p-6" style={{ background: '#0f1117', border: '1px solid #1f2133' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: '#ffffff' }}>Upload Document</h2>
                <p className="text-xs mt-0.5" style={{ color: '#71717a' }}>
                  PDF, DOCX, TXT, MD — up to 50MB
                </p>
              </div>
              <button
                onClick={() => !uploading && setShowUpload(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#161821')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <X className="h-4 w-4" style={{ color: '#71717a' }} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#a1a1aa' }}>
                Document Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(TYPE_CONFIGS).map(([type, cfg]) => {
                  const Icon = cfg.Icon;
                  const selected = uploadType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUploadType(type)}
                      className="p-2.5 rounded-lg text-left transition-all"
                      style={{
                        background: selected ? '#161821' : '#0d0e14',
                        border: `1px solid ${selected ? '#6366f1' : '#1f2133'}`,
                        boxShadow: selected ? '0 0 0 1px #6366f1' : 'none',
                      }}
                    >
                      <Icon className="h-4 w-4 mb-1" style={{ color: selected ? '#6366f1' : '#52525b' }} />
                      <p className="text-xs font-medium" style={{ color: selected ? '#ffffff' : '#71717a' }}>
                        {cfg.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className="rounded-xl p-10 text-center cursor-pointer transition-all"
              style={{
                border: `2px dashed ${isDragging ? '#6366f1' : '#1f2133'}`,
                background: isDragging ? 'rgba(99,102,241,0.06)' : '#0d0e14',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.md,.doc"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />

              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin" style={{ color: '#6366f1' }} />
                  <p className="text-sm font-medium" style={{ color: '#ffffff' }}>{uploadProgress}</p>
                  <p className="text-xs" style={{ color: '#71717a' }}>Please wait...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-1" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
                    <FileUp className="h-7 w-7" style={{ color: '#6366f1' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#ffffff' }}>
                    {isDragging ? 'Drop files here' : 'Drop files or click to browse'}
                  </p>
                  <p className="text-xs" style={{ color: '#71717a' }}>
                    PDF, DOCX, TXT, Markdown up to 50MB each
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setPreviewDoc(null)}
          />
          <div className="w-full max-w-sm shadow-2xl flex flex-col" style={{ background: '#0f1117', borderLeft: '1px solid #1f2133' }}>
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid #1f2133' }}>
              <h2 className="text-sm font-semibold" style={{ color: '#ffffff' }}>Document Preview</h2>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#161821')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <X className="h-4 w-4" style={{ color: '#71717a' }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {(() => {
                const cfg = getTypeConfig(previewDoc.type);
                const Icon = cfg.Icon;
                const statusCfg = getStatusConfig(previewDoc.status);
                const StatusIcon = statusCfg.Icon;
                return (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <Icon className="h-6 w-6" style={{ color: '#6366f1' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-tight" style={{ color: '#ffffff' }}>
                          {previewDoc.name}
                        </p>
                        <span className="inline-flex mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: 'Status', value: <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}><StatusIcon className="h-3 w-3" />{statusCfg.label}</span> },
                        { label: 'File Size', value: formatSize(previewDoc.size) },
                        { label: 'Uploaded', value: new Date(previewDoc.created_at).toLocaleString() },
                        { label: 'Document Type', value: cfg.label },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between gap-4">
                          <p className="text-xs flex-shrink-0" style={{ color: '#71717a' }}>{label}</p>
                          <p className="text-xs font-medium text-right" style={{ color: '#a1a1aa' }}>{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4" style={{ borderTop: '1px solid #1f2133' }}>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#52525b' }}>
                        AI Context
                      </p>
                      <div className="p-3 rounded-lg" style={{ background: '#161821', border: '1px solid #1f2133' }}>
                        <p className="text-xs leading-relaxed" style={{ color: '#a1a1aa' }}>
                          This document is indexed and available to all AI agents. It will be used as context when investigating incidents related to {previewDoc.type === 'runbook' ? 'operational procedures' : previewDoc.type === 'playbook' ? 'incident response' : previewDoc.type === 'architecture' ? 'system design' : previewDoc.type === 'postmortem' ? 'past incidents' : 'your systems'}.
                        </p>
                      </div>
                    </div>

                    {previewDoc.url && (
                      <a
                        href={previewDoc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs transition-colors"
                        style={{ color: '#6366f1' }}
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                        View original document
                      </a>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="p-4" style={{ borderTop: '1px solid #1f2133' }}>
              <button
                onClick={() => setPreviewDoc(null)}
                className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ background: '#161821', border: '1px solid #1f2133', color: '#a1a1aa' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1f2133')}
                onMouseLeave={e => (e.currentTarget.style.background = '#161821')}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
