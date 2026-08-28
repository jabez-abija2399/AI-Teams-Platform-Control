'use server';

import { getAgentSummaries } from '@/packages/agents/manager/agent.manager';
import type { AgentRole, AgentStatus } from '@/packages/agents/core/agent.types';

export interface AgentSummaryData {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
}

export async function fetchAgentSummaries(): Promise<AgentSummaryData[]> {
  return getAgentSummaries();
}
