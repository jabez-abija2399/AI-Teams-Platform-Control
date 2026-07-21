import type { WorkflowDefinition } from '../core/workflow.types';

export const SOFTWARE_PROJECT_TEMPLATE: WorkflowDefinition = {
  id: 'software-project',
  name: 'Software Project',
  description: 'Full software development workflow from requirements to delivery',
  steps: [
    {
      name: 'Requirements Analysis',
      description: 'Break down requirements into actionable tasks with priorities',
      agentRole: 'CEO',
    },
    {
      name: 'Architecture Design',
      description: 'Design system architecture and create technical specifications',
      agentRole: 'ARCHITECT',
    },
    {
      name: 'Implementation',
      description: 'Implement the software according to technical specifications',
      agentRole: 'DEVELOPER',
    },
    {
      name: 'Quality Assurance',
      description: 'Review code, write tests, verify implementation quality',
      agentRole: 'QA',
    },
  ],
};

export const templates = new Map<string, WorkflowDefinition>([
  [SOFTWARE_PROJECT_TEMPLATE.id, SOFTWARE_PROJECT_TEMPLATE],
]);

export function getTemplate(id: string): WorkflowDefinition | undefined {
  return templates.get(id);
}

export function getAllTemplates(): WorkflowDefinition[] {
  return Array.from(templates.values());
}
