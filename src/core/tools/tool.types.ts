import type { CompanyRole } from '../workforce/types';

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

export interface ToolInput {
  toolName: ToolName;
  params: Record<string, unknown>;
}

export interface ToolOutput {
  toolName: ToolName;
  status: 'success' | 'failed' | 'denied';
  result: unknown;
  error?: string;
}
