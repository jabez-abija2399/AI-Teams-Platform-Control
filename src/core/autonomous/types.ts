export type ExecutionState =
  | 'Queued'
  | 'Ready'
  | 'Running'
  | 'Waiting'
  | 'Blocked'
  | 'Reviewing'
  | 'Failed'
  | 'Retrying'
  | 'Completed'
  | 'Cancelled';

export type ReviewStage = 'Architecture' | 'Code' | 'Security' | 'QA';

export interface ConflictReport {
  id: string;
  projectId: string;
  conflictType: 'api_contract_mismatch' | 'file_ownership' | 'decision_inconsistency' | 'dependency_violation' | 'duplicate_work';
  description: string;
  affectedTask: string;
  resolved: boolean;
  timestamp: string;
}

export interface ReviewReport {
  taskId: string;
  stage: ReviewStage;
  approved: boolean;
  score: number;
  feedback: string;
  reviewerAgent: string;
}

export interface ExecutionTimelineEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  agentRole: string;
  state: ExecutionState;
  timestamp: string;
  details: string;
}

export interface AutonomousStatus {
  projectId: string;
  concurrencyLimit: number;
  activeWorkersCount: number;
  queuedTasksCount: number;
  runningTasksCount: number;
  reviewingTasksCount: number;
  completedTasksCount: number;
  failedTasksCount: number;
  retriesCount: number;
  conflictsCount: number;
  workerUtilizationPercentage: number;
}
