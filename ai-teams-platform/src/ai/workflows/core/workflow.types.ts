import { z } from 'zod';
import type { AgentRole } from '../../agents/core/agent.types';

export const WorkflowStatusSchema = z.enum([
  'PENDING',
  'RUNNING',
  'PAUSED',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);
export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;

export const StepStatusSchema = z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED']);
export type StepStatus = z.infer<typeof StepStatusSchema>;

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  agentRole: AgentRole;
  status: StepStatus;
  input?: string;
  output?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  order: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: Array<{
    name: string;
    description: string;
    agentRole: AgentRole;
  }>;
}

export interface WorkflowInstance {
  id: string;
  definitionId: string;
  name: string;
  projectId: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  currentStepIndex: number;
  input?: string;
  output?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface WorkflowProgress {
  workflowId: string;
  status: WorkflowStatus;
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  percentComplete: number;
  steps: Array<{
    name: string;
    status: StepStatus;
    agentRole: AgentRole;
    output?: string;
    error?: string;
  }>;
}
