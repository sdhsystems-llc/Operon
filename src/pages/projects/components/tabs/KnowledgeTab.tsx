import type { Project } from '../../types'
import { KnowledgeDocsPanel } from '../KnowledgeDocsPanel'

export function KnowledgeTab({ project, onUpdate }: { project: Project; onUpdate: (p: Project) => void }) {
  return (
    <KnowledgeDocsPanel
      docs={project.knowledge}
      subtitle={`${project.knowledge.length} docs grounding AI investigations for ${project.name}`}
      onAdd={doc => onUpdate({ ...project, knowledge: [...project.knowledge, doc], docs: project.docs + 1 })}
      onRemove={id => onUpdate({ ...project, knowledge: project.knowledge.filter(d => d.id !== id), docs: Math.max(0, project.docs - 1) })}
    />
  )
}
