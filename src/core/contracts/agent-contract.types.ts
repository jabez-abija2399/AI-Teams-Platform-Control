/**
 * Agent Contracts & Capability Registry Types
 * 
 * Strict specifications for the 5 core AI agents: PM, Architect, Designer, Developer, QA.
 */

export type CoreAgentRole = 'PM' | 'ARCHITECT' | 'DESIGNER' | 'DEVELOPER' | 'QA';

export type ToolPermission =
  | 'FILE_READ'
  | 'FILE_WRITE'
  | 'CODE_SEARCH'
  | 'TERMINAL_EXECUTE'
  | 'TYPE_CHECK'
  | 'LINT_RUNNER'
  | 'TEST_RUNNER'
  | 'BUILD_RUNNER'
  | 'DATABASE_QUERY'
  | 'GIT_OPERATION';

export interface AgentContract {
  role: CoreAgentRole;
  title: string;
  department: string;
  mission: string;
  questionAnswered: string;
  responsibilities: string[];
  authority: string[];
  allowedActions: string[];
  forbiddenActions: string[];
  availableTools: ToolPermission[];
  inputArtifactTypes: string[];
  outputArtifactType: string;
  validationRules: string[];
  failureBehavior: string;
  retryBehavior: string;
}

export interface AgentCapabilityProfile {
  role: CoreAgentRole;
  skills: string[];
  experienceLevel: 'Staff' | 'Principal' | 'Lead';
  personality: string;
  modelTier: 'REASONING' | 'CODING' | 'FAST';
}
