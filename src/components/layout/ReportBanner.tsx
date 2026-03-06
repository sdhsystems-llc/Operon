import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle2 } from 'lucide-react'
import { useReports, type ReportJob } from '../../context/ReportContext'
import { ReportModal } from './ReportModal'

// ── countdown ─────────────────────────────────────────────────────────────────
function useCountdown(startedAt: number, total: number) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, total - Math.floor((Date.now() - startedAt) / 1000))
  )
  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.max(0, total - Math.floor((Date.now() - startedAt) / 1000))
      setRemaining(r)
      if (r === 0) clearInterval(id)
    }, 500)
    return () => clearInterval(id)
  }, [startedAt, total])
  return remaining
}

// ── SVG ring progress ─────────────────────────────────────────────────────────
function RingProgress({ pct, color }: { pct: number; color: string }) {
  const r = 10
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width="28" height="28" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
      <circle cx="14" cy="14" r={r} fill="none" stroke="#334155" strokeWidth="2.5" />
      <circle cx="14" cy="14" r={r} fill="none" stroke={color} strokeWidth="2.5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s linear' }} />
    </svg>
  )
}

// ── single toast card ─────────────────────────────────────────────────────────
function ToastCard({ job, onDismiss }: { job: ReportJob; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)
  const [viewingReport, setViewingReport] = useState(false)
  const remaining = useCountdown(job.startedAt, 40)
  const pct = Math.min(100, Math.round(((40 - remaining) / 40) * 100))
  const isDone = job.status === 'done'

  // slide-in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [])

  // auto-dismiss generating toast after 5 seconds of appearing
  useEffect(() => {
    if (isDone) return
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 5000)
    return () => clearTimeout(t)
  }, [isDone, onDismiss])

  // auto-dismiss done toast after 5 seconds of completion
  useEffect(() => {
    if (!isDone) return
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 5000)
    return () => clearTimeout(t)
  }, [isDone, onDismiss])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(onDismiss, 300)
  }

  const accent = isDone ? '#22c55e' : '#f59e0b'

  return (
    <>
      <div style={{
        width: 320,
        background: 'rgba(15,23,42,0.97)',
        border: `1px solid ${isDone ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.2)'}`,
        borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        transform: visible ? 'translateX(0)' : 'translateX(calc(100% + 24px))',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 0.875rem 0.75rem' }}>
          {/* icon / ring */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, position: 'relative' }}>
            {isDone
              ? <CheckCircle2 size={28} style={{ color: '#22c55e' }} />
              : (
                <>
                  <RingProgress pct={pct} color="#f59e0b" />
                  <Loader2 size={12} style={{ color: '#f59e0b', position: 'absolute', animation: 'spin 1s linear infinite' }} />
                </>
              )
            }
          </div>
          {/* text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: accent, margin: '0 0 0.125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isDone ? 'Report Ready' : 'Generating Report'}
            </p>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', margin: '0 0 0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {job.title}
            </p>
            <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>
              {isDone
                ? `${job.severity.toUpperCase()} · ${job.service}`
                : `${pct}% complete · ${remaining}s remaining`
              }
            </p>
          </div>
          {/* dismiss */}
          <button onClick={handleDismiss} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', padding: '0.1rem', borderRadius: 4, display: 'flex', flexShrink: 0 }}
            onMouseOver={e => (e.currentTarget.style.color = '#94a3b8')}
            onMouseOut={e => (e.currentTarget.style.color = '#475569')}
          ><X size={14} /></button>
        </div>

        {/* progress bar (generating) */}
        {!isDone && (
          <div style={{ height: 3, background: '#1e293b', margin: '0 0.875rem' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', borderRadius: 2, transition: 'width 0.5s linear' }} />
          </div>
        )}

        {/* action buttons (done) */}
        {isDone && (
          <div style={{ padding: '0 0.875rem 0.875rem', display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setViewingReport(true)} style={{
              flex: 1, padding: '0.45rem 0', borderRadius: 8, border: '1px solid rgba(34,197,94,0.2)',
              background: 'rgba(34,197,94,0.12)', color: '#22c55e',
              cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
            }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.22)')}
              onMouseOut={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.12)')}
            >View Report ↗</button>
            <button onClick={() => {
              const blob = new Blob([job.reportHtml ?? ''], { type: 'text/html' })
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
              a.download = `report-${job.id}.html`; a.click()
            }} style={{
              padding: '0.45rem 0.75rem', borderRadius: 8, border: '1px solid #334155',
              background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '0.78rem',
            }}
              onMouseOver={e => (e.currentTarget.style.color = '#94a3b8')}
              onMouseOut={e => (e.currentTarget.style.color = '#64748b')}
            >↓</button>
          </div>
        )}

        {!isDone && <div style={{ height: '0.5rem' }} />}
      </div>

      {viewingReport && job.reportHtml && (
        <ReportModal job={job} onClose={() => setViewingReport(false)} />
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  )
}

// ── toast container (fixed top-right) ────────────────────────────────────────
// Toasts can be hidden locally (X / auto-dismiss) without removing the job
// from context — the tray icon keeps all jobs until explicitly dismissed there.
export function ReportBanner() {
  const { jobs } = useReports()
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())

  // When a new job appears (generating → done transition), un-hide it so the
  // "ready" toast pops back up even if the user dismissed the generating one.
  useEffect(() => {
    jobs.forEach(j => {
      if (j.status === 'done') {
        setHiddenIds(prev => {
          if (!prev.has(j.id)) return prev
          // re-show when it flips to done
          const next = new Set(prev)
          next.delete(j.id)
          return next
        })
      }
    })
  }, [jobs])

  const visible = jobs.filter(j => !hiddenIds.has(j.id))
  if (visible.length === 0) return null

  const hideToast = (id: string) => setHiddenIds(prev => new Set([...prev, id]))

  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '0.625rem', pointerEvents: 'none' }}>
      {visible.map(job => (
        <div key={job.id} style={{ pointerEvents: 'all' }}>
          <ToastCard job={job} onDismiss={() => hideToast(job.id)} />
        </div>
      ))}
    </div>
  )
}
