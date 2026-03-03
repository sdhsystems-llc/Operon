import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileSearch, MessageSquare, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface Result {
  id: string;
  label: string;
  sub: string;
  path: string;
  type: 'investigation' | 'chat' | 'knowledge';
}

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const q = query.toLowerCase();

      const [invRes, chatRes, kbRes] = await Promise.all([
        supabase.from('investigations').select('id, title, service').ilike('title', `%${q}%`).limit(4),
        supabase.from('chat_sessions').select('id, title').ilike('title', `%${q}%`).limit(3),
        supabase.from('knowledge_base').select('id, title, type').ilike('title', `%${q}%`).limit(3),
      ]);

      const out: Result[] = [
        ...(invRes.data || []).map((r) => ({ id: r.id, label: r.title, sub: r.service, path: `/investigations/${r.id}`, type: 'investigation' as const })),
        ...(chatRes.data || []).map((r) => ({ id: r.id, label: r.title, sub: 'Chat Session', path: `/chat/${r.id}`, type: 'chat' as const })),
        ...(kbRes.data || []).map((r) => ({ id: r.id, label: r.title, sub: r.type, path: `/knowledge`, type: 'knowledge' as const })),
      ];
      setResults(out);
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery('');
  };

  const typeIcon = (type: Result['type']) => {
    if (type === 'investigation') return <FileSearch className="h-4 w-4" />;
    if (type === 'chat') return <MessageSquare className="h-4 w-4" />;
    return <BookOpen className="h-4 w-4" />;
  };

  const typeColor = (type: Result['type']) => {
    if (type === 'investigation') return 'text-[#f87171]';
    if (type === 'chat') return 'text-[#34d399]';
    return 'text-[#818cf8]';
  };

  return (
    <>
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors w-56"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        <Search className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[15vh] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl rounded-xl overflow-hidden shadow-2xl"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <Search className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search investigations, chats, knowledge..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
                {query && (
                  <button onClick={() => setQuery('')} style={{ color: 'var(--text-muted)' }}>
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {loading && (
                <div className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>Searching...</div>
              )}

              {!loading && results.length > 0 && (
                <div className="max-h-80 overflow-y-auto py-2">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => go(r.path)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--bg-surface)]"
                    >
                      <span className={typeColor(r.type)}>{typeIcon(r.type)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.label}</p>
                        <p className="text-xs truncate font-mono" style={{ color: 'var(--text-muted)' }}>{r.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!loading && query && results.length === 0 && (
                <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No results for "{query}"
                </div>
              )}

              {!query && (
                <div className="px-4 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Type to search across investigations, chats, and knowledge base
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
