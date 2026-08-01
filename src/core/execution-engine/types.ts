import type { AgentRole } from '@/ai/agents/core/agent.types';

export type ProjectExecutionStatus =
  | 'CREATED'
  | 'PLANNING'
  | 'ARCHITECTURE'
  | 'DEVELOPMENT'
  | 'TESTING'
  | 'REVIEW'
  | 'APPROVAL_REQUIRED'
  | 'WAITING_FOR_APPROVAL'
  | 'WAITING_FOR_ARCHITECTURE_APPROVAL'
  | 'ARCHITECTURE_APPROVED'
  | 'ARCHITECTURE_REJECTED'
  | 'DEPLOYMENT'
  | 'COMPLETED'
  | 'FAILED'
  | 'IN_PROGRESS'
  | 'ARCHIVED';

export interface ProjectEntity {
  id: string;
  owner: string;
  name: string;
  description: string;
  status: ProjectExecutionStatus;
  currentWorkflow: string;
  assignedAgents: AgentRole[];
  createdAt: Date;
  updatedAt: Date;
}

export type TaskExecutionState =
  | 'PENDING'
  | 'ASSIGNED'
  | 'RUNNING'
  | 'WAITING_APPROVAL'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'BLOCKED';

export type TaskPriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ProjectTaskEntity {
  id: string;
  projectId: string;
  agentRole: AgentRole;
  description: string;
  priority: TaskPriorityLevel;
  dependencies: string[]; // array of task IDs that must complete first
  status: TaskExecutionState;
  inputArtifacts: string[]; // artifact IDs or references
  outputArtifacts: string[]; // artifact IDs or references
  createdAt: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
  requiresApproval?: boolean;
  approvalReason?: string;
  error?: string;
}

export interface ExecutionArtifactEntity {
  id: string;
  ownerAgent: AgentRole;
  projectId: string;
  type: string;
  title: string;
  content: unknown;
  version: number;
  createdDate: Date;
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'REJECTED';
}

export interface ApprovalRequest {
  id: string;
  projectId: string;
  taskId: string;
  artifactId?: string;
  requestedBy: AgentRole;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  date: Date;
}

export interface ExecutionVisibilityEvent {
  id: string;
  projectId: string;
  type: 'INFO' | 'STEP' | 'SUCCESS' | 'ERROR' | 'APPROVAL' | 'RETRY';
  message: string;
  creatorModeMessage: string;
  developerDetails?: Record<string, unknown>;
  timestamp: Date;
}

export interface DeveloperTimelineEntry {
  id: string;
  projectId: string;
  taskId?: string;
  agentRole?: AgentRole;
  status: string;
  message: string;
  timestamp: Date;
  durationMs?: number;
  qualityScore?: number;
  error?: string;
  retryCount?: number;
}
