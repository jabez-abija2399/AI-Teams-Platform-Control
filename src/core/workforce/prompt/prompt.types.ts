import type { CompanyRole } from '../types';
import type { AgentExecutionContext } from '../context/context.types';

export interface GeneratedAgentPrompt {
  id?: string;
  projectId?: string;
  agentRole: CompanyRole;
  taskId: string;
  systemPrompt: string;
  contextTokens: number;
  generatedAt: string;
}

export interface RolePromptTemplate {
  role: CompanyRole;
  identity: string;
  responsibilities: string[];
  rules: string[];
  qualityStandards: string[];
}
