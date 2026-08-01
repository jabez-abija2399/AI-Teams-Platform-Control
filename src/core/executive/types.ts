export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type WorkStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'failed';

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  estimatedDuration: string;
  dependencies: string[];
  completionPercentage: number;
  status: WorkStatus;
}

export interface WorkPackage {
  id: string;
  projectId: string;
  milestoneId: string;
  objective: string;
  ownerAgent: string;
  estimatedEffort: string;
  dependencies: string[];
  risks: string[];
  deliverables: string[];
}

export interface ExecutiveTask {
  id: string;
  projectId: string;
  workPackageId: string;
  title: string;
  description: string;
  assignedAgent: string;
  reviewerAgent: string;
  priority: PriorityLevel;
  status: WorkStatus;
  estimatedTime: string;
  actualTime?: string;
  blockers: string[];
  dependencyChain: string[];
  completionPercentage: number;
}

export interface AgentWorkload {
  agentRole: string;
  agentName: string;
  assignedTaskCount: number;
  activeTasks: string[];
  workloadPercentage: number;
}

export interface ExecutiveDashboardData {
  projectId: string;
  healthScore: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
  activeMilestonesCount: number;
  blockedTasksCount: number;
  totalTasksCount: number;
  completedTasksCount: number;
  estimatedCompletion: string;
  milestones: Milestone[];
  workPackages: WorkPackage[];
  tasks: ExecutiveTask[];
  agentWorkloads: AgentWorkload[];
  risks: string[];
  recommendations: string[];
}
