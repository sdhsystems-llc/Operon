import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Org, Domain, Project, FlatDomain, FlatProject } from './types'
import { MOCK_ORGS, INITIAL_DOMAINS, uid, mkDS, mkKnowledge, mkNotifications } from './mockData'

interface ProjectsContextType {
  orgs: Org[]
  domains: Record<string, Domain[]>
  // Lookups
  getOrg: (orgId: string) => Org | undefined
  getDomain: (orgId: string, domainId: string) => Domain | undefined
  getProject: (orgId: string, domainId: string, projectId: string) => Project | undefined
  getAllDomains: () => FlatDomain[]
  getAllProjects: () => FlatProject[]
  // Org CRUD
  addOrg: (org: Omit<Org, 'knowledge'>) => void
  updateOrg: (org: Org) => void
  deleteOrg: (orgId: string) => void
  // Domain CRUD
  addDomain: (orgId: string, domain: Omit<Domain, 'projects' | 'knowledge'>) => void
  updateDomain: (orgId: string, domain: Domain) => void
  deleteDomain: (orgId: string, domainId: string) => void
  // Project CRUD
  addProject: (orgId: string, domainId: string, project: Partial<Project> & { name: string }) => void
  updateProject: (orgId: string, domainId: string, project: Project) => void
  deleteProject: (orgId: string, domainId: string, projectId: string) => void
}

const ProjectsContext = createContext<ProjectsContextType | null>(null)

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [orgs, setOrgs] = useState<Org[]>(MOCK_ORGS)
  const [domains, setDomains] = useState<Record<string, Domain[]>>(INITIAL_DOMAINS)

  const getOrg = (orgId: string) => orgs.find(o => o.id === orgId)

  const getDomain = (orgId: string, domainId: string) =>
    (domains[orgId] ?? []).find(d => d.id === domainId)

  const getProject = (orgId: string, domainId: string, projectId: string) =>
    getDomain(orgId, domainId)?.projects.find(p => p.id === projectId)

  const getAllDomains = (): FlatDomain[] =>
    orgs.flatMap(org =>
      (domains[org.id] ?? []).map(d => ({ ...d, orgId: org.id, orgName: org.name }))
    )

  const getAllProjects = (): FlatProject[] =>
    orgs.flatMap(org =>
      (domains[org.id] ?? []).flatMap(d =>
        d.projects.map(p => ({ ...p, orgId: org.id, orgName: org.name, domainId: d.id, domainName: d.name }))
      )
    )

  // ── Org CRUD ──
  const addOrg = (org: Omit<Org, 'knowledge'>) => {
    setOrgs(prev => [...prev, { ...org, knowledge: [] }])
    setDomains(prev => ({ ...prev, [org.id]: [] }))
  }

  const updateOrg = (org: Org) =>
    setOrgs(prev => prev.map(o => o.id === org.id ? org : o))

  const deleteOrg = (orgId: string) => {
    setOrgs(prev => prev.filter(o => o.id !== orgId))
    setDomains(prev => { const next = { ...prev }; delete next[orgId]; return next })
  }

  // ── Domain CRUD ──
  const setOrgDomains = (orgId: string, fn: (prev: Domain[]) => Domain[]) =>
    setDomains(prev => ({ ...prev, [orgId]: fn(prev[orgId] ?? []) }))

  const addDomain = (orgId: string, domain: Omit<Domain, 'projects' | 'knowledge'>) =>
    setOrgDomains(orgId, prev => [...prev, { ...domain, projects: [], knowledge: [] }])

  const updateDomain = (orgId: string, domain: Domain) =>
    setOrgDomains(orgId, prev => prev.map(d => d.id === domain.id ? domain : d))

  const deleteDomain = (orgId: string, domainId: string) =>
    setOrgDomains(orgId, prev => prev.filter(d => d.id !== domainId))

  // ── Project CRUD ──
  const addProject = (orgId: string, domainId: string, partial: Partial<Project> & { name: string }) => {
    const newProject: Project = {
      id: uid(), description: '', environment: 'production',
      agents: [], investigations: 0, docs: 0,
      dataSources: mkDS(), components: [], knowledge: mkKnowledge(), notifications: mkNotifications(),
      ...partial,
    }
    setOrgDomains(orgId, prev =>
      prev.map(d => d.id === domainId ? { ...d, projects: [...d.projects, newProject] } : d)
    )
  }

  const updateProject = (orgId: string, domainId: string, project: Project) =>
    setOrgDomains(orgId, prev =>
      prev.map(d => d.id === domainId
        ? { ...d, projects: d.projects.map(p => p.id === project.id ? project : p) }
        : d
      )
    )

  const deleteProject = (orgId: string, domainId: string, projectId: string) =>
    setOrgDomains(orgId, prev =>
      prev.map(d => d.id === domainId
        ? { ...d, projects: d.projects.filter(p => p.id !== projectId) }
        : d
      )
    )

  return (
    <ProjectsContext.Provider value={{
      orgs, domains,
      getOrg, getDomain, getProject, getAllDomains, getAllProjects,
      addOrg, updateOrg, deleteOrg,
      addDomain, updateDomain, deleteDomain,
      addProject, updateProject, deleteProject,
    }}>
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjects() {
  const ctx = useContext(ProjectsContext)
  if (!ctx) throw new Error('useProjects must be used inside ProjectsProvider')
  return ctx
}
