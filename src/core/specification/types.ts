export interface FunctionalRequirement {
  id: string;
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
}

export interface UserStory {
  id: string;
  asA: string;
  iWantTo: string;
  soThat: string;
  acceptanceCriteria: string[];
}

export interface DatabaseRequirement {
  tableName: string;
  fields: { name: string; type: string; isRequired: boolean }[];
  relationships: string[];
}

export interface ApiRequirement {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  requestPayload?: string;
  responsePayload?: string;
}

export interface SystemRisk {
  id: string;
  risk: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  mitigationStrategy: string;
}

export interface SoftwareRequirementsSpecification {
  id: string;
  projectId: string;
  rawIdea: string;
  executiveSummary: string;
  problemStatement: string;
  proposedSolution: string;
  projectGoals: string[];
  targetUsers: string[];
  functionalRequirements: FunctionalRequirement[];
  nonFunctionalRequirements: {
    performance: string[];
    security: string[];
    accessibility: string[];
    responsiveDesign: string[];
    analytics: string[];
    deployment: string[];
  };
  userStories: UserStory[];
  databaseRequirements: DatabaseRequirement[];
  apiRequirements: ApiRequirement[];
  authenticationStrategy: string;
  authorizationStrategy: string;
  futureEnhancements: string[];
  knownRisks: SystemRisk[];
  openQuestions: string[];
  estimatedComplexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'ENTERPRISE';
  estimatedTimelineDays: number;
  estimatedCostUSD: number;
  recommendedWorkflow: string[];
  isApproved: boolean;
  approvedAt?: string;
  createdAt: string;
}
