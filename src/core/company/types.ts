export type CompanyProjectState =
  | 'CREATED'
  | 'DISCOVERY'
  | 'CLARIFICATION'
  | 'PRODUCT_APPROVAL'
  | 'ARCHITECTURE'
  | 'PLANNING'
  | 'EXECUTION'
  | 'REVIEW'
  | 'DEPLOYMENT'
  | 'COMPLETED'
  | 'FAILED'
  | 'PAUSED';

export type CompanyEventType =
  | 'PROJECT_CREATED'
  | 'DISCOVERY_COMPLETED'
  | 'CLARIFICATION_COMPLETED'
  | 'PRODUCT_APPROVED'
  | 'ARCHITECTURE_APPROVED'
  | 'PLAN_READY'
  | 'TASK_ASSIGNED'
  | 'TASK_STARTED'
  | 'TASK_COMPLETED'
  | 'TASK_FAILED'
  | 'REVIEW_STARTED'
  | 'REVIEW_COMPLETED'
  | 'DEPLOYMENT_STARTED'
  | 'DEPLOYMENT_COMPLETED'
  | 'PROJECT_FINISHED'
  | 'WORKER_STALLED'
  | 'DEADLOCK_DETECTED'
  | 'HEARTBEAT_CHECK'
  | 'SUPERVISOR_RECOMMENDATION'
  | 'EXECUTION_PAUSED'
  | 'EXECUTION_RESUMED';

export interface CompanyEvent<T = Record<string, any>> {
  id: string;
  type: CompanyEventType;
  projectId: string;
  timestamp: number;
  payload: T;
  source: string;
}

export type CompanyEventListener<T = Record<string, any>> = (
  event: CompanyEvent<T>
) => void | Promise<void>;

export type WorkerStatus = 'IDLE' | 'WORKING' | 'STALLED' | 'FAILED';

export interface CompanyWorker {
  id: string;
  role: string;
  status: WorkerStatus;
  currentTaskId?: string;
  currentTaskTitle?: string;
  startTime?: number;
  lastHeartbeat: number;
  utilizationPercentage: number;
}

export type TaskStatus = 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'BLOCKED';

export interface CompanyTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  role: string;
  status: TaskStatus;
  startTime?: number;
  endTime?: number;
  durationMs: number;
  retries: number;
  maxRetries: number;
  error?: string;
  metadata?: Record<string, any>;
}

export type CompanyHealthStatus = 'HEALTHY' | 'DEGRADED' | 'STALLED' | 'FAILED' | 'PAUSED';

export interface CompanyHealthReport {
  projectId: string;
  status: CompanyHealthStatus;
  runningWorkersCount: number;
  stalledWorkersCount: number;
  blockedTasksCount: number;
  deadlocksDetected: boolean;
  failedRetriesCount: number;
  resourceUtilization: number; // 0 to 100
  issues: string[];
  timestamp: number;
}

export interface CompanySupervisorRecommendation {
  id: string;
  projectId: string;
  type: 'REBALANCE_WORKERS' | 'RETRY_TASK' | 'ESCALATE_REVIEW' | 'OPTIMIZE_SPEED' | 'HEALTH_WARNING';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  suggestedAction: string;
  timestamp: number;
}

export interface CompanyStopwatchMetrics {
  totalProjectDurationMs: number;
  taskDurationMs: number;
  reviewDurationMs: number;
  idleTimeMs: number;
  approvalWaitingTimeMs: number;
  agentUtilization: Record<string, number>;
  lastUpdated: number;
}

export interface CompanyCheckpoint {
  id: string;
  projectId: string;
  state: CompanyProjectState;
  eventIndex: number;
  activeWorkers: CompanyWorker[];
  completedTasks: string[];
  queuedTasks: CompanyTask[];
  stopwatchMetrics: CompanyStopwatchMetrics;
  timestamp: number;
  resumePayload?: Record<string, any>;
}

export interface CompanyStatusReport {
  projectId: string;
  currentState: CompanyProjectState;
  currentEvent?: CompanyEvent;
  heartbeat: CompanyHealthReport;
  runningWorkers: CompanyWorker[];
  queue: CompanyTask[];
  nextPlannedEvent?: CompanyEventType;
  health: CompanyHealthStatus;
  timeline: CompanyEvent[];
  companyStatus: string;
  stopwatch: CompanyStopwatchMetrics;
  recommendations: CompanySupervisorRecommendation[];
}
