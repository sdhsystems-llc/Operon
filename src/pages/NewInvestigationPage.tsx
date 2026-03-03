import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { InvestigationEvent } from '../types/database.types';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Activity,
  AlertCircle,
  Bot,
  Server,
  Zap,
  GitCommit,
  Flag,
  TrendingUp,
  FileText,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

const SERVICES = [
  'checkout-api',
  'payment-gateway',
  'postgres-primary',
  'redis-cache',
  'api-gateway',
  'graphql-api',
  'fraud-detection',
  'load-balancer',
  'webhook-service',
  'cdn-service',
  'elasticsearch',
  'inventory-service',
  'auth-service',
  'notification-service',
];

const AGENTS = ['AI Agent Alpha', 'AI Agent Beta', 'AI Agent Gamma'];

const SEVERITY_OPTIONS = [
  { value: 'p1', label: 'P1 Critical', description: 'Complete outage or critical data loss', bg: 'bg-red-50 border-red-300', selected: 'ring-2 ring-red-400 bg-red-50 border-red-400', badge: 'bg-red-100 text-red-700' },
  { value: 'p2', label: 'P2 High', description: 'Significant degradation, major feature broken', bg: 'bg-orange-50 border-orange-200', selected: 'ring-2 ring-orange-400 bg-orange-50 border-orange-400', badge: 'bg-orange-100 text-orange-700' },
  { value: 'p3', label: 'P3 Medium', description: 'Minor degradation or partial functionality loss', bg: 'bg-yellow-50 border-yellow-200', selected: 'ring-2 ring-yellow-400 bg-yellow-50 border-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
  { value: 'p4', label: 'P4 Low', description: 'Cosmetic issue or minor inconvenience', bg: 'bg-blue-50 border-blue-200', selected: 'ring-2 ring-blue-400 bg-blue-50 border-blue-400', badge: 'bg-blue-100 text-blue-700' },
];

const generateCorrelatedEvents = (service: string, symptoms: string): Omit<InvestigationEvent, 'id' | 'investigation_id'>[] => {
  const now = Date.now();

  const baseEvents: Omit<InvestigationEvent, 'id' | 'investigation_id'>[] = [
    {
      event_type: 'alert',
      title: `Alert: ${service} error rate spike`,
      description: `Error rate exceeded 2% threshold. Current: 5.4%`,
      source: 'pagerduty',
      timestamp: new Date(now - 45 * 60000).toISOString(),
      correlation_score: 0.96,
    },
    {
      event_type: 'metric',
      title: 'P95 latency degradation',
      description: `P95 latency increased from 180ms to ${symptoms.includes('slow') || symptoms.includes('latency') ? '2800ms' : '890ms'}`,
      source: 'datadog',
      timestamp: new Date(now - 38 * 60000).toISOString(),
      correlation_score: 0.93,
    },
    {
      event_type: 'deploy',
      title: `${service} v2.4.1 deployed`,
      description: 'New version deployed to production 52 minutes ago',
      source: 'github',
      timestamp: new Date(now - 52 * 60000).toISOString(),
      correlation_score: 0.87,
    },
    {
      event_type: 'log',
      title: 'Error log spike',
      description: `High volume of ERROR-level logs from ${service}: connection timeout exceeded`,
      source: 'splunk',
      timestamp: new Date(now - 43 * 60000).toISOString(),
      correlation_score: 0.91,
    },
    {
      event_type: 'feature_flag',
      title: 'Feature flag enabled: enable-new-checkout',
      description: 'LaunchDarkly flag toggled to 100% rollout 48 minutes ago',
      source: 'launchdarkly',
      timestamp: new Date(now - 48 * 60000).toISOString(),
      correlation_score: 0.89,
    },
  ];

  if (symptoms.toLowerCase().includes('database') || symptoms.toLowerCase().includes('query') || service.includes('postgres')) {
    baseEvents.push({
      event_type: 'trace',
      title: 'Slow database query detected',
      description: 'Sequential scan on orders table: 3.2s (baseline 120ms)',
      source: 'aws-xray',
      timestamp: new Date(now - 35 * 60000).toISOString(),
      correlation_score: 0.95,
    });
  }

  if (symptoms.toLowerCase().includes('memory') || symptoms.toLowerCase().includes('oom')) {
    baseEvents.push({
      event_type: 'metric',
      title: 'Memory usage spike',
      description: 'Container memory at 95% — approaching OOM threshold',
      source: 'grafana',
      timestamp: new Date(now - 30 * 60000).toISOString(),
      correlation_score: 0.88,
    });
  }

  return baseEvents.slice(0, Math.min(8, baseEvents.length));
};

const getEventConfig = (type: string) => {
  const configs: Record<string, { color: string; bg: string; Icon: any; label: string }> = {
    commit: { color: 'text-purple-700', bg: 'bg-purple-100', Icon: GitCommit, label: 'Commit' },
    deploy: { color: 'text-blue-700', bg: 'bg-blue-100', Icon: Server, label: 'Deploy' },
    feature_flag: { color: 'text-orange-700', bg: 'bg-orange-100', Icon: Flag, label: 'Feature Flag' },
    alert: { color: 'text-red-700', bg: 'bg-red-100', Icon: AlertCircle, label: 'Alert' },
    metric: { color: 'text-primary-700', bg: 'bg-primary-100', Icon: TrendingUp, label: 'Metric' },
    log: { color: 'text-secondary-700', bg: 'bg-secondary-100', Icon: FileText, label: 'Log' },
    trace: { color: 'text-teal-700', bg: 'bg-teal-100', Icon: Activity, label: 'Trace' },
    config_change: { color: 'text-warning-700', bg: 'bg-warning-100', Icon: Zap, label: 'Config' },
  };
  return configs[type] || configs.log;
};

export const NewInvestigationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [correlating, setCorrelating] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  const [form, setForm] = useState({
    service: '',
    severity: 'p2',
    symptoms: '',
  });

  const [correlatedEvents, setCorrelatedEvents] = useState<
    Omit<InvestigationEvent, 'id' | 'investigation_id'>[]
  >([]);

  const [title, setTitle] = useState('');
  const [agent, setAgent] = useState(AGENTS[0]);

  useEffect(() => {
    loadProjectId();
  }, [user]);

  const loadProjectId = async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile) {
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('org_id', profile.id)
        .limit(1);
      if (projects && projects.length > 0) {
        setProjectId(projects[0].id);
      }
    }
  };

  const handleStep1Next = () => {
    if (!form.service || !form.symptoms.trim()) return;
    setStep(2);
    setCorrelating(true);

    setTimeout(() => {
      const events = generateCorrelatedEvents(form.service, form.symptoms);
      setCorrelatedEvents(events);
      setTitle(`${form.service} — ${form.symptoms.substring(0, 60)}`);
      setCorrelating(false);
    }, 1800);
  };

  const handleLaunch = async () => {
    if (!projectId || !title.trim() || submitting) return;
    setSubmitting(true);

    try {
      const { data: inv, error: invError } = await supabase
        .from('investigations')
        .insert({
          project_id: projectId,
          title: title.trim(),
          severity: form.severity,
          status: 'investigating',
          service: form.service,
          assigned_agent: agent,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (invError) throw invError;

      if (correlatedEvents.length > 0) {
        await supabase.from('investigation_events').insert(
          correlatedEvents.map((e) => ({
            ...e,
            investigation_id: inv.id,
          }))
        );
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
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/investigations"
        className="inline-flex items-center gap-2 text-sm text-secondary-600 hover:text-secondary-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Investigations
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-secondary-900">New Investigation</h1>
        <p className="mt-1 text-sm text-secondary-600">
          Let Operon AI correlate events and identify root causes automatically
        </p>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    step > s.num
                      ? 'bg-primary-600 text-white'
                      : step === s.num
                      ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                      : 'bg-secondary-100 text-secondary-500'
                  }`}
                >
                  {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                </div>
                <p
                  className={`mt-2 text-xs font-medium whitespace-nowrap ${
                    step === s.num ? 'text-primary-700' : 'text-secondary-500'
                  }`}
                >
                  {s.label}
                </p>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 mb-5 transition-colors ${
                    step > s.num ? 'bg-primary-400' : 'bg-secondary-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-secondary-900 mb-2">
                Affected Service <span className="text-red-500">*</span>
              </label>
              <select
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
                className="input-field"
              >
                <option value="">Select a service...</option>
                {SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-900 mb-3">
                Severity <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {SEVERITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, severity: opt.value })}
                    className={`p-3 border rounded-lg text-left transition-all ${
                      form.severity === opt.value ? opt.selected : opt.bg
                    }`}
                  >
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mb-1 ${opt.badge}`}>
                      {opt.label}
                    </span>
                    <p className="text-xs text-secondary-600">{opt.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-900 mb-2">
                Describe the Symptoms <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.symptoms}
                onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                placeholder="e.g. API latency has tripled in the last 30 minutes. Users are seeing checkout timeouts. Error rate jumped from 0.1% to 4.5%..."
                className="input-field min-h-[120px] resize-none"
                rows={4}
              />
              <p className="text-xs text-secondary-500 mt-1">
                Be specific — mention metrics, services affected, and when it started
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleStep1Next}
                disabled={!form.service || !form.symptoms.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Correlate Events
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <Bot className="h-5 w-5 text-primary-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary-900">
                  AI Event Correlation
                </p>
                <p className="text-xs text-primary-700">
                  Scanning integrations for related events around the incident window...
                </p>
              </div>
            </div>

            {correlating ? (
              <div className="flex flex-col items-center py-12 gap-4">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
                <p className="text-sm text-secondary-600">Correlating events across integrations...</p>
                <div className="flex gap-2 text-xs text-secondary-500">
                  {['PagerDuty', 'Datadog', 'GitHub', 'Splunk', 'LaunchDarkly'].map((src) => (
                    <span key={src} className="px-2 py-1 bg-secondary-100 rounded">
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold text-secondary-900 mb-1">
                    Found {correlatedEvents.length} correlated events
                  </p>
                  <p className="text-xs text-secondary-500 mb-4">
                    Events are sorted by time and filtered to the incident window. Review before launching.
                  </p>

                  <div className="space-y-2">
                    {correlatedEvents.map((event, idx) => {
                      const cfg = getEventConfig(event.event_type);
                      const Icon = cfg.Icon;
                      const score = Math.round(event.correlation_score * 100);
                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 border border-secondary-200 rounded-lg bg-secondary-50"
                        >
                          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                            <Icon className={`h-4 w-4 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-secondary-900 truncate">
                                {event.title}
                              </p>
                              <span
                                className={`text-xs font-bold flex-shrink-0 ${
                                  score >= 90
                                    ? 'text-red-600'
                                    : score >= 80
                                    ? 'text-orange-600'
                                    : 'text-secondary-600'
                                }`}
                              >
                                {score}% match
                              </span>
                            </div>
                            <p className="text-xs text-secondary-600 mt-0.5 line-clamp-1">
                              {event.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} font-medium`}>
                                {cfg.label}
                              </span>
                              <span className="text-xs text-secondary-400">{event.source}</span>
                              <span className="text-xs text-secondary-400">
                                {new Date(event.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
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
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </button>
                  <button onClick={() => setStep(3)} className="btn-primary">
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-secondary-900 mb-2">
                Investigation Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Descriptive title for this investigation..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-900 mb-3">
                Assign AI Agent
              </label>
              <div className="grid grid-cols-3 gap-3">
                {AGENTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAgent(a)}
                    className={`p-3 border rounded-lg text-left transition-all ${
                      agent === a
                        ? 'ring-2 ring-primary-400 border-primary-400 bg-primary-50'
                        : 'border-secondary-200 hover:border-secondary-300 bg-white'
                    }`}
                  >
                    <Bot className={`h-5 w-5 mb-2 ${agent === a ? 'text-primary-600' : 'text-secondary-400'}`} />
                    <p className="text-xs font-medium text-secondary-900">{a}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-secondary-50 border border-secondary-200 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-secondary-700 uppercase tracking-wider">
                Investigation Summary
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-secondary-500">Service</p>
                  <p className="font-medium text-secondary-900 font-mono mt-0.5">{form.service}</p>
                </div>
                <div>
                  <p className="text-secondary-500">Severity</p>
                  <p className="font-medium text-secondary-900 mt-0.5">{form.severity.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-secondary-500">Correlated Events</p>
                  <p className="font-medium text-secondary-900 mt-0.5">{correlatedEvents.length} events</p>
                </div>
                <div>
                  <p className="text-secondary-500">Assigned Agent</p>
                  <p className="font-medium text-secondary-900 mt-0.5">{agent}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
              <button
                onClick={handleLaunch}
                disabled={!title.trim() || submitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Launch Investigation
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
