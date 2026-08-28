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

import { ExecutionStateService } from '@/core/integration/execution-state.service';

export function getAgentSummaries(projectId?: string): AgentSummary[] {
  if (!projectId) return [];
  
  const state = ExecutionStateService.getState(projectId);
  const phase = state.currentPhase;
  const health = state.executionHealth;

  const isWorking = (agentRoles: string[]) => {
    if (health === 'PAUSED') return 'PAUSED';
    if (health === 'FAILED') return 'ERROR';
    if (phase === 'COMPLETED') return 'IDLE';
    
    return agentRoles.includes(phase) ? 'WORKING' : 'IDLE';
  };

  return [
    {
      id: `${projectId}_pm`,
      name: 'Sarah (PM)',
      role: 'PRODUCT_MANAGER',
      status: isWorking(['PLANNING']),
    },
    {
      id: `${projectId}_arch`,
      name: 'Marcus (Architect)',
      role: 'ARCHITECT',
      status: isWorking(['ARCHITECTURE', 'DEBATE']),
    },
    {
      id: `${projectId}_ux`,
      name: 'Elena (UI Designer)',
      role: 'UI_DESIGNER',
      status: isWorking(['DESIGN']),
    },
    {
      id: `${projectId}_dev`,
      name: 'Alex (Developer)',
      role: 'DEVELOPER',
      status: isWorking(['EXECUTION']),
    }
  ];
}
export function getAvailableAgentRoles(): AgentRole[] {
  return getAvailableRoles();
}

export function resetAllAgents(): void {
  for (const agent of agents.values()) {
    agent.reset();
  }
}
