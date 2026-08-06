export type ProjectLifecycleState =
  | 'CREATED'
  | 'DISCOVERY_RUNNING'
  | 'CLARIFICATION_RUNNING'
  | 'PROPOSAL_RUNNING'
  | 'STRATEGY_RUNNING'
  | 'PRODUCT_RUNNING'
  | 'ANALYSIS_RUNNING'
  | 'DESIGN_RUNNING'
  | 'ARCHITECTURE_RUNNING'
  | 'PLANNING_RUNNING'
  | 'DEVELOPMENT_RUNNING'
  | 'TESTING_RUNNING'
  | 'REVIEW_RUNNING'
  | 'SECURITY_RUNNING'
  | 'DEPLOYMENT_RUNNING'
  | 'MONITORING'
  | 'COMPLETED'
  | 'FAILED'
  | 'PAUSED';

export type ApprovalGateType =
  | 'Product Approval'
  | 'Architecture Approval'
  | 'Design Approval'
  | 'QA Approval'
  | 'Deployment Approval';

export interface PhaseDefinition {
  state: ProjectLifecycleState;
  department: string;
  agentRole: string;
  inputArtifactType?: string;
  outputArtifactType: string;
  nextState?: ProjectLifecycleState;
  approvalRequiredAfter?: ApprovalGateType;
  progressPercentage: number;
}

