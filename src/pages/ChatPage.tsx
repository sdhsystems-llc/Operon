import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getAIResponse } from '../lib/aiResponses'
import type { ChatSession, ChatMessage } from '../types/database.types'
// date-fns v4 removed addSuffix option; use a helper instead
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
import {
  Send, Bot, User, Plus, Trash2, MessageSquare, ChevronLeft,
  Database, Activity, BarChart3, Cloud, AlertTriangle, Loader2,
  Copy, Check, Sparkles,
} from 'lucide-react'

interface StreamingMessage {
  id: string
  content: string
  isComplete: boolean
  sources?: string[]
}

const QUICK_PROMPTS = [
  { label: 'Checkout latency spike',  prompt: 'Why is checkout service experiencing latency spikes?' },
  { label: 'Root cause analysis',     prompt: 'Identify the root cause of the current incident' },
  { label: 'Current p99 metrics',     prompt: 'Show me current production metrics and p99 latency' },
  { label: 'Remediation steps',       prompt: 'What remediation steps do you recommend?' },
  { label: 'Correlate events',        prompt: 'Correlate events across all integrations in the last 2 hours' },
  { label: 'Service health',          prompt: 'Check deployment health status across all services' },
]

function getSourceIcon(source: string) {
  const lower = source.toLowerCase()
  if (lower.includes('postgres') || lower.includes('sql') || lower.includes('rds') || lower.includes('redis'))
    return <Database className="w-3 h-3" />
  if (lower.includes('datadog') || lower.includes('grafana') || lower.includes('prometheus'))
    return <BarChart3 className="w-3 h-3" />
  if (lower.includes('aws') || lower.includes('cloud') || lower.includes('azure'))
    return <Cloud className="w-3 h-3" />
  if (lower.includes('pagerduty') || lower.includes('alert'))
    return <AlertTriangle className="w-3 h-3" />
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
    <div className="my-3 rounded-lg overflow-hidden" style={{ border: '1px solid #374151' }}>
      <div className="flex items-center justify-between px-4 py-2" style={{ background: '#1f2937', borderBottom: '1px solid #374151' }}>
        <span className="text-xs font-medium font-mono" style={{ color: '#9ca3af' }}>{lang || 'code'}</span>
        <button onClick={copy} className="flex items-center gap-1 text-xs transition-colors" style={{ color: copied ? '#34d399' : '#6b7280' }}>
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="px-4 py-3 overflow-x-auto text-xs leading-relaxed" style={{ background: '#111827' }}>
        <code className="font-mono whitespace-pre" style={{ color: '#d1d5db' }}>{code}</code>
      </pre>
    </div>
  )
}

