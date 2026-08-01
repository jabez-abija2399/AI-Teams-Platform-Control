import type { AgentRole } from '../agents/core/agent.types';

export interface AgentQualityScore {
  architectureQuality: number; // 0-100
  requirementUnderstanding: number; // 0-100
  codeQuality: number; // 0-100
  securityAwareness: number; // 0-100
  testingQuality: number; // 0-100
  communicationQuality: number; // 0-100
  overallScore: number; // 0-100
}

export interface EvaluationMetricRecord {
  id?: string;
  projectId: string;
  agentId: AgentRole;
  workflowId?: string;
  executionTimeMs: number;
  tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number };
  success: boolean;
  retryCount: number;
  qualityScore?: AgentQualityScore;
  failureReason?: string;
  timestamp: Date;
}

export interface ScenarioStepExpectation {
  stepId: string;
  expectedAgent: AgentRole;
  requiredOutputKeys?: string[];
  forbiddenActions?: string[];
}

export interface EvaluationScenario {
  id: string;
  name: string;
  description: string;
  input: string;
  expectedWorkflow: string;
  expectedAgents: AgentRole[];
  steps: ScenarioStepExpectation[];
  validationCriteria: {
    checkCorrectAgentSelection: boolean;
    checkNoUnnecessaryAgents: boolean;
    checkSecurityBoundaries: boolean;
    checkSelfCorrection?: boolean;
  };
}

export interface ScenarioExecutionResult {
  scenarioId: string;
  success: boolean;
  workflowSelected: string;
  agentsExecuted: AgentRole[];
  qualityScores: Record<string, AgentQualityScore>;
  averageQualityScore: number;
  retriesTriggered: number;
  errorsDetected: string[];
  executionTimeMs: number;
}

export interface AgentAnalyticsSummary {
  agentId: AgentRole;
  tasksCompleted: number;
  averageQualityScore: number;
  failureCount: number;
  retryCount: number;
  averageExecutionTimeMs: number;
  commonMistakes: string[];
}
