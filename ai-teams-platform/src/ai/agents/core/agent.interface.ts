import type { AgentRole, AgentStatus, AgentCapability, AgentExecutionResult } from './agent.types';

export interface IAgent {
  readonly id: string;
  readonly role: AgentRole;
  name: string;
  status: AgentStatus;
  capabilities: AgentCapability[];

  execute(task: string, context?: Record<string, unknown>): Promise<AgentExecutionResult>;
  getStatus(): AgentStatus;
  getStatusDetails(): {
    id: string;
    name: string;
    role: AgentRole;
    status: AgentStatus;
    capabilities: AgentCapability[];
    currentTaskId: string | null;
  };
  pause(): void;
  resume(): void;
  reset(): void;
}
