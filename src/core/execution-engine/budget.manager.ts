import { prisma } from '@/lib/prisma';
import type { AgentRole } from '@/ai/agents/core/agent.types';

export interface BudgetConfig {
  maxTokensPerTask: number;
  maxRetriesAllowed: number;
}

const DEFAULT_BUDGET_CONFIG: Record<AgentRole | 'DEFAULT', BudgetConfig> = {
  DEFAULT: { maxTokensPerTask: 8000, maxRetriesAllowed: 3 },
  CEO: { maxTokensPerTask: 16000, maxRetriesAllowed: 5 },
  ARCHITECT: { maxTokensPerTask: 16000, maxRetriesAllowed: 5 },
  FRONTEND: { maxTokensPerTask: 12000, maxRetriesAllowed: 4 },
  BACKEND: { maxTokensPerTask: 12000, maxRetriesAllowed: 4 },
  DATABASE: { maxTokensPerTask: 8000, maxRetriesAllowed: 3 },
  QA: { maxTokensPerTask: 4000, maxRetriesAllowed: 2 },
  DEVELOPER: { maxTokensPerTask: 8000, maxRetriesAllowed: 3 },
  PRODUCT_MANAGER: { maxTokensPerTask: 12000, maxRetriesAllowed: 4 },
  REVIEWER: { maxTokensPerTask: 6000, maxRetriesAllowed: 2 },
  ARCHITECTURE_REVIEWER: { maxTokensPerTask: 6000, maxRetriesAllowed: 2 },
  CODE_REVIEWER: { maxTokensPerTask: 6000, maxRetriesAllowed: 2 },
  QUALITY_REVIEWER: { maxTokensPerTask: 4000, maxRetriesAllowed: 2 },
  UI_UX: { maxTokensPerTask: 8000, maxRetriesAllowed: 3 },
  DEVOPS: { maxTokensPerTask: 8000, maxRetriesAllowed: 3 },
  DOCUMENTATION: { maxTokensPerTask: 6000, maxRetriesAllowed: 2 },
  SECURITY: { maxTokensPerTask: 6000, maxRetriesAllowed: 2 },
  PRODUCT_DISCOVERY: { maxTokensPerTask: 12000, maxRetriesAllowed: 4 },
  OPERATIONS: { maxTokensPerTask: 4000, maxRetriesAllowed: 2 },
  BUSINESS_ANALYST: { maxTokensPerTask: 12000, maxRetriesAllowed: 4 },
  UX_RESEARCHER: { maxTokensPerTask: 10000, maxRetriesAllowed: 3 },
  UI_DESIGNER: { maxTokensPerTask: 10000, maxRetriesAllowed: 3 },
};

export class AgentBudgetManager {
  
  public getBudgetForRole(role: AgentRole): BudgetConfig {
    return DEFAULT_BUDGET_CONFIG[role] ?? DEFAULT_BUDGET_CONFIG['DEFAULT'];
  }

  public async recordUsage(params: {
    taskId: string;
    agentRole: AgentRole;
    modelUsed: string;
    promptTokens: number;
    completionTokens: number;
    durationMs: number;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    await prisma.agentRun.create({
      data: {
        taskId: params.taskId,
        agentRole: params.agentRole,
        modelUsed: params.modelUsed,
        promptTokens: params.promptTokens,
        completionTokens: params.completionTokens,
        duration: params.durationMs,
        status: params.success ? 'SUCCESS' : 'FAILED',
        errorMessage: params.errorMessage,
      }
    });
  }

  public async checkBudget(taskId: string, role: AgentRole): Promise<{ allowed: boolean; reason?: string }> {
    const budget = this.getBudgetForRole(role);
    
    const runs = await prisma.agentRun.findMany({
      where: { taskId },
    });

    if (runs.length >= budget.maxRetriesAllowed) {
      return { allowed: false, reason: `Max retries (${budget.maxRetriesAllowed}) exceeded for ${role}` };
    }

    const totalTokens = runs.reduce((sum, run) => sum + run.promptTokens + run.completionTokens, 0);
    if (totalTokens >= budget.maxTokensPerTask) {
      return { allowed: false, reason: `Max token budget (${budget.maxTokensPerTask}) exceeded for task in ${role}` };
    }

    return { allowed: true };
  }
}

let instance: AgentBudgetManager | null = null;
export function getAgentBudgetManager(): AgentBudgetManager {
  if (!instance) {
    instance = new AgentBudgetManager();
  }
  return instance;
}
