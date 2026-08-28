import type { AgentRole } from '@/packages/agents/core/agent.types';

export interface WorkflowStep {
  step: string;
  agent: AgentRole;
  taskTitle: string;
  taskType: string;
  next?: string;
  onFailure?: string;
  retryLimit?: number;
  inputTransformer?: (previousResults: Record<string, unknown>, initialInput: unknown) => unknown;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  initialStep: string;
  steps: Record<string, WorkflowStep>;
}

export interface WorkflowExecutionState {
  workflowId: string;
  projectId: string;
  currentStep: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED';
  stepResults: Record<string, unknown>;
  history: Array<{
    step: string;
    agent: AgentRole;
    status: 'SUCCESS' | 'FAILURE';
    error?: string;
    timestamp: Date;
  }>;
}
