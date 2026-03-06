import { useState, useRef, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Sun, Moon, FileText, Loader2, Download, X } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { ReportProvider, useReports } from '../../context/ReportContext'
import { ReportBanner } from './ReportBanner'
import { ReportModal } from './ReportModal'
import type { ReportJob } from '../../context/ReportContext'

// ── Report Tray ───────────────────────────────────────────────────────────────
function ReportTray() {
  const { jobs, dismissReport } = useReports()
  const [open, setOpen] = useState(false)
  const [viewingJob, setViewingJob] = useState<ReportJob | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const generatingCount = jobs.filter(j => j.status === 'generating').length
  const doneCount = jobs.filter(j => j.status === 'done').length
  const total = jobs.length

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (total === 0) return null

  return (
    <div ref={ref} style={{ position: 'relative', marginRight: '0.75rem' }}>
      {/* tray button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Report jobs"
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-subtle)',
          background: open ? 'var(--accent-light)' : 'transparent',
          color: open ? 'var(--accent)' : 'var(--text-muted)',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseOver={e => { if (!open) { e.currentTarget.style.background = 'var(--hover-overlay)'; e.currentTarget.style.color = 'var(--text-base)' } }}
        onMouseOut={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' } }}
      >
        <Download size={15} />
        {/* badge */}
        <span style={{
          position: 'absolute', top: -4, right: -4,
          minWidth: 16, height: 16, borderRadius: 8, padding: '0 3px',
          background: generatingCount > 0 ? '#f59e0b' : '#22c55e',
          color: '#fff', fontSize: '0.6rem', fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--topbar-bg)',
        }}>{total}</span>
      </button>

      {/* dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340, zIndex: 1500,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
          borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', overflow: 'hidden',
        }}>
          {/* header */}
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-base)', margin: 0 }}>Report Jobs</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                {generatingCount > 0 ? `${generatingCount} generating` : ''}{generatingCount > 0 && doneCount > 0 ? ' · ' : ''}{doneCount > 0 ? `${doneCount} ready` : ''}
              </p>
            </div>
          </div>

          {/* job rows */}
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {jobs.map(job => {
              const isDone = job.status === 'done'
              const elapsed = Math.min(40, Math.floor((Date.now() - job.startedAt) / 1000))
              const pct = Math.min(100, Math.round((elapsed / 40) * 100))

              return (
                <div key={job.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)',
                }}>
                  {/* icon */}
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28 }}>
                    {isDone
                      ? <FileText size={18} style={{ color: '#22c55e' }} />
                      : <Loader2 size={18} style={{ color: '#f59e0b', animation: 'spin 1s linear infinite' }} />
                    }
                  </div>
                  {/* info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-base)', margin: '0 0 0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {job.title}
                    </p>
                    {!isDone && (
                      <div style={{ height: 4, background: 'var(--bg-surface)', borderRadius: 2, marginTop: '0.25rem' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#f59e0b', borderRadius: 2, transition: 'width 0.5s' }} />
                      </div>
                    )}
                    {isDone && (
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                        {job.severity.toUpperCase()} · {job.service}
                      </p>
                    )}
                  </div>
                  {/* actions */}
                  <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                    {isDone && (
                      <>
                        <button onClick={() => { setViewingJob(job); setOpen(false) }} style={{
                          padding: '0.25rem 0.5rem', borderRadius: 6, border: '1px solid rgba(34,197,94,0.35)',
                          background: 'rgba(34,197,94,0.1)', color: '#22c55e', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700,
                        }}>View</button>
                        <button onClick={() => {
                          const blob = new Blob([job.reportHtml ?? ''], { type: 'text/html' })
                          const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
                          a.download = `report-${job.id}.html`; a.click()
                        }} title="Download" style={{
                          padding: '0.25rem', borderRadius: 6, border: '1px solid var(--border-subtle)',
                          background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex',
                        }}>
                          <Download size={12} />
                        </button>
                      </>
                    )}
                    <button onClick={() => dismissReport(job.id)} title="Dismiss" style={{
                      padding: '0.25rem', borderRadius: 6, border: 'none',
                      background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex',
                    }}>
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {viewingJob && viewingJob.reportHtml && (
        <ReportModal job={viewingJob} onClose={() => setViewingJob(null)} />
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <header
      className="h-12 flex items-center justify-end px-5 flex-shrink-0"
      style={{
        backgroundColor: 'var(--topbar-bg)',
        borderBottom: '1px solid var(--topbar-border)',
      }}
    >
      <ReportTray />
      <button
        onClick={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="relative w-14 h-7 rounded-full flex items-center px-1 cursor-pointer border"
        style={{
          backgroundColor: isDark ? 'var(--accent-light)' : '#e0e7ff',
          borderColor: isDark ? 'var(--accent)' : '#a5b4fc',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <span
          className="absolute w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
          style={{
            backgroundColor: isDark ? 'var(--accent)' : '#4f46e5',
            left: isDark ? 'calc(100% - 1.5rem)' : '0.25rem',
            transition: 'left 0.3s ease, background-color 0.3s ease',
          }}
        >
          {isDark
            ? <Sun className="w-3 h-3 text-white" />
            : <Moon className="w-3 h-3 text-white" />
          }
        </span>
        <span className="ml-1 text-xs font-medium" style={{ color: 'var(--text-muted)', minWidth: 24 }}>
          {isDark ? '🌙' : '☀️'}
        </span>
      </button>
    </header>
  )
}

export default function AppLayout() {
  return (
    <ReportProvider>
      <ReportBanner />
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-base)', position: 'relative' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </ReportProvider>
  )
}
