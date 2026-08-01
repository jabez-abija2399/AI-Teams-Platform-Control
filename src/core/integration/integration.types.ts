export type ProjectLifecycleState =
  | 'CREATED'
  | 'DISCOVERY'
  | 'PLANNING'
  | 'ARCHITECTURE'
  | 'EXECUTION'
  | 'REVIEW'
  | 'DEPLOYMENT_READY'
  | 'COMPLETED'
  | 'FAILED'
  | 'PAUSED';

export type CompanyEventType =
  | 'PROJECT_CREATED'
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
  stage?: ProjectLifecycleState;
  recoverable?: boolean;
}

export interface ExecutionState {
  projectId: string;
  currentPhase: ProjectLifecycleState;
  previousPhase?: ProjectLifecycleState;
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
  stage: ProjectLifecycleState;
  success: boolean;
  data?: T;
  error?: string;
  durationMs: number;
}
