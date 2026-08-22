/**
 * Project State — Single Source of Truth
 * 
 * Defines the comprehensive, typed state for an AI software engineering organization project.
 */

export type ProjectLifecycleStatus = 
  | 'INITIALIZING'
  | 'DISCOVERY'
  | 'REQUIREMENTS'
  | 'ARCHITECTURE'
  | 'DESIGN'
  | 'IMPLEMENTATION'
  | 'VERIFICATION'
  | 'REVIEW'
  | 'WAITING_FOR_APPROVAL'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED';

export type TaskStatus = 'PENDING' | 'READY' | 'RUNNING' | 'WAITING_APPROVAL' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type DefectSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DefectRootCauseOwner = 'PM' | 'ARCHITECT' | 'DESIGNER' | 'DEVELOPER';

export interface ProductScope {
  problem: string;
  targetUsers: string[];
  goals: string[];
  nonGoals: string[];
  assumptions: string[];
  constraints: string[];
  openQuestions: string[];
}

export interface UserStory {
  id: string;
  title: string;
  role: string;
  goal: string;
  benefit: string;
  acceptanceCriteria: string[];
  priority: TaskPriority;
  effort?: 'S' | 'M' | 'L' | 'XL';
}

export interface FeatureSpecification {
  id: string;
  name: string;
  description: string;
  linkedUserStories: string[];
  acceptanceCriteria: string[];
  dependencies: string[];
}

export interface NonFunctionalRequirement {
  id: string;
  category: 'PERFORMANCE' | 'SECURITY' | 'ACCESSIBILITY' | 'SCALABILITY' | 'RELIABILITY';
  requirement: string;
  rationale: string;
  verificationMethod: string;
}

export interface RequirementsState {
  version: number;
  productScope: ProductScope;
  features: FeatureSpecification[];
  userStories: UserStory[];
  nonFunctionalRequirements: NonFunctionalRequirement[];
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ArchitectureDecision {
  id: string;
  decision: string;
  selectedOption: string;
  alternativesConsidered: string[];
  rationale: string;
  tradeoffs: string[];
  reversibility: 'EASY' | 'MODERATE' | 'DIFFICULT';
}

export interface ArchitectureState {
  version: number;
  systemOverview: string;
  targetStack: {
    frontend?: string;
    backend?: string;
    database?: string;
    runtime?: string;
    styling?: string;
  };
  techDecisions: ArchitectureDecision[];
  databaseSchema: {
    entities: Array<{
      name: string;
      fields: Array<{ name: string; type: string; constraints?: string[] }>;
      relations?: Array<{ target: string; type: string }>;
    }>;
    rawSchema?: string;
  };
  apiDesign: {
    endpoints: Array<{
      path: string;
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      description: string;
      requestBody?: Record<string, unknown>;
      responseBody?: Record<string, unknown>;
      authRequired: boolean;
    }>;
  };
  fileStructure: Array<{
    path: string;
    purpose: string;
    layer: 'FRONTEND' | 'BACKEND' | 'DATABASE' | 'SHARED' | 'CONFIG' | 'TEST';
  }>;
  technicalRisks: Array<{ risk: string; impact: string; mitigation: string }>;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ComponentSpecification {
  name: string;
  filePath: string;
  description: string;
  props: Array<{ name: string; type: string; required: boolean; description?: string }>;
  stateVariants: {
    loading?: boolean;
    empty?: boolean;
    success?: boolean;
    error?: boolean;
    disabled?: boolean;
  };
  responsiveRules: {
    mobile: string;
    tablet?: string;
    desktop: string;
  };
}

export interface DesignState {
  version: number;
  designSystemName: string;
  designTokens: {
    colors: Record<string, string>;
    typography: Record<string, string>;
    spacing: Record<string, string>;
    radii: Record<string, string>;
  };
  userJourneys: Array<{
    id: string;
    title: string;
    steps: string[];
  }>;
  components: ComponentSpecification[];
  cssVariablesManifest?: string;
}

export interface FileChangeRecord {
  path: string;
  changeType: 'CREATE' | 'MODIFY' | 'DELETE';
  content: string;
  language: string;
  version: number;
  updatedAt: string;
}

export interface ImplementationState {
  version: number;
  files: Record<string, FileChangeRecord>;
  completedTodos: string[];
  pendingTodos: string[];
  fileCount: number;
  lastChangedFiles: string[];
}

export interface DefectItem {
  id: string;
  title: string;
  severity: DefectSeverity;
  expectedBehavior: string;
  actualBehavior: string;
  affectedArea: string;
  evidence: string;
  rootCauseHypothesis: string;
  recommendedOwner: DefectRootCauseOwner;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
}

export interface VerificationEvidence {
  typeCheckPassed: boolean;
  typeCheckErrors?: string[];
  lintPassed: boolean;
  lintErrors?: string[];
  buildPassed: boolean;
  buildErrors?: string[];
  testsPassed: boolean;
  testsRun: number;
  testsFailed: number;
  testDetails?: Array<{ name: string; passed: boolean; error?: string }>;
  requirementCoveragePercentage: number;
  uncoveredRequirements?: string[];
}

export interface QAState {
  version: number;
  passed: boolean;
  overallScore: number;
  evidence: VerificationEvidence;
  defects: DefectItem[];
  recommendation: 'PROCEED_TO_DEPLOY' | 'REWORK_IMPLEMENTATION' | 'REWORK_ARCHITECTURE' | 'REWORK_REQUIREMENTS' | 'REWORK_DESIGN';
}

export interface OrchestrationTask {
  id: string;
  title: string;
  description: string;
  assignedAgent: DefectRootCauseOwner;
  priority: TaskPriority;
  status: TaskStatus;
  dependencies: string[];
  inputArtifactIds: string[];
  outputArtifactId?: string;
  attemptCount: number;
  maxAttempts: number;
  requiresApproval?: boolean;
  approvalReason?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface BudgetTracking {
  maxTokensAllowed: number;
  totalTokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  maxCostUsd: number;
  totalCostUsd: number;
  modelInvocations: number;
}

export interface ProjectCheckpoint {
  id: string;
  checkpointNumber: number;
  stage: ProjectLifecycleStatus;
  timestamp: string;
  stateSnapshotJson: string;
  description: string;
}

export interface ProjectState {
  projectId: string;
  projectName: string;
  mission: string;
  status: ProjectLifecycleStatus;
  currentStage: ProjectLifecycleStatus;
  activeTaskId?: string;
  version: number;
  
  product: ProductScope;
  requirements: RequirementsState;
  architecture: ArchitectureState;
  design: DesignState;
  implementation: ImplementationState;
  qa: QAState;
  
  tasks: OrchestrationTask[];
  decisions: ArchitectureDecision[];
  checkpoints: ProjectCheckpoint[];
  budget: BudgetTracking;
  
  createdAt: string;
  updatedAt: string;
}
