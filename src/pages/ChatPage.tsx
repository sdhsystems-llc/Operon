import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getAIResponse } from '../lib/aiResponses';
import type { ChatSession, ChatMessage } from '../types/database.types';
import { Send, Bot, User, Sparkles, Loader2, Database, Activity, BarChart3, Cloud } from 'lucide-react';

interface StreamingMessage {
  id: string;
  content: string;
  isComplete: boolean;
  sources?: string[];
}

export const ChatPage = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    } else if (sessions.length > 0 && !currentSession) {
      navigate(`/chat/${sessions[0].id}`);
    }
  }, [sessionId, sessions]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadSession = async (id: string) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (sessionError) throw sessionError;
      setCurrentSession(sessionData);

      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const createNewSession = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: 'New Chat',
        })
        .select()
        .single();

      if (error) throw error;
      setSessions([data, ...sessions]);
      navigate(`/chat/${data.id}`);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const simulateStreaming = async (fullContent: string, sources: string[], sessionId: string) => {
    const words = fullContent.split(' ');
    let currentContent = '';
    const tempId = `streaming-${Date.now()}`;

    setStreamingMessage({
      id: tempId,
      content: '',
      isComplete: false,
      sources,
    });

    return new Promise<void>((resolve) => {
      let wordIndex = 0;

      streamIntervalRef.current = window.setInterval(() => {
        if (wordIndex < words.length) {
          currentContent += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
          setStreamingMessage({
            id: tempId,
            content: currentContent,
            isComplete: false,
            sources,
          });
          wordIndex++;
        } else {
          if (streamIntervalRef.current) {
            clearInterval(streamIntervalRef.current);
          }
          setStreamingMessage({
            id: tempId,
            content: currentContent,
            isComplete: true,
            sources,
          });

          setTimeout(async () => {
            try {
              const { data: aiMsg, error: aiError } = await supabase
                .from('chat_messages')
                .insert({
                  session_id: sessionId,
                  role: 'assistant',
                  content: fullContent,
                })
                .select()
                .single();

              if (!aiError && aiMsg) {
                setMessages((prev) => [...prev, aiMsg]);
              }
            } catch (error) {
              console.error('Error saving AI message:', error);
            }
            setStreamingMessage(null);
            resolve();
          }, 500);
        }
      }, 50);
    });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || loading || !user) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    try {
      const { data: userMsg, error: userError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSession.id,
          role: 'user',
          content: userMessage,
        })
        .select()
        .single();

      if (userError) throw userError;
      setMessages((prev) => [...prev, userMsg]);

      if (messages.length === 0) {
        const title = userMessage.substring(0, 50);
        await supabase
          .from('chat_sessions')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', currentSession.id);

        setCurrentSession({ ...currentSession, title });
        setSessions((prev) =>
          prev.map((s) => (s.id === currentSession.id ? { ...s, title } : s))
        );
      } else {
        await supabase
          .from('chat_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', currentSession.id);
      }

      const aiResponse = getAIResponse(userMessage);
      await simulateStreaming(aiResponse.content, aiResponse.sources || [], currentSession.id);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).split('\n');
        const language = lines[0].trim();
        const code = lines.slice(1).join('\n');

        return (
          <div key={index} className="my-4 rounded-lg overflow-hidden border border-secondary-300">
            <div className="bg-secondary-800 text-secondary-200 px-4 py-2 text-xs font-mono flex items-center justify-between">
              <span>{language || 'code'}</span>
            </div>
            <pre className="bg-secondary-900 text-secondary-100 p-4 overflow-x-auto">
              <code className="text-sm font-mono">{code}</code>
            </pre>
          </div>
        );
      }

      return (
        <p key={index} className="whitespace-pre-wrap">
          {part}
        </p>
      );
    });
  };

  const getSourceIcon = (source: string) => {
    const lower = source.toLowerCase();
    if (lower.includes('database') || lower.includes('postgres') || lower.includes('sql')) {
      return <Database className="h-3 w-3" />;
    }
    if (lower.includes('datadog') || lower.includes('grafana')) {
      return <BarChart3 className="h-3 w-3" />;
    }
    if (lower.includes('aws') || lower.includes('cloud')) {
      return <Cloud className="h-3 w-3" />;
    }
    return <Activity className="h-3 w-3" />;
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-12rem)]">
      <div className="flex gap-6 h-full">
        <div className="w-64 card flex-shrink-0 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-secondary-200">
            <button onClick={createNewSession} className="w-full btn-primary text-sm">
              <Sparkles className="h-4 w-4 mr-2" />
              New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => navigate(`/chat/${session.id}`)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                  currentSession?.id === session.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'hover:bg-secondary-50 text-secondary-700'
                }`}
              >
                <p className="text-sm font-medium truncate">{session.title}</p>
                <p className="text-xs text-secondary-500 mt-1">
                  {new Date(session.updated_at).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 card flex flex-col overflow-hidden">
          {!currentSession ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <Bot className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-medium text-secondary-900 mb-2">
                  Welcome to Operon AI Assistant
                </h3>
                <p className="text-sm text-secondary-600 mb-4">
                  Start a new chat to investigate incidents and optimize your systems
                </p>
                <button onClick={createNewSession} className="btn-primary">
                  Start New Chat
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 && !streamingMessage ? (
                  <div className="text-center py-12">
                    <Bot className="mx-auto h-12 w-12 text-secondary-400 mb-4" />
                    <h3 className="text-lg font-medium text-secondary-900 mb-2">
                      How can I help you today?
                    </h3>
                    <p className="text-sm text-secondary-600 mb-6">
                      Ask me about incidents, system health, or any operational questions
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      <button
                        onClick={() => setInputMessage('Why is my database slow?')}
                        className="p-4 text-left border border-secondary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        <p className="text-sm font-medium text-secondary-900">Database Performance</p>
                        <p className="text-xs text-secondary-600 mt-1">Investigate slow queries</p>
                      </button>
                      <button
                        onClick={() => setInputMessage('Help me set up monitoring')}
                        className="p-4 text-left border border-secondary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        <p className="text-sm font-medium text-secondary-900">Monitoring Setup</p>
                        <p className="text-xs text-secondary-600 mt-1">Configure alerts and SLOs</p>
                      </button>
                      <button
                        onClick={() => setInputMessage('API latency is high')}
                        className="p-4 text-left border border-secondary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        <p className="text-sm font-medium text-secondary-900">API Latency</p>
                        <p className="text-xs text-secondary-600 mt-1">Diagnose performance issues</p>
                      </button>
                      <button
                        onClick={() => setInputMessage('Optimize our costs')}
                        className="p-4 text-left border border-secondary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        <p className="text-sm font-medium text-secondary-900">Cost Optimization</p>
                        <p className="text-xs text-secondary-600 mt-1">Reduce infrastructure costs</p>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary-600" />
                          </div>
                        )}
                        <div className="max-w-3xl flex-1">
                          <div
                            className={`rounded-lg p-4 ${
                              message.role === 'user'
                                ? 'bg-primary-600 text-white ml-auto max-w-2xl'
                                : 'bg-secondary-50 text-secondary-900'
                            }`}
                          >
                            <div className="text-sm">
                              {message.role === 'assistant'
                                ? formatMessageContent(message.content)
                                : message.content}
                            </div>
                            <p
                              className={`text-xs mt-2 ${
                                message.role === 'user' ? 'text-primary-100' : 'text-secondary-500'
                              }`}
                            >
                              {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        {message.role === 'user' && (
                          <div className="flex-shrink-0 w-8 h-8 bg-secondary-200 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-secondary-600" />
                          </div>
                        )}
                      </div>
                    ))}

                    {streamingMessage && (
                      <div className="flex gap-3 justify-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary-600" />
                        </div>
                        <div className="max-w-3xl flex-1">
                          <div className="rounded-lg p-4 bg-secondary-50 text-secondary-900">
                            <div className="text-sm">
                              {formatMessageContent(streamingMessage.content)}
                              {!streamingMessage.isComplete && (
                                <span className="inline-block w-2 h-4 bg-primary-600 ml-1 animate-pulse" />
                              )}
                            </div>
                          </div>
                          {streamingMessage.sources && streamingMessage.sources.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="text-xs text-secondary-600 font-medium">Sources:</span>
                              {streamingMessage.sources.map((source, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-secondary-200 rounded-md text-xs text-secondary-700"
                                >
                                  {getSourceIcon(source)}
                                  {source}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {loading && !streamingMessage && (
                      <div className="flex gap-3 justify-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary-600" />
                        </div>
                        <div className="rounded-lg p-4 bg-secondary-50">
                          <div className="flex items-center gap-2 text-secondary-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Analyzing your request...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-secondary-200 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your systems..."
                    className="input-field flex-1"
                    disabled={loading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || loading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
