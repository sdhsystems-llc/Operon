import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Check, Hexagon, AlertCircle } from 'lucide-react';

const FEATURES = [
  'AI agents that watch your systems 24/7',
  'Automatic root cause analysis in under 2 minutes',
  'One-click remediation with full audit trail',
];

const INTEGRATIONS = ['AWS', 'Splunk', 'Grafana', 'LaunchDarkly', 'PagerDuty'];

const getPasswordStrength = (pw: string): { score: number; label: string; color: string } => {
  if (!pw) return { score: 0, label: '', color: '#1f2133' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak', color: '#ef4444' };
  if (score <= 3) return { score, label: 'Fair', color: '#f59e0b' };
  return { score, label: 'Strong', color: '#10b981' };
};

export const SignUpPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const { signUp } = useAuth();

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const pwStrength = getPasswordStrength(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%', background: '#161821', borderRadius: '8px',
    padding: '11px 14px', color: '#ffffff', fontSize: '14px', outline: 'none',
    border: `1px solid ${focused === field ? '#6366f1' : '#1f2133'}`,
    boxShadow: focused === field ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08090d', overflow: 'hidden' }}>
      <style>{`
        @keyframes signupShake {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)}
        }
        @keyframes signupBgPulse {
          0%,100%{opacity:0.4} 50%{opacity:0.65}
        }
        @keyframes signupCheckPop {
          0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)}
        }
        @keyframes signupSpin { to { transform: rotate(360deg); } }
        .signup-input::placeholder { color: #3f3f46 !important; }
        .signup-primary-btn:hover:not(:disabled) { background: #5457e0 !important; }
        .signup-primary-btn:active:not(:disabled) { transform: scale(0.98); }
        .signup-text-link:hover { color: #818cf8 !important; }
        @media (max-width: 767px) { .signup-left-panel { display: none !important; } }
        @media (max-width: 767px) { .signup-mobile-logo { display: flex !important; } }
      `}</style>

      {/* LEFT PANEL */}
      <div className="signup-left-panel" style={{
        flex: '0 0 60%',
        background: 'linear-gradient(160deg, #0d0e1a 0%, #08090d 100%)',
        borderRight: '1px solid #1f2133',
        display: 'flex', flexDirection: 'column',
        padding: '40px 56px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-200px', left: '-100px', width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
          animation: 'signupBgPulse 6s ease-in-out infinite', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', right: '-50px', width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
          animation: 'signupBgPulse 8s ease-in-out infinite reverse', pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative' }}>
            <Hexagon style={{ width: '32px', height: '32px', color: '#6366f1' }} strokeWidth={1.5} />
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#6366f1' }}>O</span>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>Operon</span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: '16px', maxWidth: '480px' }}>
            Autonomous AI for<br />Production Engineering
          </h1>
          <p style={{ fontSize: '16px', color: '#a1a1aa', lineHeight: 1.65, marginBottom: '40px', maxWidth: '440px' }}>
            Monitor, investigate, and resolve incidents before your team even wakes up.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '56px' }}>
            {FEATURES.map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check style={{ width: '11px', height: '11px', color: '#6366f1' }} strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: '14px', color: '#a1a1aa', lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#52525b', letterSpacing: '0.1em', marginBottom: '12px', textTransform: 'uppercase' }}>Trusted integrations</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {INTEGRATIONS.map((name, i) => (
                <span key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#71717a', padding: '4px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', border: '1px solid #1f2133' }}>{name}</span>
                  {i < INTEGRATIONS.length - 1 && <span style={{ color: '#2d2d3a', fontSize: '14px' }}>·</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{
        flex: 1, background: '#0f1117', display: 'flex', flexDirection: 'column',
        padding: '24px 32px', overflowY: 'auto',
        opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateX(24px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '12px', color: '#52525b' }}>
            Need help? <span style={{ color: '#6366f1', cursor: 'pointer' }}>docs.operon.ai</span>
          </span>
        </div>

        <div className="signup-mobile-logo" style={{ display: 'none', alignItems: 'center', gap: '10px', marginTop: '16px', justifyContent: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Hexagon style={{ width: '28px', height: '28px', color: '#6366f1' }} strokeWidth={1.5} />
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#6366f1' }}>O</span>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Operon</span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '360px', margin: '0 auto', width: '100%', paddingTop: '16px', paddingBottom: '16px' }}>
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#6366f1', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>Get Started</span>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '6px' }}>Create your account</h2>
            <p style={{ fontSize: '14px', color: '#71717a' }}>Join your team on Operon</p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', animation: shake ? 'signupShake 0.45s ease' : 'none' }}>
              <AlertCircle style={{ width: '15px', height: '15px', color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '13px', color: '#fca5a5', margin: 0 }}>{error}</p>
            </div>
          )}

          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px' }}>
              <div style={{ animation: 'signupCheckPop 0.4s ease forwards' }}>
                <Check style={{ width: '15px', height: '15px', color: '#10b981' }} />
              </div>
              <p style={{ fontSize: '13px', color: '#6ee7b7', margin: 0 }}>Account created! Redirecting...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#a1a1aa', marginBottom: '7px' }}>Full name</label>
              <input type="text" autoComplete="name" required value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                placeholder="Jane Smith" className="signup-input" style={inputStyle('name')} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#a1a1aa', marginBottom: '7px' }}>Work email</label>
              <input type="email" autoComplete="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                placeholder="you@company.com" className="signup-input" style={inputStyle('email')} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#a1a1aa', marginBottom: '7px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} autoComplete="new-password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                  placeholder="••••••••" className="signup-input"
                  style={{ ...inputStyle('password'), paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#52525b', display: 'flex', alignItems: 'center', lineHeight: 1 }}>
                  {showPw ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
              {password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '5px' }}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div key={level} style={{ flex: 1, height: '3px', borderRadius: '2px', background: level <= pwStrength.score ? pwStrength.color : '#1f2133', transition: 'background 0.3s ease' }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '11px', color: pwStrength.color }}>{pwStrength.label} password</p>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#a1a1aa', marginBottom: '7px' }}>Confirm password</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? 'text' : 'password'} autoComplete="new-password" required value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocused('confirm')} onBlur={() => setFocused(null)}
                  placeholder="••••••••" className="signup-input"
                  style={{
                    ...inputStyle('confirm'),
                    paddingRight: '44px',
                    borderColor: confirmPassword && password !== confirmPassword ? '#ef4444' : focused === 'confirm' ? '#6366f1' : '#1f2133',
                    boxShadow: confirmPassword && password !== confirmPassword ? '0 0 0 3px rgba(239,68,68,0.12)' : focused === 'confirm' ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                  }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#52525b', display: 'flex', alignItems: 'center', lineHeight: 1 }}>
                  {showConfirm ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '5px' }}>Passwords do not match</p>
              )}
            </div>

            <button type="submit" disabled={loading || success} className="signup-primary-btn"
              style={{
                width: '100%', height: '44px', background: '#6366f1', border: 'none', borderRadius: '8px',
                color: '#ffffff', fontSize: '14px', fontWeight: 600, cursor: loading || success ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'background 0.2s ease, transform 0.1s ease', opacity: loading || success ? 0.8 : 1, marginTop: '4px',
              }}>
              {loading ? (
                <>
                  <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'signupSpin 0.7s linear infinite' }} />
                  Creating account...
                </>
              ) : success ? (
                <><Check style={{ width: '16px', height: '16px' }} /> Account created!</>
              ) : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#71717a', marginTop: '24px' }}>
            Already have an account?{' '}
            <Link to="/login" className="signup-text-link" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s ease' }}>
              Sign in
            </Link>
          </p>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#3f3f46', marginTop: '24px' }}>
            Secured by Supabase Auth · SOC 2 Type II
          </p>
        </div>
      </div>
    </div>
  );
};
