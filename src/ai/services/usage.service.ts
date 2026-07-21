import type { AIProviderName, AIUsage } from '../gateway/ai.types';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export async function logUsage(
  response: { provider: string; model: string; usage: AIUsage },
  agentId?: string,
  projectId?: string,
): Promise<void> {
  try {
    const prisma = await getPrisma();
    await prisma.aIUsageLog.create({
      data: {
        provider: response.provider,
        model: response.model,
        agentId,
        projectId,
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
        costUsd: response.usage.estimatedCostUsd ?? 0,
      },
    });
  } catch {
    // Non-critical — usage logging failure should not break AI calls
  }
}

export async function getUsageStats(filter?: {
  provider?: AIProviderName;
  projectId?: string;
  agentId?: string;
  since?: Date;
}): Promise<{
  totalTokens: number;
  totalCostUsd: number;
  byProvider: Record<string, { tokens: number; cost: number; requests: number }>;
}> {
  const prisma = await getPrisma();
  const where: Record<string, unknown> = {};
  if (filter?.projectId) where.projectId = filter.projectId;
  if (filter?.agentId) where.agentId = filter.agentId;
  if (filter?.provider) where.provider = filter.provider;
  if (filter?.since) where.createdAt = { gte: filter.since };

  const logs = await prisma.aIUsageLog.findMany({ where });

  const byProvider: Record<string, { tokens: number; cost: number; requests: number }> = {};
  let totalTokens = 0;
  let totalCostUsd = 0;

  for (const log of logs) {
    totalTokens += log.totalTokens;
    totalCostUsd += log.costUsd;
    const entry = byProvider[log.provider] ?? { tokens: 0, cost: 0, requests: 0 };
    entry.tokens += log.totalTokens;
    entry.cost += log.costUsd;
    entry.requests += 1;
    byProvider[log.provider] = entry;
  }

  return { totalTokens, totalCostUsd, byProvider };
}

export async function getCostBreakdown(projectId: string) {
  const prisma = await getPrisma();
  const logs = await prisma.aIUsageLog.findMany({ where: { projectId } });

  const byProvider: Record<string, { tokens: number; cost: number; requests: number }> = {};
  let totalCost = 0;
  let totalTokens = 0;

  for (const log of logs) {
    totalCost += log.costUsd;
    totalTokens += log.totalTokens;
    const entry = byProvider[log.provider] ?? { tokens: 0, cost: 0, requests: 0 };
    entry.tokens += log.totalTokens;
    entry.cost += log.costUsd;
    entry.requests += 1;
    byProvider[log.provider] = entry;
  }

  return { totalCost, totalTokens, byProvider };
}
