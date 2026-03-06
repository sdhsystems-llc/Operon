import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { matchPipeline, QUICK_PROMPTS } from '../lib/agentPipeline'
import type { Pipeline } from '../lib/agentPipeline'
import { InvestigationPipeline } from '../components/chat/InvestigationPipeline'
import { PastInvestigationCard } from '../components/chat/pipeline/PastInvestigationCard'
import type { ChatSession, ChatMessage } from '../types/database.types'
import {
  Send, Bot, User, Plus, Trash2, MessageSquare, ChevronLeft, Sparkles,
} from 'lucide-react'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// Stored messages are plain text; only active workflow gets full agentic UI.
// We mark assistant messages with a special prefix to show them differently.
function PlainAssistantMsg({ content }: { content: string }) {
  const parts = content.split('\n')
  return (
    <div style={{ fontSize: '0.8rem', lineHeight: 1.65, color: '#d1d5db' }}>
      {parts.map((line, i) => {
        if (line.startsWith('## ')) return <p key={i} style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem', margin: '0.5rem 0 0.25rem' }}>{line.slice(3)}</p>
        if (line.startsWith('### ')) return <p key={i} style={{ fontWeight: 700, color: '#e5e7eb', fontSize: '0.83rem', margin: '0.5rem 0 0.125rem' }}>{line.slice(4)}</p>
        if (line.trim() === '') return <div key={i} style={{ height: '0.25rem' }} />
        return <p key={i} style={{ margin: '0.1rem 0' }}>{line}</p>
      })}
    </div>
  )
}