export const PIPELINE_PHASE_DEFINITIONS: Record<ProjectLifecycleState, PhaseDefinition> = {
  CREATED: {
    state: 'CREATED',
    department: 'Intake',
    agentRole: 'SYSTEM',
    outputArtifactType: 'ProjectIdea',
    nextState: 'DISCOVERY_RUNNING',
    progressPercentage: 0,
  },
  DISCOVERY_RUNNING: {
    state: 'DISCOVERY_RUNNING',
    department: 'Product Discovery',
    agentRole: 'PRODUCT_DISCOVERY',
    inputArtifactType: 'ProjectIdea',
    outputArtifactType: 'ProductSpecification',
    nextState: 'CLARIFICATION_RUNNING',
    progressPercentage: 6,
  },
  CLARIFICATION_RUNNING: {
    state: 'CLARIFICATION_RUNNING',
    department: 'Clarification',
    agentRole: 'PRODUCT_DISCOVERY',
    inputArtifactType: 'ProductSpecification',
    outputArtifactType: 'ClarifiedSpecification',
    nextState: 'PROPOSAL_RUNNING',
    progressPercentage: 10,
  },
  PROPOSAL_RUNNING: {
    state: 'PROPOSAL_RUNNING',
    department: 'Product Proposal',
    agentRole: 'PRODUCT_MANAGER',
    inputArtifactType: 'ClarifiedSpecification',
    outputArtifactType: 'ProductProposal',
    nextState: 'STRATEGY_RUNNING',
    approvalRequiredAfter: 'Product Approval',
    progressPercentage: 14,
  },
  STRATEGY_RUNNING: {
    state: 'STRATEGY_RUNNING',
    department: 'Executive Strategy',
    agentRole: 'CEO',
    inputArtifactType: 'ProductSpecification',
    outputArtifactType: 'BusinessStrategy',
    nextState: 'PRODUCT_RUNNING',
    progressPercentage: 16,
  },
  PRODUCT_RUNNING: {
    state: 'PRODUCT_RUNNING',
    department: 'Product Management',
    agentRole: 'PRODUCT_MANAGER',
    inputArtifactType: 'BusinessStrategy',
    outputArtifactType: 'PRD',
    nextState: 'ANALYSIS_RUNNING',
    progressPercentage: 25,
  },
  ANALYSIS_RUNNING: {
    state: 'ANALYSIS_RUNNING',
    department: 'Business Analysis',
    agentRole: 'BUSINESS_ANALYST',
    inputArtifactType: 'PRD',
    outputArtifactType: 'BusinessSpecification',
    nextState: 'PLANNING_RUNNING',
    progressPercentage: 33,
  },
  PLANNING_RUNNING: {
    state: 'PLANNING_RUNNING',
    department: 'Project Planning',
    agentRole: 'OPERATIONS',
    inputArtifactType: 'BusinessSpecification',
    outputArtifactType: 'ProjectPlan',
    nextState: 'ARCHITECTURE_RUNNING',
    progressPercentage: 40,
  },
  ARCHITECTURE_RUNNING: {
    state: 'ARCHITECTURE_RUNNING',
    department: 'System Architecture',
    agentRole: 'ARCHITECT',
    inputArtifactType: 'ProjectPlan',
    outputArtifactType: 'ArchitectureDocument',
    nextState: 'DESIGN_RUNNING',
    approvalRequiredAfter: 'Architecture Approval',
    progressPercentage: 50,
  },
  DESIGN_RUNNING: {
    state: 'DESIGN_RUNNING',
    department: 'UX/UI Design',
    agentRole: 'UI_UX',
    inputArtifactType: 'ArchitectureDocument',
    outputArtifactType: 'DesignSpecification',
    nextState: 'DEVELOPMENT_RUNNING',
    approvalRequiredAfter: 'Design Approval',
    progressPercentage: 58,
  },
  DEVELOPMENT_RUNNING: {
    state: 'DEVELOPMENT_RUNNING',
    department: 'Software Engineering',
    agentRole: 'DEVELOPER',
    inputArtifactType: 'DesignSpecification',
    outputArtifactType: 'Implementation',
    nextState: 'TESTING_RUNNING',
    progressPercentage: 68,
  },
  TESTING_RUNNING: {
    state: 'TESTING_RUNNING',
    department: 'Quality Assurance',
    agentRole: 'QA',
    inputArtifactType: 'Implementation',
    outputArtifactType: 'QualityReport',
    nextState: 'REVIEW_RUNNING',
    approvalRequiredAfter: 'QA Approval',
    progressPercentage: 78,
  },
  REVIEW_RUNNING: {
    state: 'REVIEW_RUNNING',
    department: 'Review Committee',
    agentRole: 'REVIEWER',
    inputArtifactType: 'QualityReport',
    outputArtifactType: 'ReviewReport',
    nextState: 'SECURITY_RUNNING',
    progressPercentage: 82,
  },
  SECURITY_RUNNING: {
    state: 'SECURITY_RUNNING',
    department: 'Security Engineering',
    agentRole: 'SECURITY',
    inputArtifactType: 'ReviewReport',
    outputArtifactType: 'SecurityReport',
    nextState: 'DEPLOYMENT_RUNNING',
    progressPercentage: 86,
  },
  DEPLOYMENT_RUNNING: {
    state: 'DEPLOYMENT_RUNNING',
    department: 'DevOps & Deployment',
    agentRole: 'DEVOPS',
    inputArtifactType: 'SecurityReport',
    outputArtifactType: 'DeploymentArtifact',
    nextState: 'MONITORING',
    // Preview ready — user decides whether to deploy (not auto)
    approvalRequiredAfter: 'Deployment Approval',
    progressPercentage: 94,
  },
  MONITORING: {
    state: 'MONITORING',
    department: 'Operations & Monitoring',
    agentRole: 'OPERATIONS',
    inputArtifactType: 'DeploymentArtifact',
    outputArtifactType: 'TelemetryReport',
    nextState: 'COMPLETED',
    progressPercentage: 98,
  },
  COMPLETED: {
    state: 'COMPLETED',
    department: 'Company Operations',
    agentRole: 'SYSTEM',
    outputArtifactType: 'FinalRelease',
    progressPercentage: 100,
  },
  FAILED: {
    state: 'FAILED',
    department: 'System Recovery',
    agentRole: 'SYSTEM',
    outputArtifactType: 'ErrorReport',
    progressPercentage: 0,
  },
  PAUSED: {
    state: 'PAUSED',
    department: 'Awaiting Approval / Input',
    agentRole: 'SYSTEM',
    outputArtifactType: 'PausedState',
    progressPercentage: 0,
  },
};

