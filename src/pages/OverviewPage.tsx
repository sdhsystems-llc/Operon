import { useEffect, useState } from 'react'
import { useProjects } from './projects/ProjectsContext'
import { SystemKpis } from './overview/SystemKpis'
import { OrgHealthChart } from './overview/OrgHealthChart'
import { ServiceHealthMap } from './overview/ServiceHealthMap'
import { SloRiskPanel } from './overview/SloRiskPanel'
import { LiveActivityStream } from './overview/LiveActivityStream'
import { AgentActivityPanel } from './overview/AgentActivityPanel'
import { LiveIncidentFeed } from './overview/LiveIncidentFeed'

export const OverviewPage = () => {
  const { orgs, domains, getAllProjects } = useProjects()
  const projects = getAllProjects()

  // Animated header clock
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const activeIncidents = projects.reduce((s, p) => s + p.investigations, 0)

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-base)' }}>
      <div style={{ padding: '1rem 1.25rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Platform Overview
            </h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>
              {orgs.length} orgs · {domains ? Object.values(domains).flat().length : 0} domains · {projects.length} services
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeIncidents > 0 ? '#f87171' : '#34d399', animation: 'ovPulse 2s infinite' }} />
              <span style={{ fontSize: '0.7rem', color: activeIncidents > 0 ? '#f87171' : '#34d399', fontWeight: 700 }}>
                {activeIncidents > 0 ? `${activeIncidents} active incident${activeIncidents > 1 ? 's' : ''}` : 'All systems operational'}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
              {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>

        {/* ── Row 1: KPI cards ── */}
        <SystemKpis projects={projects} />

        {/* ── Row 2: Org Health Chart + SLO Risk + Agent Panel ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px 260px', gap: '0.75rem', height: 260 }}>
          <OrgHealthChart orgs={orgs} domains={domains} />
          <SloRiskPanel projects={projects} />
          <AgentActivityPanel />
        </div>

        {/* ── Row 3: Service Health Map + Live Activity ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '0.75rem', height: 300 }}>
          <ServiceHealthMap projects={projects} />
          <LiveActivityStream projects={projects} />
        </div>

        {/* ── Row 4: Incident Feed (capped height) ── */}
        <div style={{ maxHeight: 280, overflow: 'hidden', borderRadius: 14 }}>
          <LiveIncidentFeed />
        </div>

      </div>
      <style>{`@keyframes ovPulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
    </div>
  )
}