// ─── Pipeline State ───────────────────────────────────────────────────────────
interface LiveWorkflow {
  userMsgId: string
  workflow: Pipeline
  done: boolean
}
// donePipelines: keeps every completed investigation result permanently in the chat
type DonePipelinesMap = Record<string, Pipeline>

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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [liveWorkflow, setLiveWorkflow] = useState<LiveWorkflow | null>(null)
  const [donePipelines, setDonePipelines] = useState<DonePipelinesMap>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { if (user) loadSessions() }, [user])
  useEffect(() => { if (sessionId) loadSession(sessionId) }, [sessionId])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, liveWorkflow])

  const loadSessions = async () => {
    if (!user) return
    const { data } = await supabase.from('chat_sessions').select('*').eq('user_id', user.id).order('updated_at', { ascending: false })
    setSessions(data || [])
  }

  const loadSession = async (id: string) => {
    const { data: sd } = await supabase.from('chat_sessions').select('*').eq('id', id).maybeSingle()
    setCurrentSession(sd)
    const { data: md } = await supabase.from('chat_messages').select('*').eq('session_id', id).order('created_at', { ascending: true })
    setMessages(md || [])
    setLiveWorkflow(null)
    setDonePipelines({})
  }

  const createNewSession = async () => {
    if (!user) return
    const { data } = await supabase.from('chat_sessions').insert({ user_id: user.id, title: 'New Chat' }).select().single()
    if (!data) return
    setSessions([data, ...sessions])
    navigate(`/chat/${data.id}`)
  }

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await supabase.from('chat_messages').delete().eq('session_id', id)
    await supabase.from('chat_sessions').delete().eq('id', id)
    setSessions(prev => prev.filter(s => s.id !== id))
    if (currentSession?.id === id) { setCurrentSession(null); setMessages([]); navigate('/chat') }
  }

  const handleSend = async () => {
    if (!inputMessage.trim() || !currentSession || loading) return
    const query = inputMessage.trim()
    setInputMessage('')
    setLoading(true)

    // Save user message
    const { data: userMsg } = await supabase.from('chat_messages').insert({ session_id: currentSession.id, role: 'user', content: query }).select().single()
    if (!userMsg) { setLoading(false); return }
    setMessages(prev => [...prev, userMsg])

    // Update session title
    if (messages.length === 0) {
      const title = query.slice(0, 52) + (query.length > 52 ? '…' : '')
      await supabase.from('chat_sessions').update({ title, updated_at: new Date().toISOString() }).eq('id', currentSession.id)
      setCurrentSession({ ...currentSession, title })
      setSessions(prev => prev.map(s => s.id === currentSession.id ? { ...s, title } : s))
    } else {
      await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', currentSession.id)
    }

    // Start agentic pipeline
    const workflow = matchPipeline(query)
    setLiveWorkflow({ userMsgId: userMsg.id, workflow, done: false })
    setLoading(false)
  }

  const handleWorkflowComplete = async (synthesis: string) => {
    if (!currentSession || !liveWorkflow) return
    // Persist synthesis to Supabase — shown as PlainAssistantMsg on future session loads
    await supabase.from('chat_messages').insert({ session_id: currentSession.id, role: 'assistant', content: synthesis })
    // Move this pipeline to the permanent done map so it stays visible in the conversation
    const { userMsgId, workflow } = liveWorkflow
    setDonePipelines(prev => ({ ...prev, [userMsgId]: workflow }))
    // Clear liveWorkflow so a new investigation can start
    setLiveWorkflow(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100%', background: '#0d0f14' }}>

      {/* Session Sidebar */}
      <div style={{ width: sidebarOpen ? 260 : 0, minWidth: sidebarOpen ? 260 : 0, overflow: 'hidden', transition: 'all 0.2s', background: '#111318', borderRight: '1px solid #1f2133', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0.75rem', borderBottom: '1px solid #1f2133', flexShrink: 0 }}>
          <button onClick={createNewSession} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem', borderRadius: 9, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
            <Plus style={{ width: 15, height: 15 }} /> New Chat
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {sessions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <MessageSquare style={{ width: 24, height: 24, color: '#374151', margin: '0 auto 0.5rem' }} />
              <p style={{ fontSize: '0.75rem', color: '#4b5563' }}>No chats yet</p>
            </div>
          )}
          {sessions.map(s => (
            <button key={s.id} onClick={() => navigate(`/chat/${s.id}`)} style={{ width: '100%', textAlign: 'left', padding: '0.625rem 0.75rem', borderRadius: 8, border: 'none', background: currentSession?.id === s.id ? 'rgba(99,102,241,0.15)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 2 }}
              onMouseOver={e => { if (currentSession?.id !== s.id) e.currentTarget.style.background = '#1f2133' }}
              onMouseOut={e => { if (currentSession?.id !== s.id) e.currentTarget.style.background = 'transparent' }}
            >
              <MessageSquare style={{ width: 13, height: 13, flexShrink: 0, color: currentSession?.id === s.id ? '#6366f1' : '#374151' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 500, color: '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{s.title}</p>
                <p style={{ fontSize: '0.68rem', color: '#4b5563', margin: 0 }}>{timeAgo(s.updated_at)}</p>
              </div>
              <button onClick={e => deleteSession(e, s.id)} style={{ padding: '0.2rem', borderRadius: 5, border: 'none', background: 'transparent', color: '#374151', cursor: 'pointer', opacity: 0, flexShrink: 0 }}
                onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#f87171' }}
                onMouseOut={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.color = '#374151' }}
              >
                <Trash2 style={{ width: 11, height: 11 }} />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid #1f2133', background: '#111318', flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{ padding: '0.375rem', borderRadius: 7, border: 'none', background: 'transparent', color: '#4b5563', cursor: 'pointer' }}
            onMouseOver={e => e.currentTarget.style.background = '#1f2133'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            <ChevronLeft style={{ width: 16, height: 16, transform: sidebarOpen ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s' }} />
          </button>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot style={{ width: 16, height: 16, color: '#6366f1' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', margin: 0 }}>{currentSession?.title ?? 'Operon AI'}</p>
            <p style={{ fontSize: '0.68rem', color: '#4b5563', margin: 0 }}>Multi-agent SRE intelligence · {liveWorkflow && !liveWorkflow.done ? '⚡ Agents working...' : 'Ready'}</p>
          </div>
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1rem' }}>
          {!currentSession ? (
            /* Welcome screen */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '2rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Sparkles style={{ width: 30, height: 30, color: '#6366f1' }} />
              </div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Operon AI</h2>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: 420, marginBottom: '0.5rem' }}>Multi-agent SRE intelligence. Ask about incidents and Operon will plan, dispatch specialized agents, and synthesize findings in real time.</p>
              <p style={{ fontSize: '0.78rem', color: '#374151', marginBottom: '2rem' }}>Powered by: Sentinel · Arbiter · Navigator · Cortex · Patcher</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.625rem', width: '100%', maxWidth: 520 }}>
                {QUICK_PROMPTS.map(p => (
                  <button key={p.label} onClick={() => { createNewSession().then(() => setInputMessage(p.prompt)) }} style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: 12, border: '1px solid #1f2133', background: '#161821', color: '#9ca3af', cursor: 'pointer', fontSize: '0.8rem', lineHeight: 1.4 }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#fff' }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = '#1f2133'; e.currentTarget.style.color = '#9ca3af' }}
                  >{p.label}</button>
                ))}
              </div>
            </div>
          ) : messages.length === 0 && !liveWorkflow ? (
            /* Empty session */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
              <Bot style={{ width: 40, height: 40, color: '#1f2937', marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>What do you need investigated?</p>
              <p style={{ fontSize: '0.78rem', color: '#374151', marginBottom: '1.5rem' }}>Operon will plan and dispatch the right agents automatically</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', maxWidth: 560 }}>
                {QUICK_PROMPTS.map(p => (
                  <button key={p.label} onClick={() => setInputMessage(p.prompt)} style={{ fontSize: '0.75rem', padding: '0.375rem 0.875rem', borderRadius: 20, border: '1px solid #1f2133', background: '#161821', color: '#9ca3af', cursor: 'pointer' }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; e.currentTarget.style.color = '#a5b4fc'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)' }}
                    onMouseOut={e => { e.currentTarget.style.background = '#161821'; e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#1f2133' }}
                  >{p.label}</button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 780, margin: '0 auto' }}>
              {messages.map((msg, idx) => {
                // Which kind of result does this message have?
                const donePipeline = msg.role === 'user' ? donePipelines[msg.id] : undefined
                const isLiveTarget  = liveWorkflow?.userMsgId === msg.id

                // Skip rendering an assistant plain-text message if the user message
                // before it has a done pipeline (pipeline card shows the result instead).
                // On future session reloads (no liveWorkflow/donePipelines), it renders normally.
                const prevMsg = idx > 0 ? messages[idx - 1] : null
                const prevHasPipeline = prevMsg && (!!donePipelines[prevMsg.id] || liveWorkflow?.userMsgId === prevMsg.id)
                const skipAssistant = msg.role === 'assistant' && !!prevHasPipeline

                return (
                  <div key={msg.id}>
                    {/* ── User bubble ── */}
                    {msg.role === 'user' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', alignItems: 'flex-start' }}>
                        <div style={{ maxWidth: '72%', background: '#6366f1', borderRadius: '14px 14px 4px 14px', padding: '0.75rem 1rem' }}>
                          <p style={{ fontSize: '0.875rem', color: '#fff', margin: 0 }}>{msg.content}</p>
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User style={{ width: 14, height: 14, color: '#9ca3af' }} />
                        </div>
                      </div>
                    )}

                    {/* ── Historical assistant message (plain text, shown on reload) ── */}
                    {!skipAssistant && msg.role === 'assistant' && (
                      <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Bot style={{ width: 14, height: 14, color: '#6366f1' }} />
                        </div>
                        <div style={{ flex: 1, background: '#161821', border: '1px solid #1f2133', borderRadius: '4px 14px 14px 14px', padding: '0.875rem 1rem' }}>
                          <PlainAssistantMsg content={msg.content} />
                          <p style={{ fontSize: '0.65rem', color: '#374151', margin: '0.5rem 0 0' }}>{timeAgo(msg.created_at)} · Operon AI</p>
                        </div>
                      </div>
                    )}

                    {/* ── DONE pipeline — permanent result card, stays in chat forever ── */}
                    {donePipeline && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                          <Bot style={{ width: 14, height: 14, color: '#6366f1' }} />
                        </div>
                        <PastInvestigationCard
                          pipeline={donePipeline}
                          onFollowUp={(text) => setInputMessage(text)}
                        />
                      </div>
                    )}

                    {/* ── LIVE pipeline — animated, running right now ── */}
                    {isLiveTarget && liveWorkflow && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                          <Bot style={{ width: 14, height: 14, color: '#6366f1' }} />
                        </div>
                        <InvestigationPipeline
                          pipeline={liveWorkflow.workflow}
                          onComplete={handleWorkflowComplete}
                          onFollowUp={(text) => setInputMessage(text)}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div style={{ padding: '1rem', borderTop: '1px solid #1f2133', background: '#0d0f14', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-end', maxWidth: 780, margin: '0 auto' }}>
            <textarea ref={inputRef} rows={1} value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || !currentSession || (!!liveWorkflow && !liveWorkflow.done)}
              placeholder={!currentSession ? 'Start a new chat first' : (liveWorkflow && !liveWorkflow.done) ? '⚡ Agents are investigating...' : 'Ask about incidents, metrics, or request an investigation…'}
              style={{ flex: 1, resize: 'none', borderRadius: 12, padding: '0.75rem 1rem', fontSize: '0.875rem', background: '#161821', border: '1px solid #1f2133', color: '#e5e7eb', outline: 'none', minHeight: 44, maxHeight: 160, opacity: (!currentSession || (!!liveWorkflow && !liveWorkflow.done)) ? 0.5 : 1 }}
              onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
              onBlur={e => e.currentTarget.style.borderColor = '#1f2133'}
            />
            <button onClick={handleSend}
              disabled={!inputMessage.trim() || loading || !currentSession || (!!liveWorkflow && !liveWorkflow.done)}

              style={{ width: 44, height: 44, borderRadius: 12, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: (!inputMessage.trim() || loading || !currentSession) ? 0.4 : 1, transition: 'opacity 0.15s' }}>
              <Send style={{ width: 16, height: 16 }} />
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.65rem', color: '#1f2937', marginTop: '0.5rem' }}>
            Enter to send · Shift+Enter for new line · Operon dispatches specialized agents per query
          </p>
        </div>
      </div>
    </div>
  )
}