export const VALID_STATE_TRANSITIONS: Record<ProjectLifecycleState, ProjectLifecycleState[]> = {
  CREATED: ['DISCOVERY_RUNNING', 'FAILED'],
  DISCOVERY_RUNNING: ['CLARIFICATION_RUNNING', 'FAILED', 'PAUSED'],
  CLARIFICATION_RUNNING: ['PROPOSAL_RUNNING', 'FAILED', 'PAUSED'],
  PROPOSAL_RUNNING: ['STRATEGY_RUNNING', 'FAILED', 'PAUSED', 'CLARIFICATION_RUNNING'],
  STRATEGY_RUNNING: ['PRODUCT_RUNNING', 'FAILED', 'PAUSED'],
  PRODUCT_RUNNING: ['ANALYSIS_RUNNING', 'FAILED', 'PAUSED'],
  ANALYSIS_RUNNING: ['PLANNING_RUNNING', 'FAILED', 'PAUSED'],
  PLANNING_RUNNING: ['ARCHITECTURE_RUNNING', 'FAILED', 'PAUSED'],
  ARCHITECTURE_RUNNING: ['DESIGN_RUNNING', 'FAILED', 'PAUSED'],
  DESIGN_RUNNING: ['DEVELOPMENT_RUNNING', 'FAILED', 'PAUSED'],
  DEVELOPMENT_RUNNING: ['TESTING_RUNNING', 'FAILED', 'PAUSED'],
  TESTING_RUNNING: ['REVIEW_RUNNING', 'FAILED', 'PAUSED', 'DEVELOPMENT_RUNNING'],
  REVIEW_RUNNING: ['SECURITY_RUNNING', 'FAILED', 'PAUSED', 'TESTING_RUNNING'],
  SECURITY_RUNNING: ['DEPLOYMENT_RUNNING', 'FAILED', 'PAUSED', 'DEVELOPMENT_RUNNING'],
  DEPLOYMENT_RUNNING: ['MONITORING', 'FAILED', 'PAUSED'],
  MONITORING: ['COMPLETED', 'FAILED', 'PAUSED'],
  COMPLETED: [],
  FAILED: [
    'DISCOVERY_RUNNING',
    'CLARIFICATION_RUNNING',
    'PROPOSAL_RUNNING',
    'STRATEGY_RUNNING',
    'PRODUCT_RUNNING',
    'ANALYSIS_RUNNING',
    'DESIGN_RUNNING',
    'ARCHITECTURE_RUNNING',
    'PLANNING_RUNNING',
    'DEVELOPMENT_RUNNING',
    'TESTING_RUNNING',
    'REVIEW_RUNNING',
    'SECURITY_RUNNING',
    'DEPLOYMENT_RUNNING',
    'CREATED',
  ],
  PAUSED: [
    'DISCOVERY_RUNNING',
    'CLARIFICATION_RUNNING',
    'PROPOSAL_RUNNING',
    'STRATEGY_RUNNING',
    'PRODUCT_RUNNING',
    'ANALYSIS_RUNNING',
    'DESIGN_RUNNING',
    'ARCHITECTURE_RUNNING',
    'PLANNING_RUNNING',
    'DEVELOPMENT_RUNNING',
    'TESTING_RUNNING',
    'REVIEW_RUNNING',
    'SECURITY_RUNNING',
    'DEPLOYMENT_RUNNING',
    'MONITORING',
    'FAILED',
  ],
};

export interface MissionControlStatus {
  projectId: string;
  currentDepartment: string;
  activeAgent: string;
  currentPhase: ProjectLifecycleState;
  currentArtifact: string | null;
  progress: number;
  nextAction: string | null;
  waitingApprovals: ApprovalGateType[];
  completedPhases: string[];
  risks: string[];
  pausedAtPhase?: ProjectLifecycleState;
}
