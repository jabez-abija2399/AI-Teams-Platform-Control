export type EmployeeStatus =
  | 'Idle'
  | 'Thinking'
  | 'Working'
  | 'Waiting User'
  | 'Reviewing'
  | 'Testing'
  | 'Deploying'
  | 'Completed'
  | 'Blocked'
  | 'Paused';

export type ProjectPhaseState =
  | 'Planning'
  | 'Discovery'
  | 'Approval'
  | 'Architecture'
  | 'Development'
  | 'Testing'
  | 'Deployment'
  | 'Completed'
  | 'Paused'
  | 'Failed';

export type MissionEventType =
  | 'MissionStarted'
  | 'MissionCompleted'
  | 'AgentStarted'
  | 'AgentFinished'
  | 'ApprovalRequested'
  | 'ApprovalReceived'
  | 'ReviewStarted'
  | 'DeploymentStarted'
  | 'DeploymentFinished'
  | 'PreviewCreated';

export interface MissionTimelineItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'waiting';
  startedAt?: string;
  completedAt?: string;
  assignedAgents: string[];
  dependencies: string[];
  duration?: string;
  history: string[];
}

export interface AIEmployee {
  id: string;
  role: string;
  name: string;
  avatar: string;
  status: EmployeeStatus;
  currentTask: string;
  progress: number;
  lastMessage: string;
  startedAt?: string;
  estimatedCompletion?: string;
  health: 'healthy' | 'warning' | 'error';
}

export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  agentRole: string;
  agentName: string;
  message: string;
  category: 'update' | 'decision' | 'milestone' | 'approval';
  details?: Record<string, unknown>;
}

export interface WorkspaceState {
  projectId: string;
  projectName: string;
  currentPhase: ProjectPhaseState;
  overallProgress: number;
  estimatedTimeRemaining: string;
  mode: 'creator' | 'developer';
  isPaused: boolean;
  timeline: MissionTimelineItem[];
  employees: AIEmployee[];
  activityFeed: ActivityFeedItem[];
}
