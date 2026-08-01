import type { CompanyRole, ExperienceLevel } from '../types';

export interface CapabilitySummary {
  skill: string;
  confidence: number;
}

export interface TaskContextDetails {
  id: string;
  title: string;
  description: string;
  objective: string;
  dependencies: string[];
  expectedOutput: string;
}

export interface ProjectContextDetails {
  vision: string;
  productSpecification: string;
  architectureDecisions: string[];
  technologyStack: string[];
}

export interface MemoryContextDetails {
  previousDecisions: string[];
  constraints: string[];
  risks: string[];
  lessonsLearned: string[];
}

export interface ReviewerRequirements {
  securityChecks: boolean;
  qualityChecks: boolean;
  testingRequirements: boolean;
}

export interface AgentExecutionContext {
  agentId: string;
  role: CompanyRole;
  personality: string;
  experienceLevel: ExperienceLevel;
  capabilities: CapabilitySummary[];
  task: TaskContextDetails;
  project: ProjectContextDetails;
  memory: MemoryContextDetails;
  reviewerRequirements: ReviewerRequirements;
}