function MessageContent({ content, streaming }: { content: string; streaming?: boolean }) {
  const parts = content.split(/(```[\s\S]*?```)/g)
  return (
    <div className="text-sm leading-relaxed" style={{ color: '#e5e7eb' }}>
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
              if (seg.startsWith('**') && seg.endsWith('**'))
                return <strong key={j} className="font-semibold" style={{ color: '#fff' }}>{seg.slice(2, -2)}</strong>
              return seg.split('\n').map((line, k, arr) => (
                <span key={k}>{line}{k < arr.length - 1 && <br />}</span>
              ))
            })}
          </span>
        )
      })}
      {streaming && <span className="inline-block w-0.5 h-3.5 ml-0.5 align-middle animate-pulse" style={{ background: '#6366f1' }} />}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const streamIntervalRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load sessions when user is ready
  useEffect(() => { if (user) loadSessions() }, [user])

  // Load session from URL param
  useEffect(() => { if (sessionId) loadSession(sessionId) }, [sessionId])

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMessage])

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (streamIntervalRef.current) clearInterval(streamIntervalRef.current) }
  }, [])

  const loadSessions = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
      if (error) throw error
      setSessions(data || [])
    } catch (err) {
      console.error('Error loading sessions:', err)
    }
  }

  const loadSession = async (id: string) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions').select('*').eq('id', id).maybeSingle()
      if (sessionError) throw sessionError
      setCurrentSession(sessionData)

      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages').select('*').eq('session_id', id).order('created_at', { ascending: true })
      if (messagesError) throw messagesError
      setMessages(messagesData || [])
    } catch (err) {
      console.error('Error loading session:', err)
    }
  }

  const createNewSession = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({ user_id: user.id, title: 'New Chat' })
        .select().single()
      if (error) throw error
      setSessions([data, ...sessions])
      navigate(`/chat/${data.id}`)
    } catch (err) {
      console.error('Error creating session:', err)
    }
  }

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await supabase.from('chat_messages').delete().eq('session_id', id)
      await supabase.from('chat_sessions').delete().eq('id', id)
      setSessions(prev => prev.filter(s => s.id !== id))
      if (currentSession?.id === id) { setCurrentSession(null); setMessages([]); navigate('/chat') }
    } catch (err) {
      console.error('Error deleting session:', err)
    }
  }

  const simulateStreaming = useCallback(async (fullContent: string, sources: string[], sid: string) => {
    const words = fullContent.split(' ')
    let currentContent = ''
    const tempId = `streaming-${Date.now()}`

    setStreamingMessage({ id: tempId, content: '', isComplete: false, sources })

    return new Promise<void>((resolve) => {
      let wordIndex = 0
      streamIntervalRef.current = window.setInterval(() => {
        if (wordIndex < words.length) {
          currentContent += (wordIndex > 0 ? ' ' : '') + words[wordIndex]
          setStreamingMessage({ id: tempId, content: currentContent, isComplete: false, sources })
          wordIndex++
        } else {
          if (streamIntervalRef.current) clearInterval(streamIntervalRef.current)
          setStreamingMessage({ id: tempId, content: currentContent, isComplete: true, sources })

          setTimeout(async () => {
            try {
              const { data: aiMsg, error: aiError } = await supabase
                .from('chat_messages')
                .insert({ session_id: sid, role: 'assistant', content: fullContent })
                .select().single()
              if (!aiError && aiMsg) setMessages(prev => [...prev, aiMsg])
            } catch (err) {
              console.error('Error saving AI message:', err)
            }
            setStreamingMessage(null)
            resolve()
          }, 500)
        }
      }, 35)
    })
  }, [])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || loading || !user) return
    const userMessage = inputMessage.trim()
    setInputMessage('')
    setLoading(true)

    try {
      const { data: userMsg, error: userError } = await supabase
        .from('chat_messages')
        .insert({ session_id: currentSession.id, role: 'user', content: userMessage })
        .select().single()
      if (userError) throw userError
      setMessages(prev => [...prev, userMsg])

      if (messages.length === 0) {
        const title = userMessage.substring(0, 50)
        await supabase.from('chat_sessions')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', currentSession.id)
        setCurrentSession({ ...currentSession, title })
        setSessions(prev => prev.map(s => s.id === currentSession.id ? { ...s, title } : s))
      } else {
        await supabase.from('chat_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', currentSession.id)
      }

      const aiResponse = getAIResponse(userMessage)
      await simulateStreaming(aiResponse.content, aiResponse.sources || [], currentSession.id)
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-4rem)]" style={{ background: 'var(--bg-base)' }}>

      {/* Sidebar */}
      <div className="flex-shrink-0 flex flex-col transition-all duration-200 overflow-hidden"
        style={{ width: sidebarOpen ? 260 : 0, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>
        <div className="p-3 flex flex-col gap-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <button onClick={createNewSession}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'var(--accent)', color: '#fff' }}>
            <Plus className="h-4 w-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sessions.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="h-6 w-6 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No chats yet</p>
            </div>
          )}
          {sessions.map(session => (
            <button key={session.id} onClick={() => navigate(`/chat/${session.id}`)}
              className="w-full text-left px-3 py-2.5 rounded-lg group flex items-center gap-2 transition-colors"
              style={{ background: currentSession?.id === session.id ? 'var(--accent-light)' : 'transparent' }}
              onMouseEnter={e => { if (currentSession?.id !== session.id) e.currentTarget.style.background = 'var(--bg-elevated)' }}
              onMouseLeave={e => { if (currentSession?.id !== session.id) e.currentTarget.style.background = 'transparent' }}>
              <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" style={{ color: currentSession?.id === session.id ? 'var(--accent)' : 'var(--text-muted)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{session.title}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {timeAgo(session.updated_at)}
                </p>
              </div>
              <button onClick={e => deleteSession(e, session.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                style={{ color: 'var(--text-muted)' }}>
                <Trash2 className="h-3 w-3" />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <button onClick={() => setSidebarOpen(o => !o)} className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <ChevronLeft className="h-4 w-4 transition-transform" style={{ transform: sidebarOpen ? 'none' : 'rotate(180deg)' }} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-light)' }}>
              <Bot className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {currentSession ? currentSession.title : 'Operon AI'}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>SRE Intelligence · Context-aware</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6" style={{ background: '#0d0f14' }}>
          {!currentSession ? (
            /* Welcome screen */
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Sparkles className="h-8 w-8" style={{ color: '#6366f1' }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#fff' }}>Operon AI Assistant</h2>
              <p className="text-sm mb-8 max-w-sm" style={{ color: '#9ca3af' }}>
                Ask about incidents, correlate events, get remediation suggestions, or analyze system health.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {QUICK_PROMPTS.map(p => (
                  <button key={p.label} onClick={() => { createNewSession(); setInputMessage(p.prompt) }}
                    className="text-left px-4 py-3 rounded-xl text-xs transition-colors"
                    style={{ background: '#161821', border: '1px solid #1f2133', color: '#a1a1aa' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1f2133'; e.currentTarget.style.color = '#a1a1aa' }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : messages.length === 0 && !streamingMessage ? (
            /* Empty session */
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="h-10 w-10 mb-3" style={{ color: '#374151' }} />
              <p className="text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>How can I help you?</p>
              <p className="text-xs mb-6" style={{ color: '#4b5563' }}>Ask about current incidents, metrics, or request an investigation</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {QUICK_PROMPTS.map(p => (
                  <button key={p.label} onClick={() => setInputMessage(p.prompt)}
                    className="text-xs px-3 py-1.5 rounded-full transition-colors"
                    style={{ background: '#161821', border: '1px solid #1f2133', color: '#a1a1aa' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#161821'; e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.borderColor = '#1f2133' }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(message => (
                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5" style={{ background: 'rgba(99,102,241,0.2)' }}>
                      <Bot className="h-3.5 w-3.5" style={{ color: '#6366f1' }} />
                    </div>
                  )}
                  <div className={`max-w-2xl ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}>
                    <div className="rounded-xl px-4 py-3"
                      style={message.role === 'user'
                        ? { background: '#6366f1', color: '#fff' }
                        : { background: '#161821', border: '1px solid #1f2133' }}>
                      {message.role === 'assistant'
                        ? <MessageContent content={message.content} />
                        : <p className="text-sm" style={{ color: '#fff' }}>{message.content}</p>}
                    </div>
                    <p className="text-[10px] mt-1 px-1" style={{ color: '#4b5563' }}>
                      {timeAgo(message.created_at)}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5" style={{ background: '#1f2937' }}>
                      <User className="h-3.5 w-3.5" style={{ color: '#9ca3af' }} />
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming message */}
              {streamingMessage && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5" style={{ background: 'rgba(99,102,241,0.2)' }}>
                    <Bot className="h-3.5 w-3.5" style={{ color: '#6366f1' }} />
                  </div>
                  <div className="max-w-2xl mr-12">
                    <div className="rounded-xl px-4 py-3" style={{ background: '#161821', border: '1px solid #1f2133' }}>
                      <MessageContent content={streamingMessage.content} streaming={!streamingMessage.isComplete} />
                      {!streamingMessage.content && <div className="flex items-center gap-1 py-1">
                        {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#4b5563', animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }} />)}
                      </div>}
                    </div>
                    {streamingMessage.sources && streamingMessage.sources.length > 0 && streamingMessage.isComplete && (
                      <div className="flex flex-wrap gap-1.5 mt-2 px-1">
                        <span className="text-[10px]" style={{ color: '#4b5563' }}>Sources:</span>
                        {streamingMessage.sources.map((source, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#1f2937', border: '1px solid #374151', color: '#9ca3af' }}>
                            {getSourceIcon(source)} {source}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loading spinner */}
              {loading && !streamingMessage && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.2)' }}>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: '#6366f1' }} />
                  </div>
                  <div className="rounded-xl px-4 py-3" style={{ background: '#161821', border: '1px solid #1f2133' }}>
                    <p className="text-xs" style={{ color: '#6b7280' }}>Analyzing your request…</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input bar */}
        <div className="flex-shrink-0 p-4" style={{ background: '#0d0f14', borderTop: '1px solid #1f2133' }}>
          <div className="flex gap-2 items-end max-w-4xl mx-auto">
            <textarea ref={inputRef} rows={1} value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentSession ? 'Ask about incidents, metrics, or request an investigation…' : 'Start a new chat first'}
              disabled={loading || !currentSession}
              className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              style={{ background: '#161821', border: '1px solid #1f2133', color: '#e5e7eb', minHeight: 44, maxHeight: 200 }}
              onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
              onBlur={e => e.currentTarget.style.borderColor = '#1f2133'} />
            <button onClick={handleSendMessage}
              disabled={!inputMessage.trim() || loading || !currentSession}
              className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#6366f1' }}>
              <Send className="h-4 w-4" style={{ color: '#fff' }} />
            </button>
          </div>
          <p className="text-center text-[10px] mt-2" style={{ color: '#374151' }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
