import type { IAgent } from '../agents/core/agent.interface';

export interface AgentHealth {
  agentId: string;
  name: string;
  role: string;
  status: string;
  currentTaskId: string | null;
  lastHeartbeat: Date;
  errorCount: number;
}

const healthStore = new Map<string, AgentHealth>();

export function registerAgentHealth(agent: IAgent): void {
  const details = agent.getStatusDetails();
  healthStore.set(details.id, {
    agentId: details.id,
    name: details.name,
    role: details.role,
    status: details.status,
    currentTaskId: details.currentTaskId,
    lastHeartbeat: new Date(),
    errorCount: 0,
  });
}

export function updateAgentHealth(
  agentId: string,
  updates: Partial<Pick<AgentHealth, 'status' | 'currentTaskId' | 'errorCount'>>,
): void {
  const health = healthStore.get(agentId);
  if (!health) return;

  Object.assign(health, updates, { lastHeartbeat: new Date() });
}

export function getAgentHealth(agentId: string): AgentHealth | undefined {
  return healthStore.get(agentId);
}

export function getAllAgentHealth(): AgentHealth[] {
  return Array.from(healthStore.values());
}

export function getUnhealthyAgents(thresholdMs = 60_000): AgentHealth[] {
  const now = Date.now();
  return Array.from(healthStore.values()).filter(
    (h) => now - h.lastHeartbeat.getTime() > thresholdMs,
  );
}
