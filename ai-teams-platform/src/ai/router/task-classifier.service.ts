import { AgentRole } from '@/ai/agents/core/agent.types';

export type TaskCategory = 'CODING' | 'PLANNING' | 'ARCHITECTURE' | 'TESTING' | 'DOCUMENTATION' | 'ANALYSIS' | 'CONVERSATION';

const ROLE_TASK_CATEGORY: Record<AgentRole, TaskCategory> = {
  CEO: 'PLANNING',
  ARCHITECT: 'ARCHITECTURE',
  DEVELOPER: 'CODING',
  QA: 'TESTING',
  DOCUMENTATION: 'DOCUMENTATION',
  DEVOPS: 'CODING',
  UI_UX: 'CODING',
  SECURITY: 'ANALYSIS',
  OPERATIONS: 'ANALYSIS',
};

export function classifyTask(role: AgentRole): TaskCategory {
  return ROLE_TASK_CATEGORY[role];
}
