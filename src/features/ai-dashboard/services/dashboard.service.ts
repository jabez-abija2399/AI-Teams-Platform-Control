import { getAgentSummaries } from '@/ai/agents/manager/agent.manager';
import { getAllWorkflowHealth } from '@/ai/monitoring/workflow.monitor';
import { getAllAgentHealth } from '@/ai/monitoring/agent.monitor';

export function getDashboardStats() {
  const agents = getAgentSummaries();
  const workflows = getAllWorkflowHealth();
  const agentHealth = getAllAgentHealth();

  return {
    totalAgents: agents.length,
    activeAgents: agents.filter((a) => a.status === 'WORKING').length,
    idleAgents: agents.filter((a) => a.status === 'IDLE').length,
    totalWorkflows: workflows.length,
    runningWorkflows: workflows.filter((w) => w.status === 'RUNNING').length,
    completedWorkflows: workflows.filter((w) => w.status === 'COMPLETED').length,
    failedWorkflows: workflows.filter((w) => w.status === 'FAILED').length,
    agentHealth,
  };
}
