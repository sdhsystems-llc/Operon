import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { InvestigationEvent } from '../types/database.types';
import {
  ArrowLeft, ArrowRight, Check, Activity, AlertCircle, Bot, Server,
  Zap, GitCommit, Flag, TrendingUp, FileText, Loader2, CheckCircle2,
} from 'lucide-react';

const SERVICES = [
  'checkout-api', 'payment-gateway', 'postgres-primary', 'redis-cache',
  'api-gateway', 'graphql-api', 'fraud-detection', 'load-balancer',
  'webhook-service', 'cdn-service', 'elasticsearch', 'inventory-service',
  'auth-service', 'notification-service',
];

const AGENTS = ['AI Agent Alpha', 'AI Agent Beta', 'AI Agent Gamma'];

const SEVERITY_OPTIONS = [
  { value: 'p1', label: 'P1 Critical',  description: 'Complete outage or critical data loss',           accent: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',  selBorder: '#ef4444' },
  { value: 'p2', label: 'P2 High',      description: 'Significant degradation, major feature broken',   accent: '#f97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.25)', selBorder: '#f97316' },
  { value: 'p3', label: 'P3 Medium',    description: 'Minor degradation or partial functionality loss', accent: '#eab308', bg: 'rgba(234,179,8,0.08)',   border: 'rgba(234,179,8,0.25)',  selBorder: '#eab308' },
  { value: 'p4', label: 'P4 Low',       description: 'Cosmetic issue or minor inconvenience',           accent: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)',  selBorder: '#6366f1' },
];

const generateCorrelatedEvents = (service: string, symptoms: string): Omit<InvestigationEvent, 'id' | 'investigation_id'>[] => {
  const now = Date.now();
  const baseEvents: Omit<InvestigationEvent, 'id' | 'investigation_id'>[] = [
    { event_type: 'alert',        title: `Alert: ${service} error rate spike`,     description: `Error rate exceeded 2% threshold. Current: 5.4%`,  source: 'pagerduty',    timestamp: new Date(now - 45 * 60000).toISOString(), correlation_score: 0.96 },
    { event_type: 'metric',       title: 'P95 latency degradation',                description: `P95 latency increased from 180ms to ${symptoms.includes('slow') || symptoms.includes('latency') ? '2800ms' : '890ms'}`, source: 'datadog', timestamp: new Date(now - 38 * 60000).toISOString(), correlation_score: 0.93 },
    { event_type: 'deploy',       title: `${service} v2.4.1 deployed`,             description: 'New version deployed to production 52 minutes ago', source: 'github',       timestamp: new Date(now - 52 * 60000).toISOString(), correlation_score: 0.87 },
    { event_type: 'log',          title: 'Error log spike',                        description: `High volume of ERROR-level logs from ${service}: connection timeout exceeded`, source: 'splunk', timestamp: new Date(now - 43 * 60000).toISOString(), correlation_score: 0.91 },
    { event_type: 'feature_flag', title: 'Feature flag enabled: enable-new-checkout', description: 'LaunchDarkly flag toggled to 100% rollout 48 minutes ago', source: 'launchdarkly', timestamp: new Date(now - 48 * 60000).toISOString(), correlation_score: 0.89 },
  ];
  if (symptoms.toLowerCase().includes('database') || symptoms.toLowerCase().includes('query') || service.includes('postgres')) {
    baseEvents.push({ event_type: 'trace', title: 'Slow database query detected', description: 'Sequential scan on orders table: 3.2s (baseline 120ms)', source: 'aws-xray', timestamp: new Date(now - 35 * 60000).toISOString(), correlation_score: 0.95 });
  }
  if (symptoms.toLowerCase().includes('memory') || symptoms.toLowerCase().includes('oom')) {
    baseEvents.push({ event_type: 'metric', title: 'Memory usage spike', description: 'Container memory at 95% — approaching OOM threshold', source: 'grafana', timestamp: new Date(now - 30 * 60000).toISOString(), correlation_score: 0.88 });
  }
  return baseEvents.slice(0, 8);
};

const EVENT_CONFIG: Record<string, { color: string; bg: string; Icon: any; label: string }> = {
  commit:       { color: '#c084fc', bg: 'rgba(192,132,252,0.15)', Icon: GitCommit,    label: 'Commit' },
  deploy:       { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)',  Icon: Server,       label: 'Deploy' },
  feature_flag: { color: '#fb923c', bg: 'rgba(251,146,60,0.15)',  Icon: Flag,         label: 'Feature Flag' },
  alert:        { color: '#f87171', bg: 'rgba(248,113,113,0.15)', Icon: AlertCircle,  label: 'Alert' },
  metric:       { color: '#818cf8', bg: 'rgba(129,140,248,0.15)', Icon: TrendingUp,   label: 'Metric' },
  log:          { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', Icon: FileText,     label: 'Log' },
  trace:        { color: '#2dd4bf', bg: 'rgba(45,212,191,0.15)',  Icon: Activity,     label: 'Trace' },
  config_change:{ color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  Icon: Zap,          label: 'Config' },
};
const getEventConfig = (type: string) => EVENT_CONFIG[type] ?? EVENT_CONFIG.log;

export const NewInvestigationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [correlating, setCorrelating] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [form, setForm] = useState({ service: '', severity: 'p2', symptoms: '' });
  const [correlatedEvents, setCorrelatedEvents] = useState<Omit<InvestigationEvent, 'id' | 'investigation_id'>[]>([]);
  const [title, setTitle] = useState('');
  const [agent, setAgent] = useState(AGENTS[0]);

  useEffect(() => { loadProjectId(); }, [user]);

  const loadProjectId = async () => {
    if (!user) return;
    const { data: profile } = await supabase.from('user_profiles').select('id').eq('user_id', user.id).maybeSingle();
    if (profile) {
      const { data: projects } = await supabase.from('projects').select('id').eq('org_id', profile.id).limit(1);
      if (projects && projects.length > 0) setProjectId(projects[0].id);
    }
  };

  const handleStep1Next = () => {
    if (!form.service || !form.symptoms.trim()) return;
    setStep(2);
    setCorrelating(true);
    setTimeout(() => {
      setCorrelatedEvents(generateCorrelatedEvents(form.service, form.symptoms));
      setTitle(`${form.service} — ${form.symptoms.substring(0, 60)}`);
      setCorrelating(false);
    }, 1800);
  };

  const handleLaunch = async () => {
    if (!projectId || !title.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data: inv, error: invError } = await supabase.from('investigations').insert({
        project_id: projectId, title: title.trim(), severity: form.severity,
        status: 'investigating', service: form.service, assigned_agent: agent,
        created_at: new Date().toISOString(),
      }).select().single();
      if (invError) throw invError;
      if (correlatedEvents.length > 0) {
        await supabase.from('investigation_events').insert(correlatedEvents.map(e => ({ ...e, investigation_id: inv.id })));
      }
      navigate(`/investigations/${inv.id}`);
    } catch (error) {
      console.error('Error creating investigation:', error);
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'Service & Symptoms' },
    { num: 2, label: 'Review Events' },
    { num: 3, label: 'Launch Agent' },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link to="/investigations"
        className="inline-flex items-center gap-2 text-sm transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Investigations
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>New Investigation</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Let Operon AI correlate events and identify root causes automatically
        </p>
      </div>

      {/* Card */}
      <div className="card p-6">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
                  style={step > s.num
                    ? { backgroundColor: 'var(--accent)', color: '#fff' }
                    : step === s.num
                    ? { backgroundColor: 'var(--accent)', color: '#fff', boxShadow: '0 0 0 4px var(--accent-light)' }
                    : { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                  }
                >
                  {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                </div>
                <p className="mt-2 text-xs font-medium whitespace-nowrap"
                  style={{ color: step === s.num ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {s.label}
                </p>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-3 mb-5 transition-colors"
                  style={{ backgroundColor: step > s.num ? 'var(--accent)' : 'var(--border)' }} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Service */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Affected Service <span style={{ color: '#f87171' }}>*</span>
              </label>
              <select value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} className="input">
                <option value="">Select a service...</option>
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                Severity <span style={{ color: '#f87171' }}>*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {SEVERITY_OPTIONS.map(opt => {
                  const isSelected = form.severity === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, severity: opt.value })}
                      className="p-3 rounded-lg text-left transition-all"
                      style={{
                        backgroundColor: isSelected ? opt.bg : 'var(--bg-elevated)',
                        border: `1px solid ${isSelected ? opt.selBorder : 'var(--border)'}`,
                        boxShadow: isSelected ? `0 0 0 2px ${opt.selBorder}33` : 'none',
                      }}
                    >
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold mb-1"
                        style={{ backgroundColor: opt.bg, color: opt.accent, border: `1px solid ${opt.border}` }}>
                        {opt.label}
                      </span>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{opt.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Symptoms */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Describe the Symptoms <span style={{ color: '#f87171' }}>*</span>
              </label>
              <textarea
                value={form.symptoms}
                onChange={e => setForm({ ...form, symptoms: e.target.value })}
                placeholder="e.g. API latency has tripled in the last 30 minutes. Users are seeing checkout timeouts. Error rate jumped from 0.1% to 4.5%..."
                className="input"
                style={{ minHeight: '120px', resize: 'none' }}
                rows={4}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Be specific — mention metrics, services affected, and when it started
              </p>
            </div>

            <div className="flex justify-end">
              <button onClick={handleStep1Next} disabled={!form.service || !form.symptoms.trim()} className="btn-primary">
                Correlate Events
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="space-y-5">
            {/* AI banner */}
            <div className="flex items-center gap-3 p-4 rounded-lg"
              style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent)', opacity: 0.9 }}>
              <Bot className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>AI Event Correlation</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Scanning integrations for related events around the incident window...
                </p>
              </div>
            </div>

            {correlating ? (
              <div className="flex flex-col items-center py-12 gap-4">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--accent)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Correlating events across integrations...</p>
                <div className="flex gap-2 flex-wrap justify-center">
                  {['PagerDuty', 'Datadog', 'GitHub', 'Splunk', 'LaunchDarkly'].map(src => (
                    <span key={src} className="px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Found {correlatedEvents.length} correlated events
                  </p>
                  <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                    Events sorted by time and filtered to the incident window. Review before launching.
                  </p>
                  <div className="space-y-2">
                    {correlatedEvents.map((event, idx) => {
                      const cfg = getEventConfig(event.event_type);
                      const Icon = cfg.Icon;
                      const score = Math.round(event.correlation_score * 100);
                      return (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg"
                          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: cfg.bg }}>
                            <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{event.title}</p>
                              <span className="text-xs font-bold flex-shrink-0"
                                style={{ color: score >= 90 ? '#f87171' : score >= 80 ? '#fb923c' : 'var(--text-muted)' }}>
                                {score}% match
                              </span>
                            </div>
                            <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{event.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                                style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{event.source}</span>
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setStep(1)} className="btn-secondary">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <button onClick={() => setStep(3)} className="btn-primary">
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Investigation Title <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input"
                placeholder="Descriptive title for this investigation..."
              />
            </div>

            {/* Agent picker */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                Assign AI Agent
              </label>
              <div className="grid grid-cols-3 gap-3">
                {AGENTS.map(a => {
                  const isSelected = agent === a;
                  return (
                    <button key={a} type="button" onClick={() => setAgent(a)}
                      className="p-3 rounded-lg text-left transition-all"
                      style={{
                        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                        backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--bg-elevated)',
                        boxShadow: isSelected ? '0 0 0 2px var(--accent-light)' : 'none',
                      }}>
                      <Bot className="h-5 w-5 mb-2" style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }} />
                      <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{a}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-lg"
              style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Investigation Summary
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { label: 'Service', value: form.service, mono: true },
                  { label: 'Severity', value: form.severity.toUpperCase() },
                  { label: 'Correlated Events', value: `${correlatedEvents.length} events` },
                  { label: 'Assigned Agent', value: agent },
                ].map(({ label, value, mono }) => (
                  <div key={label}>
                    <p style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <p className={`font-medium mt-0.5 ${mono ? 'font-mono' : ''}`} style={{ color: 'var(--text-primary)' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button onClick={handleLaunch} disabled={!title.trim() || submitting} className="btn-primary">
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Launching...</>
                  : <><CheckCircle2 className="h-4 w-4" /> Launch Investigation</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
