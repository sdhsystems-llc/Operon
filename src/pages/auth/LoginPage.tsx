import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../context/ThemeContext'
import {
  Hexagon, Eye, EyeOff, Check, Key, AlertCircle,
  Zap, Shield, GitMerge, Sun, Moon,
} from 'lucide-react'

const FEATURES = [
  { icon: Zap,      text: 'AI agents monitoring your systems 24/7' },
  { icon: Shield,   text: 'Automatic root cause analysis in under 2 min' },
  { icon: GitMerge, text: 'One-click remediation with full audit trail' },
]

const INTEGRATIONS = ['AWS', 'Splunk', 'Grafana', 'LaunchDarkly', 'PagerDuty']

export default function LoginPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPw, setShowPw]             = useState(false)
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [success, setSuccess]           = useState(false)
  const [shake, setShake]               = useState(false)
  const [mounted, setMounted]           = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [pwFocused, setPwFocused]       = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40)
    return () => clearTimeout(t)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/'), 800)
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', overflow: 'hidden', fontFamily: 'inherit' }}>
      <style>{`
        @keyframes lgShake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-6px)}
          40%{transform:translateX(6px)}
          60%{transform:translateX(-4px)}
          80%{transform:translateX(4px)}
        }
        @keyframes lgPulse { 0%,100%{opacity:.4} 50%{opacity:.7} }
        @keyframes lgCheckPop { 0%{transform:scale(0)} 60%{transform:scale(1.25)} 100%{transform:scale(1)} }
        @keyframes lgSpin { to{transform:rotate(360deg)} }
        @keyframes lgFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .lg-input::placeholder { color: var(--text-muted) !important; opacity: 1 !important; }
        .lg-input { transition: border-color .2s, box-shadow .2s; }
        .lg-btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
        .lg-btn-primary:active:not(:disabled) { transform: scale(0.98); }
        .lg-btn-sso:hover { background: var(--bg-base) !important; border-color: var(--accent) !important; }
        .lg-link:hover { opacity: 0.75; }
        .lg-pw-toggle:hover { color: var(--text-secondary) !important; }
        .lg-theme-toggle:hover { opacity: 0.85; }
        @media (max-width: 767px) {
          .lg-left { display: none !important; }
          .lg-mobile-logo { display: flex !important; }
        }
      `}</style>

      {/* ── LEFT BRAND PANEL (always dark — intentional brand canvas) ── */}
      <div className="lg-left" style={{
        flex: '0 0 58%',
        background: isDark
          ? 'linear-gradient(155deg, #0d0e1a 0%, #08090d 100%)'
          : 'linear-gradient(155deg, #1e1b4b 0%, #312e81 100%)',
        borderRight: `1px solid ${isDark ? '#1a1c2e' : 'rgba(255,255,255,0.08)'}`,
        display: 'flex', flexDirection: 'column',
        padding: '44px 60px', position: 'relative', overflow: 'hidden',
      }}>
        {/* ambient glow orbs */}
        <div style={{
          position: 'absolute', top: '-220px', left: '-120px',
          width: '640px', height: '640px',
          background: 'radial-gradient(circle, rgba(99,102,241,.25) 0%, transparent 68%)',
          animation: 'lgPulse 7s ease-in-out infinite', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-120px', right: '-60px',
          width: '420px', height: '420px',
          background: 'radial-gradient(circle, rgba(99,102,241,.12) 0%, transparent 68%)',
          animation: 'lgPulse 9s ease-in-out infinite reverse', pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative' }}>
            <Hexagon style={{ width: '32px', height: '32px', color: '#818cf8' }} strokeWidth={1.5} />
            <span style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700, color: '#818cf8',
            }}>O</span>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Operon</span>
        </div>

        {/* Hero copy */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
            <span style={{
              fontSize: '11px', fontWeight: 600, color: '#a5b4fc',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              background: 'rgba(165,180,252,.12)', border: '1px solid rgba(165,180,252,.25)',
              borderRadius: '100px', padding: '3px 10px',
            }}>Platform</span>
          </div>

          <h1 style={{
            fontSize: '34px', fontWeight: 700, color: '#fff',
            lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: '18px', maxWidth: '460px',
          }}>
            Autonomous AI for<br />Production Engineering
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: '44px', maxWidth: '420px' }}>
            Monitor, investigate, and resolve incidents before your team even wakes up.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '56px' }}>
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                  background: 'rgba(165,180,252,.12)', border: '1px solid rgba(165,180,252,.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon style={{ width: '14px', height: '14px', color: '#a5b4fc' }} strokeWidth={2} />
                </div>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Integrations */}
          <div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', marginBottom: '12px', textTransform: 'uppercase' }}>
              Trusted integrations
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {INTEGRATIONS.map((name, i) => (
                <span key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.4)',
                    padding: '4px 10px', background: 'rgba(255,255,255,.06)',
                    borderRadius: '6px', border: '1px solid rgba(255,255,255,.1)',
                  }}>{name}</span>
                  {i < INTEGRATIONS.length - 1 && <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div style={{
        flex: 1, background: 'var(--bg-surface)',
        display: 'flex', flexDirection: 'column',
        padding: '28px 36px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateX(20px)',
        transition: 'opacity .4s ease, transform .4s ease',
      }}>

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Mobile logo */}
          <div className="lg-mobile-logo" style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Hexagon style={{ width: '26px', height: '26px', color: 'var(--accent)' }} strokeWidth={1.5} />
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--accent)' }}>O</span>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Operon</span>
          </div>

          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Need help?{' '}
            <a href="https://docs.operon.ai" target="_blank" rel="noreferrer"
              className="lg-link"
              style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              docs.operon.ai
            </a>
          </span>

          {/* ── Theme toggle (identical to topbar) ── */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="lg-theme-toggle"
            style={{
              position: 'relative', width: '56px', height: '28px',
              borderRadius: '100px', display: 'flex', alignItems: 'center',
              padding: '0 4px', cursor: 'pointer', border: '1px solid',
              backgroundColor: isDark ? 'var(--accent-light)' : '#e0e7ff',
              borderColor: isDark ? 'var(--accent)' : '#a5b4fc',
              transition: 'background-color .3s ease, border-color .3s ease',
              flexShrink: 0,
            }}
          >
            {/* sliding knob */}
            <span style={{
              position: 'absolute',
              width: '20px', height: '20px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: isDark ? 'var(--accent)' : '#4f46e5',
              left: isDark ? 'calc(100% - 24px)' : '4px',
              transition: 'left .3s ease, background-color .3s ease',
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            }}>
              {isDark
                ? <Sun style={{ width: '11px', height: '11px', color: '#fff' }} />
                : <Moon style={{ width: '11px', height: '11px', color: '#fff' }} />}
            </span>
            {/* emoji label */}
            <span style={{
              marginLeft: isDark ? '4px' : '24px',
              fontSize: '11px', color: 'var(--text-muted)',
              transition: 'margin-left .3s ease',
              userSelect: 'none',
            }}>
              {isDark ? '🌙' : '☀️'}
            </span>
          </button>
        </div>

        {/* Form area */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', maxWidth: '360px', margin: '0 auto', width: '100%',
        }}>
          {/* Heading */}
          <div style={{ marginBottom: '28px', animation: 'lgFadeUp .4s ease both' }}>
            <span style={{
              fontSize: '11px', fontWeight: 600, color: 'var(--accent)',
              letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '10px',
            }}>Secure Login</span>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Sign in to your Operon workspace</p>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '18px',
              animation: shake ? 'lgShake .45s ease' : 'lgFadeUp .25s ease both',
            }}>
              <AlertCircle style={{ width: '15px', height: '15px', color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '13px', color: '#fca5a5', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Success banner */}
          {success && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.3)',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '18px',
              animation: 'lgFadeUp .25s ease both',
            }}>
              <div style={{ animation: 'lgCheckPop .4s ease forwards' }}>
                <Check style={{ width: '15px', height: '15px', color: '#10b981' }} />
              </div>
              <p style={{ fontSize: '13px', color: '#6ee7b7', margin: 0 }}>Signed in! Redirecting...</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '7px' }}>
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="you@company.com"
                className="lg-input"
                style={{
                  width: '100%', background: 'var(--input-bg)',
                  borderRadius: '8px', padding: '11px 14px',
                  color: 'var(--input-text)', fontSize: '14px', outline: 'none',
                  border: `1px solid ${emailFocused ? 'var(--accent)' : 'var(--input-border)'}`,
                  boxShadow: emailFocused ? '0 0 0 3px var(--accent-light)' : 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Password</label>
                <span className="lg-link" style={{ fontSize: '12px', color: 'var(--accent)', cursor: 'pointer', transition: 'opacity .15s' }}>
                  Forgot password?
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                  placeholder="••••••••"
                  className="lg-input"
                  style={{
                    width: '100%', background: 'var(--input-bg)',
                    borderRadius: '8px', padding: '11px 44px 11px 14px',
                    color: 'var(--input-text)', fontSize: '14px', outline: 'none',
                    border: `1px solid ${pwFocused ? 'var(--accent)' : 'var(--input-border)'}`,
                    boxShadow: pwFocused ? '0 0 0 3px var(--accent-light)' : 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="lg-pw-toggle"
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                    color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                    transition: 'color .15s',
                  }}
                >
                  {showPw
                    ? <EyeOff style={{ width: '16px', height: '16px' }} />
                    : <Eye style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || success}
              className="lg-btn-primary"
              style={{
                width: '100%', height: '44px', background: 'var(--accent)',
                border: 'none', borderRadius: '8px', color: '#fff',
                fontSize: '14px', fontWeight: 600,
                cursor: loading || success ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'filter .2s ease, transform .1s ease',
                opacity: loading || success ? 0.8 : 1,
                marginTop: '4px',
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff',
                    borderRadius: '50%', animation: 'lgSpin .7s linear infinite',
                  }} />
                  Signing in...
                </>
              ) : success ? (
                <><Check style={{ width: '16px', height: '16px' }} /> Signed in!</>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '22px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {/* SSO */}
          <button
            type="button"
            className="lg-btn-sso"
            style={{
              width: '100%', height: '44px', background: 'var(--bg-elevated)',
              border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)',
              fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'background .2s ease, border-color .2s ease',
            }}
          >
            <Key style={{ width: '15px', height: '15px', color: 'var(--text-muted)' }} />
            Continue with SSO
          </button>

          {/* Sign up link */}
          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)', marginTop: '24px' }}>
            Don't have an account?{' '}
            <Link to="/register" className="lg-link"
              style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500, transition: 'opacity .15s' }}>
              Create one
            </Link>
          </p>

          {/* Trust footer */}
          <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '28px', opacity: 0.6 }}>
            Secured by Supabase Auth · SOC 2 Type II
          </p>
        </div>
      </div>
    </div>
  )
}
