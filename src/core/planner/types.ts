import { SoftwareRequirementsSpecification } from '../specification/types';

export interface PlannedTask {
  id: string;
  title: string;
  assignedAgent: string;
  dependencies: string[];
  estimatedDurationHours: number;
  taskType: 'SPECIFICATION' | 'ARCHITECTURE' | 'DATABASE' | 'BACKEND' | 'FRONTEND' | 'QA' | 'SECURITY' | 'DEPLOYMENT';
  isParallelAllowed: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDay: number;
  associatedTaskIds: string[];
}

export interface ExecutionPlan {
  projectId: string;
  specificationId: string;
  complexity: SoftwareRequirementsSpecification['estimatedComplexity'];
  estimatedDays: number;
  estimatedBudgetUSD: number;
  requiredAgents: string[];
  requiredDbTables: string[];
  requiredApis: string[];
  requiredComponents: string[];
  criticalPath: string[];
  tasks: PlannedTask[];
  dagEdges: { from: string; to: string }[];
  milestones: Milestone[];
  sprintPlan: {
    sprintNumber: number;
    goal: string;
    taskIds: string[];
  }[];
}
