import { z } from 'zod';

export const AgentRoleSchema = z.enum(['CEO', 'ARCHITECT', 'DEVELOPER', 'QA', 'UI_UX', 'DEVOPS', 'DOCUMENTATION', 'SECURITY', 'OPERATIONS']);
export type AgentRole = z.infer<typeof AgentRoleSchema>;

export const AgentStatusSchema = z.enum([
  'IDLE',
  'WORKING',
  'BLOCKED',
  'OFFLINE',
  'ERROR',
  'PAUSED',
]);
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

export const AgentCapabilitySchema = z.enum([
  'REQUIREMENTS_ANALYSIS',
  'SYSTEM_DESIGN',
  'CODE_GENERATION',
  'CODE_REVIEW',
  'TESTING',
  'BUG_FIXING',
  'DOCUMENTATION',
  'UI_DESIGN',
  'ARCHITECTURE',
  'DEVOPS',
  'PLANNING',
  'ANALYSIS',
  'CODING',
  'DEBUGGING',
  'IMPLEMENTATION',
  'OPTIMIZATION',
]);
export type AgentCapability = z.infer<typeof AgentCapabilitySchema>;

export interface AgentState {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  capabilities: AgentCapability[];
  currentTaskId: string | null;
  memory: AgentMemoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentMemoryEntry {
  id: string;
  agentId: string;
  content: string;
  type: 'episodic' | 'semantic' | 'procedural';
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface AgentExecutionResult {
  success: boolean;
  output: string;
  artifacts?: string[];
  memoryUpdates?: string[];
  nextAgentHint?: AgentRole;
}

export interface AgentTool {
  name: string;
  description: string;
  execute: (input: string) => Promise<string>;
}
