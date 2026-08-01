import type { CompanyRole } from '../workforce/types';

// ─── Model Provider Types ───

export type AIProviderName = 'OPENAI' | 'ANTHROPIC' | 'LOCAL_MODEL';

export interface AIModelConfig {
  provider: AIProviderName;
  model: string;
  maxTokens: number;
  temperature: number;
  costPerInputToken: number;
  costPerOutputToken: number;
}

export interface AIModelResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  finishReason: 'stop' | 'length' | 'tool_use' | 'error';
}

// ─── Execution Lifecycle Types ───

export type AgentExecutionStatus =
  | 'queued'
  | 'preparing'
  | 'generating'
  | 'tool_execution'
  | 'reviewing'
  | 'completed'
  | 'failed';

export interface AgentExecutionRecord {
  id: string;
  projectId?: string;
  agentRole: CompanyRole;
  taskId: string;
  model: string;
  status: AgentExecutionStatus;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  result?: unknown;
  errorMessage?: string;
  createdAt: string;
}

export interface ExecutionRequest {
  projectId?: string;
  agentRole: CompanyRole;
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  systemPrompt: string;
  tools?: string[];
}

export interface ExecutionResult {
  executionId: string;
  status: AgentExecutionStatus;
  content: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  toolResults: ToolExecutionResult[];
}

// ─── Tool Types ───

export type ToolName =
  | 'FILE_READ'
  | 'FILE_WRITE'
  | 'CODE_SEARCH'
  | 'TERMINAL_EXECUTE'
  | 'DATABASE_QUERY'
  | 'TEST_RUNNER'
  | 'GIT_OPERATION';

export interface ToolDefinition {
  name: ToolName;
  description: string;
  allowedRoles: CompanyRole[];
}

export interface ToolExecutionResult {
  toolName: ToolName;
  input: unknown;
  output: unknown;
  status: 'success' | 'failed' | 'denied';
  error?: string;
}

// ─── Token & Cost Types ───

export interface TokenUsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  executionCount: number;
}
