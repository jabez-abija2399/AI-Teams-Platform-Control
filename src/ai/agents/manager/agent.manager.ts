import type { IAgent } from '../core/agent.interface';
import type { AgentRole, AgentStatus } from '../core/agent.types';
import { createAgent, getAvailableRoles } from './agent.registry';

const agents = new Map<string, IAgent>();

export interface AgentSummary {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
}

export function createAgentInstance(role: AgentRole, name?: string): IAgent {
  const agent = createAgent(role, name);
  agents.set(agent.id, agent);
  return agent;
}

export function getAgent(id: string): IAgent | undefined {
  return agents.get(id);
}

export function getAgentsByRole(role: AgentRole): IAgent[] {
  return Array.from(agents.values()).filter((a) => a.role === role);
}

export function getAllAgents(): IAgent[] {
  return Array.from(agents.values());
}

export function getAgentSummaries(): AgentSummary[] {
  return getAllAgents().map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    status: a.getStatus(),
  }));
}

export function getAvailableAgentRoles(): AgentRole[] {
  return getAvailableRoles();
}

export function resetAllAgents(): void {
  for (const agent of agents.values()) {
    agent.reset();
  }
}
