export type ProjectPhase =
  | 'CREATED'
  | 'DISCOVERY'
  | 'PLANNING'
  | 'ARCHITECTURE'
  | 'DESIGN'
  | 'EXECUTION'
  | 'DEBATE'
  | 'REVIEW'
  | 'DEPLOYMENT_READY'
  | 'COMPLETED'
  | 'FAILED'
  | 'PAUSED';

export const PHASE_ORDER: ProjectPhase[] = [
  'CREATED',
  'DISCOVERY',
  'PLANNING',
  'ARCHITECTURE',
  'DESIGN',
  'EXECUTION',
  'DEBATE',
  'REVIEW',
  'DEPLOYMENT_READY',
  'COMPLETED'
];

export const VALID_TRANSITIONS: Record<ProjectPhase, ProjectPhase[]> = {
  CREATED: ['DISCOVERY', 'FAILED', 'PAUSED'],
  DISCOVERY: ['PLANNING', 'FAILED', 'PAUSED'],
  PLANNING: ['ARCHITECTURE', 'FAILED', 'PAUSED'],
  ARCHITECTURE: ['DESIGN', 'FAILED', 'PAUSED'],
  DESIGN: ['EXECUTION', 'FAILED', 'PAUSED'],
  EXECUTION: ['DEBATE', 'FAILED', 'PAUSED'],
  DEBATE: ['REVIEW', 'FAILED', 'PAUSED', 'EXECUTION'],
  REVIEW: ['DEPLOYMENT_READY', 'FAILED', 'PAUSED'],
  DEPLOYMENT_READY: ['COMPLETED', 'FAILED', 'PAUSED'],
  COMPLETED: [],
  FAILED: ['DISCOVERY', 'PLANNING', 'ARCHITECTURE', 'DESIGN', 'EXECUTION', 'DEBATE', 'REVIEW', 'DEPLOYMENT_READY'],
  PAUSED: ['DISCOVERY', 'PLANNING', 'ARCHITECTURE', 'DESIGN', 'EXECUTION', 'DEBATE', 'REVIEW', 'DEPLOYMENT_READY', 'FAILED'],
};

export function canTransition(from: ProjectPhase, to: ProjectPhase): boolean {
  if (from === to) return true;
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export type ProjectLifecycleState = ProjectPhase;

export type CompanyEventType =
  | 'PROJECT_CREATED'
  | 'NODE_STARTED'
  | 'NODE_COMPLETED'
  | 'NODE_FAILED'
  | 'DISCOVERY_COMPLETED'
  | 'PRODUCT_APPROVED'
  | 'ARCHITECTURE_APPROVED'
  | 'TASK_CREATED'
  | 'TASK_STARTED'
  | 'TASK_COMPLETED'
  | 'REVIEW_COMPLETED'
  | 'BUILD_COMPLETED'
  | 'PROJECT_COMPLETED'
  | 'EXECUTION_PAUSED'
  | 'EXECUTION_RESUMED'
  | 'EXECUTION_FAILED'
  | 'RECOVERY_ATTEMPTED'
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_GRANTED'
  | 'APPROVAL_REJECTED'
  | 'HANDOFF_COMPLETED'
  | 'LIFECYCLE_STARTED'
  | 'LIFECYCLE_RESUMED';

export interface CompanyEvent<T = Record<string, any>> {
  id: string;
  type: CompanyEventType;
  projectId: string;
  timestamp: number;
  payload: T;
  source: string;
}

export type EventListener<T = Record<string, any>> = (event: CompanyEvent<T>) => void | Promise<void>;

export type ExecutionHealth = 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'PAUSED';

export interface ExecutionError {
  message: string;
  code: string;
  timestamp: number;
  stage?: ProjectPhase;
  recoverable?: boolean;
}

export interface ExecutionState {
  projectId: string;
  currentPhase: ProjectPhase;
  previousPhase?: ProjectPhase;
  currentMilestone?: string;
  currentTask?: string;
  activeAgents: string[];
  queuedTasks: string[];
  completedTasks: string[];
  blockedTasks: string[];
  lastEvent?: CompanyEvent;
  executionHealth: ExecutionHealth;
  error?: ExecutionError;
  updatedAt: number;
}

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export interface PipelineConfig {
  autoAdvance?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  recoverOnFailure?: boolean;
}

export interface PipelineStageResult<T = any> {
  stage: ProjectPhase;
  success: boolean;
  data?: T;
  error?: string;
  durationMs: number;
}