import { X, FileText, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReportJob } from '../../context/ReportContext'

export function ReportModal({ job, onClose }: { job: ReportJob; onClose: () => void }) {
  const navigate = useNavigate()

  const download = () => {
    const blob = new Blob([job.reportHtml ?? ''], { type: 'text/html' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `report-${job.id}.html`
    a.click()
  }

  const goToInvestigations = () => {
    onClose()
    navigate('/investigations')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1.25rem', background: '#0f172a', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>

        {/* Back to Investigations */}
        <button
          onClick={goToInvestigations}
          onMouseOver={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#e2e8f0' }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.35rem 0.75rem', borderRadius: 7,
            border: '1px solid #334155', background: 'transparent',
            color: '#64748b', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
            transition: 'background 0.15s, color 0.15s', flexShrink: 0,
          }}
        >
          <ArrowLeft size={13} />
          Investigations
        </button>

        <div style={{ width: '1px', height: '18px', background: '#1e293b', flexShrink: 0 }} />

        <FileText size={18} style={{ color: '#818cf8', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9', margin: 0 }}>Investigation Report</p>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</p>
        </div>

        <button
          onClick={download}
          onMouseOver={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#e2e8f0' }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
          style={{ padding: '0.35rem 0.875rem', borderRadius: 7, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, transition: 'background 0.15s, color 0.15s', flexShrink: 0 }}
        >
          ↓ Download
        </button>

        <button
          onClick={onClose}
          onMouseOver={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#e2e8f0' }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.35rem', borderRadius: 6, display: 'flex', transition: 'background 0.15s, color 0.15s' }}
        >
          <X size={18} />
        </button>
      </div>

      <iframe srcDoc={job.reportHtml} style={{ flex: 1, border: 'none', width: '100%' }} title="Investigation Report" sandbox="allow-same-origin" />
    </div>
  )
}
