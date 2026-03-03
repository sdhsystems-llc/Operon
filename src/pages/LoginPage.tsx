import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Check, Key, Hexagon, AlertCircle } from 'lucide-react';

const FEATURES = [
  'AI agents that watch your systems 24/7',
  'Automatic root cause analysis in under 2 minutes',
  'One-click remediation with full audit trail',
];

const INTEGRATIONS = ['AWS', 'Splunk', 'Grafana', 'LaunchDarkly', 'PagerDuty'];

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const { signIn } = useAuth();

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08090d', overflow: 'hidden' }}>
      <style>{`
        @keyframes loginShake {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)}
        }
        @keyframes loginBgPulse {
          0%,100%{opacity:0.4} 50%{opacity:0.65}
        }
        @keyframes loginCheckPop {
          0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)}
        }
        @keyframes loginSpin { to { transform: rotate(360deg); } }
        .login-input { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .login-input::placeholder { color: #3f3f46 !important; }
        .login-primary-btn:hover:not(:disabled) { background: #5457e0 !important; }
        .login-primary-btn:active:not(:disabled) { transform: scale(0.98); }
        .login-sso-btn:hover { background: #1a1c2a !important; border-color: #2d2f4a !important; }
        .login-text-link:hover { color: #818cf8 !important; }
        @media (max-width: 767px) { .login-left-panel { display: none !important; } }
        @media (max-width: 767px) { .login-mobile-logo { display: flex !important; } }
      `}</style>

      {/* LEFT PANEL */}
      <div className="login-left-panel" style={{
        flex: '0 0 60%',
        background: 'linear-gradient(160deg, #0d0e1a 0%, #08090d 100%)',
        borderRight: '1px solid #1f2133',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-200px', left: '-100px',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
          animation: 'loginBgPulse 6s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', right: '-50px',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
          animation: 'loginBgPulse 8s ease-in-out infinite reverse',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative' }}>
            <Hexagon style={{ width: '32px', height: '32px', color: '#6366f1' }} strokeWidth={1.5} />
            <span style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#6366f1',
            }}>O</span>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>Operon</span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: '32px', fontWeight: 700, color: '#ffffff',
            lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: '16px', maxWidth: '480px',
          }}>
            Autonomous AI for<br />Production Engineering
          </h1>
          <p style={{ fontSize: '16px', color: '#a1a1aa', lineHeight: 1.65, marginBottom: '40px', maxWidth: '440px' }}>
            Monitor, investigate, and resolve incidents before your team even wakes up.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '56px' }}>
            {FEATURES.map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check style={{ width: '11px', height: '11px', color: '#6366f1' }} strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: '14px', color: '#a1a1aa', lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>

          <div>
            <p style={{ fontSize: '11px', color: '#52525b', letterSpacing: '0.1em', marginBottom: '12px', textTransform: 'uppercase' }}>
              Trusted integrations
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {INTEGRATIONS.map((name, i) => (
                <span key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '12px', fontWeight: 500, color: '#71717a',
                    padding: '4px 10px', background: 'rgba(255,255,255,0.04)',
                    borderRadius: '6px', border: '1px solid #1f2133',
                  }}>{name}</span>
                  {i < INTEGRATIONS.length - 1 && (
                    <span style={{ color: '#2d2d3a', fontSize: '14px' }}>·</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{
        flex: 1,
        background: '#0f1117',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 32px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateX(24px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#52525b' }}>
            Need help?{' '}
            <span style={{ color: '#6366f1', cursor: 'pointer' }}>docs.operon.ai</span>
          </span>
        </div>

        <div className="login-mobile-logo" style={{
          display: 'none', alignItems: 'center', gap: '10px',
          marginTop: '16px', justifyContent: 'center',
        }}>
          <div style={{ position: 'relative' }}>
            <Hexagon style={{ width: '28px', height: '28px', color: '#6366f1' }} strokeWidth={1.5} />
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#6366f1' }}>O</span>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Operon</span>
        </div>

        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', maxWidth: '360px', margin: '0 auto', width: '100%',
        }}>
          <div style={{ marginBottom: '28px' }}>
            <span style={{
              fontSize: '11px', fontWeight: 600, color: '#6366f1',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              display: 'block', marginBottom: '12px',
            }}>Secure Login</span>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '6px' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '14px', color: '#71717a' }}>Sign in to your Operon workspace</p>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '20px',
              animation: shake ? 'loginShake 0.45s ease' : 'none',
            }}>
              <AlertCircle style={{ width: '15px', height: '15px', color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '13px', color: '#fca5a5', margin: 0 }}>{error}</p>
            </div>
          )}

          {success && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '20px',
            }}>
              <div style={{ animation: 'loginCheckPop 0.4s ease forwards' }}>
                <Check style={{ width: '15px', height: '15px', color: '#10b981' }} />
              </div>
              <p style={{ fontSize: '13px', color: '#6ee7b7', margin: 0 }}>Signed in! Redirecting...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#a1a1aa', marginBottom: '7px' }}>
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="you@company.com"
                className="login-input"
                style={{
                  width: '100%', background: '#161821', borderRadius: '8px',
                  padding: '11px 14px', color: '#ffffff', fontSize: '14px', outline: 'none',
                  border: `1px solid ${emailFocused ? '#6366f1' : '#1f2133'}`,
                  boxShadow: emailFocused ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#a1a1aa', marginBottom: '7px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                  placeholder="••••••••"
                  className="login-input"
                  style={{
                    width: '100%', background: '#161821', borderRadius: '8px',
                    padding: '11px 44px 11px 14px', color: '#ffffff', fontSize: '14px', outline: 'none',
                    border: `1px solid ${pwFocused ? '#6366f1' : '#1f2133'}`,
                    boxShadow: pwFocused ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                    color: '#52525b', display: 'flex', alignItems: 'center', lineHeight: 1,
                  }}
                >
                  {showPw
                    ? <EyeOff style={{ width: '16px', height: '16px' }} />
                    : <Eye style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: '7px' }}>
                <span className="login-text-link" style={{ fontSize: '13px', color: '#6366f1', cursor: 'pointer', transition: 'color 0.15s ease' }}>
                  Forgot password?
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="login-primary-btn"
              style={{
                width: '100%', height: '44px', background: '#6366f1',
                border: 'none', borderRadius: '8px', color: '#ffffff',
                fontSize: '14px', fontWeight: 600, cursor: loading || success ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'background 0.2s ease, transform 0.1s ease',
                opacity: loading || success ? 0.8 : 1,
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%', animation: 'loginSpin 0.7s linear infinite',
                  }} />
                  Signing in...
                </>
              ) : success ? (
                <><Check style={{ width: '16px', height: '16px' }} /> Signed in!</>
              ) : 'Sign In'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#1f2133' }} />
            <span style={{ fontSize: '12px', color: '#3f3f46' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#1f2133' }} />
          </div>

          <button
            type="button"
            className="login-sso-btn"
            style={{
              width: '100%', height: '44px', background: '#161821',
              border: '1px solid #1f2133', borderRadius: '8px', color: '#ffffff',
              fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'background 0.2s ease, border-color 0.2s ease',
            }}
          >
            <Key style={{ width: '15px', height: '15px', color: '#71717a' }} />
            Continue with SSO
          </button>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#71717a', marginTop: '24px' }}>
            Don't have an account?{' '}
            <Link to="/signup" className="login-text-link" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s ease' }}>
              Create one
            </Link>
          </p>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#3f3f46', marginTop: '32px' }}>
            Secured by Supabase Auth · SOC 2 Type II
          </p>
        </div>
      </div>
    </div>
  );
};
