import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type { AgentDecisionEntry } from '../types';
import { recordDecisionSchema, type RecordDecisionInput } from '../schemas/documentation.schema';

function toAgentDecisionEntry(decision: {
  id: string;
  agentId: string;
  decision: string;
  reasoning: string;
  outcome: string;
  confidence: number;
  createdAt: Date;
}): AgentDecisionEntry {
  return {
    id: decision.id,
    agentId: decision.agentId,
    decision: decision.decision,
    reasoning: decision.reasoning,
    outcome: decision.outcome,
    confidence: decision.confidence,
    createdAt: decision.createdAt,
  };
}

export async function recordDecision(
  input: RecordDecisionInput,
): Promise<ApiResult<AgentDecisionEntry>> {
  const parsed = recordDecisionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid decision data',
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const decision = await prisma.agentDecision.create({
    data: {
      agentId: parsed.data.agentId,
      decision: parsed.data.decision,
      reasoning: parsed.data.reasoning,
      outcome: parsed.data.outcome,
      confidence: parsed.data.confidence,
    },
  });

  return { success: true, data: toAgentDecisionEntry(decision) };
}

export async function listDecisions(
  agentId?: string,
  limit = 50,
): Promise<ApiResult<AgentDecisionEntry[]>> {
  const where: Record<string, unknown> = {};
  if (agentId) where.agentId = agentId;

  const decisions = await prisma.agentDecision.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return { success: true, data: decisions.map(toAgentDecisionEntry) };
}
