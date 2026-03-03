import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getAIResponse } from '../lib/aiResponses';
import type { ChatSession, ChatMessage } from '../types/database';
import { formatDistanceToNow, format } from 'date-fns';
import { Send, Bot, User, Plus, Trash2, MessageSquare, ChevronLeft, Database, Activity, ChartBar as BarChart3, Cloud, TriangleAlert as AlertTriangle, Loader as Loader2, Copy, Check, Sparkles } from 'lucide-react';

interface StreamingMessage {
  id: string;
  content: string;
  isComplete: boolean;
  sources?: string[];
}

const QUICK_PROMPTS = [
  { label: 'Checkout latency spike', prompt: 'Why is checkout service experiencing latency spikes?' },
  { label: 'Root cause analysis', prompt: 'Identify the root cause of the current incident' },
  { label: 'Current p99 metrics', prompt: 'Show me current production metrics and p99 latency' },
  { label: 'Remediation steps', prompt: 'What remediation steps do you recommend?' },
  { label: 'Correlate events', prompt: 'Correlate events across all integrations in the last 2 hours' },
  { label: 'Service health', prompt: 'Check deployment health status across all services' },
]

function getSourceIcon(source: string) {
  const lower = source.toLowerCase()
  if (lower.includes('postgres') || lower.includes('sql') || lower.includes('rds') || lower.includes('redis')) return <Database className="w-3 h-3" />
  if (lower.includes('datadog') || lower.includes('grafana') || lower.includes('prometheus')) return <BarChart3 className="w-3 h-3" />
  if (lower.includes('aws') || lower.includes('cloud') || lower.includes('azure')) return <Cloud className="w-3 h-3" />
  if (lower.includes('pagerduty') || lower.includes('alert')) return <AlertTriangle className="w-3 h-3" />
  return <Activity className="w-3 h-3" />
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="my-3 rounded-lg overflow-hidden border border-gray-700/60">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700/60">
        <span className="text-xs font-medium text-gray-400 font-mono">{lang || 'code'}</span>
        <button onClick={copy} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="px-4 py-3 bg-gray-900 overflow-x-auto text-xs leading-relaxed">
        <code className="text-gray-300 font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  )
}

