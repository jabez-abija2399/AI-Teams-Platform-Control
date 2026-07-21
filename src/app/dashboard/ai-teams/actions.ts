'use server';

import { getAgentSummaries } from '@/ai/agents/manager/agent.manager';
import type { AgentRole, AgentStatus } from '@/ai/agents/core/agent.types';

export interface AgentSummaryData {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
}

export async function fetchAgentSummaries(): Promise<AgentSummaryData[]> {
  return getAgentSummaries();
}