function MessageContent({ content, streaming }: { content: string; streaming?: boolean }) {
  const parts = content.split(/(```[\s\S]*?```)/g)
  return (
    <div className="text-sm text-gray-200 leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).split('\n')
          const lang = lines[0]?.trim() || 'text'
          const code = lines.slice(1).join('\n').trim()
          return <CodeBlock key={i} lang={lang} code={code} />
        }
        const segs = part.split(/(\*\*[^*]+\*\*)/g)
        return (
          <span key={i}>
            {segs.map((seg, j) => {
              if (seg.startsWith('**') && seg.endsWith('**')) {
                return <strong key={j} className="text-white font-semibold">{seg.slice(2, -2)}</strong>
              }
              return seg.split('\n').map((line, k, arr) => (
                <span key={k}>{line}{k < arr.length - 1 && <br />}</span>
              ))
            })}
          </span>
        )
      })}
      {streaming && <span className="inline-block w-0.5 h-3.5 bg-blue-400 ml-0.5 align-middle animate-pulse" />}
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }} />
      ))}
    </div>
  )
}

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (user) loadSessions() }, [user])

  useEffect(() => {
    if (sessionId) loadSession(sessionId)
  }, [sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMessage])

  useEffect(() => {
    return () => { if (streamIntervalRef.current) clearInterval(streamIntervalRef.current) }
  }, [])

  async function loadSessions() {
    if (!user) return
    const { data } = await supabase.from('chat_sessions').select('*').eq('user_id', user.id).order('updated_at', { ascending: false })
    setSessions(data ?? [])
  }

  async function loadSession(id: string) {
    const [{ data: sessionData }, { data: msgData }] = await Promise.all([
      supabase.from('chat_sessions').select('*').eq('id', id).maybeSingle(),
      supabase.from('chat_messages').select('*').eq('session_id', id).order('created_at', { ascending: true }),
    ])
    setCurrentSession(sessionData ?? null)
    setMessages(msgData ?? [])
  }

  async function createNewSession() {
    if (!user) return
    const { data } = await supabase.from('chat_sessions').insert({ user_id: user.id, title: 'New Chat' }).select().single()
    if (data) {
      setSessions(prev => [data, ...prev])
      setCurrentSession(data)
      setMessages([])
      navigate(`/chat/${data.id}`)
    }
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await supabase.from('chat_messages').delete().eq('session_id', id)
    await supabase.from('chat_sessions').delete().eq('id', id)
    setSessions(prev => prev.filter(s => s.id !== id))
    if (sessionId === id) { setCurrentSession(null); setMessages([]); navigate('/chat') }
  }

  const simulateStreaming = useCallback((fullContent: string, sources: string[], sessId: string) => {
    const words = fullContent.split(' ')
    let currentContent = ''
    const tempId = `streaming-${Date.now()}`
    setStreamingMessage({ id: tempId, content: '', isComplete: false, sources })

    return new Promise<void>((resolve) => {
      let wordIndex = 0
      streamIntervalRef.current = setInterval(() => {
        if (wordIndex < words.length) {
          currentContent += (wordIndex > 0 ? ' ' : '') + words[wordIndex]
          setStreamingMessage({ id: tempId, content: currentContent, isComplete: false, sources })
          wordIndex++
        } else {
          if (streamIntervalRef.current) clearInterval(streamIntervalRef.current)
          setStreamingMessage({ id: tempId, content: currentContent, isComplete: true, sources })
          setTimeout(async () => {
            const { data: aiMsg } = await supabase.from('chat_messages').insert({ session_id: sessId, role: 'assistant', content: fullContent }).select().single()
            if (aiMsg) setMessages(prev => [...prev, aiMsg])
            setStreamingMessage(null)
            resolve()
          }, 400)
        }
      }, 35)
    })
  }, [])

  async function handleSend(text?: string) {
    const content = (text ?? inputMessage).trim()
    if (!content || !currentSession || loading) return
    setInputMessage('')
    setLoading(true)

    const { data: userMsg } = await supabase.from('chat_messages').insert({ session_id: currentSession.id, role: 'user', content }).select().single()
    if (userMsg) setMessages(prev => [...prev, userMsg])

    if (messages.length === 0) {
      const title = content.substring(0, 60)
      await supabase.from('chat_sessions').update({ title, updated_at: new Date().toISOString() }).eq('id', currentSession.id)
      setCurrentSession(prev => prev ? { ...prev, title } : prev)
      setSessions(prev => prev.map(s => s.id === currentSession.id ? { ...s, title } : s))
    } else {
      await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', currentSession.id)
    }

    const aiResponse = getAIResponse(content)
    await simulateStreaming(aiResponse.content, aiResponse.sources ?? [], currentSession.id)
    setLoading(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {sidebarOpen && (
        <div className="w-60 flex-shrink-0 border-r border-gray-800 flex flex-col bg-gray-900">
          <div className="flex items-center justify-between px-3 py-3 border-b border-gray-800">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sessions</span>
            <button onClick={createNewSession} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors" title="New chat">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-1.5">
            {sessions.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                <p className="text-xs text-gray-600">No sessions yet</p>
              </div>
            ) : sessions.map(session => (
              <button key={session.id} onClick={() => navigate(`/chat/${session.id}`)}
                className={`group w-full flex items-start gap-2 px-3 py-2.5 text-left transition-colors ${currentSession?.id === session.id ? 'bg-blue-600/10 border-r-2 border-blue-500' : 'hover:bg-gray-800/60'}`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 truncate font-medium">{session.title}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {session.updated_at ? formatDistanceToNow(new Date(session.updated_at), { addSuffix: true }) : ''}
                  </p>
                </div>
                <button onClick={e => deleteSession(session.id, e)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all flex-shrink-0 mt-0.5">
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 flex-shrink-0">
          <button onClick={() => setSidebarOpen(v => !v)} className="text-gray-500 hover:text-gray-300 transition-colors">
            <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-white">AI Chat</h1>
            <p className="text-[10px] text-gray-500">Operon SRE Intelligence · Powered by your integrations</p>
          </div>
          {!currentSession && (
            <button onClick={createNewSession} className="btn-primary text-xs py-1.5 px-3">
              <Sparkles className="w-3.5 h-3.5" /> New Chat
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {!currentSession ? (
            <div className="flex flex-col items-center justify-center h-full px-6 py-12">
              <div className="w-14 h-14 bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 border border-blue-800/40">
                <Bot className="w-7 h-7 text-blue-400" />
              </div>
              <h2 className="text-base font-semibold text-white mb-1">Operon SRE Intelligence</h2>
              <p className="text-sm text-gray-400 text-center mb-6 max-w-sm">Ask me about incidents, latency, deployments, or production health across all your integrations.</p>
              <button onClick={createNewSession} className="btn-primary mb-8"><Plus className="w-4 h-4" /> Start New Chat</button>
              {sessions.length > 0 && (
                <div className="w-full max-w-md">
                  <p className="text-xs text-gray-600 text-center mb-2 uppercase tracking-wider">Recent sessions</p>
                  <div className="space-y-1">
                    {sessions.slice(0, 4).map(s => (
                      <button key={s.id} onClick={() => navigate(`/chat/${s.id}`)}
                        className="w-full text-left text-sm text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors truncate">
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-2">
              {messages.length === 0 && !streamingMessage && !loading && (
                <div className="px-6 py-8 text-center">
                  <Bot className="mx-auto w-10 h-10 text-gray-700 mb-3" />
                  <h3 className="text-sm font-medium text-gray-400 mb-4">How can I help you today?</h3>
                  <div className="grid grid-cols-2 gap-2 max-w-xl mx-auto">
                    {QUICK_PROMPTS.map(({ label, prompt }) => (
                      <button key={label} onClick={() => handleSend(prompt)}
                        className="text-left px-3 py-2.5 text-xs text-gray-400 hover:text-gray-200 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-lg transition-all">
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 px-4 py-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-800/40">
                      <Bot className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                  )}
                  <div className={`max-w-[76%] ${msg.role === 'user' ? '' : 'flex-1 min-w-0'}`}>
                    {msg.role === 'user' ? (
                      <div className="bg-blue-600/20 border border-blue-700/30 rounded-xl rounded-tr-sm px-4 py-2.5">
                        <p className="text-sm text-gray-200">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="bg-gray-800/40 border border-gray-700/30 rounded-xl rounded-tl-sm px-4 py-3">
                        <MessageContent content={msg.content} />
                      </div>
                    )}
                    <p className="text-[10px] text-gray-600 mt-1 px-1">
                      {msg.created_at ? format(new Date(msg.created_at), 'HH:mm') : ''}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                  )}
                </div>
              ))}

              {loading && !streamingMessage && (
                <div className="flex gap-3 px-4 py-3">
                  <div className="w-7 h-7 bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-800/40">
                    <Bot className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="bg-gray-800/40 border border-gray-700/30 rounded-xl rounded-tl-sm px-4 py-3">
                    <TypingDots />
                  </div>
                </div>
              )}

              {streamingMessage && (
                <div className="flex gap-3 px-4 py-3">
                  <div className="w-7 h-7 bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-800/40">
                    <Bot className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-800/40 border border-gray-700/30 rounded-xl rounded-tl-sm px-4 py-3">
                      <MessageContent content={streamingMessage.content} streaming={!streamingMessage.isComplete} />
                    </div>
                    {streamingMessage.isComplete && streamingMessage.sources && streamingMessage.sources.length > 0 && (
                      <div className="mt-2 px-1">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 font-medium">Sources consulted</p>
                        <div className="flex flex-wrap gap-1.5">
                          {streamingMessage.sources.map((source, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-800 border border-gray-700/50 rounded-full text-[10px] text-gray-400">
                              {getSourceIcon(source)}
                              {source}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {currentSession && (
          <div className="px-4 py-3 border-t border-gray-800 flex-shrink-0">
            <div className="flex items-end gap-2 bg-gray-800/60 border border-gray-700/60 rounded-xl px-3 py-2.5 focus-within:border-blue-700/60 transition-colors">
              <textarea
                ref={inputRef}
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none resize-none max-h-28"
                placeholder="Ask about incidents, metrics, deployments..."
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button onClick={() => handleSend()} disabled={!inputMessage.trim() || loading}
                className="btn-primary py-1.5 px-3 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-gray-700 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
          </div>
        )}
      </div>
    </div>
  )
}
