import { prisma } from '@/lib/prisma';

interface CostRecommendation {
  type: string;
  description: string;
  estimatedSaving: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export async function getCostRecommendations(
  projectId?: string,
): Promise<CostRecommendation[]> {
  const recommendations: CostRecommendation[] = [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const usageLogs = await prisma.aIUsageLog.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      ...(projectId ? { projectId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  if (usageLogs.length === 0) {
    return recommendations;
  }

  const totalCost = usageLogs.reduce((sum, log) => sum + log.costUsd, 0);

  const totalTokens = usageLogs.reduce((sum, log) => sum + log.totalTokens, 0);
  const avgTokensPerRequest = totalTokens / usageLogs.length;

  if (avgTokensPerRequest > 2000) {
    const estimatedSaving = totalCost * 0.15;
    recommendations.push({
      type: 'TOKEN_OPTIMIZATION',
      description: 'Average token usage is high. Consider shorter prompts or response constraints to reduce costs.',
      estimatedSaving,
      priority: 'HIGH',
    });
  }

  const providerCosts = new Map<string, number>();
  for (const log of usageLogs) {
    const current = providerCosts.get(log.provider) ?? 0;
    providerCosts.set(log.provider, current + log.costUsd);
  }

  if (providerCosts.size > 1) {
    let cheapestProvider = '';
    let cheapestCost = Infinity;
    for (const [provider, cost] of providerCosts) {
      const requestCount = usageLogs.filter((l) => l.provider === provider).length;
      const avgCost = cost / requestCount;
      if (avgCost < cheapestCost) {
        cheapestCost = avgCost;
        cheapestProvider = provider;
      }
    }
    const expensiveCost = Math.max(...Array.from(providerCosts.values()));
    if (expensiveCost > cheapestCost * 1.5) {
      recommendations.push({
        type: 'PROVIDER_SWITCH',
        description: `Consider routing more requests to ${cheapestProvider} which has lower average cost per request.`,
        estimatedSaving: (expensiveCost - cheapestCost) * 0.3,
        priority: 'MEDIUM',
      });
    }
  }

  const dailyCosts = new Map<string, number>();
  for (const log of usageLogs) {
    const day = log.createdAt.toISOString().slice(0, 10);
    dailyCosts.set(day, (dailyCosts.get(day) ?? 0) + log.costUsd);
  }

  const costValues = Array.from(dailyCosts.values());
  const maxDailyCost = Math.max(...costValues);
  const avgDailyCost = costValues.reduce((a, b) => a + b, 0) / costValues.length;

  if (maxDailyCost > avgDailyCost * 2) {
    recommendations.push({
      type: 'BUDGET_ALERT',
      description: 'Usage spikes detected. Consider setting daily budget alerts to avoid unexpected costs.',
      estimatedSaving: maxDailyCost - avgDailyCost,
      priority: 'MEDIUM',
    });
  }

  const slowRequests = usageLogs.filter((log) => (log.latencyMs ?? 0) > 10000);
  if (slowRequests.length > usageLogs.length * 0.1) {
    recommendations.push({
      type: 'LATENCY_OPTIMIZATION',
      description: `${slowRequests.length} requests had high latency. Consider using faster models for time-sensitive tasks.`,
      estimatedSaving: totalCost * 0.05,
      priority: 'LOW',
    });
  }

  return recommendations;
}

export async function generateCostRecommendations(
  projectId?: string,
): Promise<CostRecommendation[]> {
  return getCostRecommendations(projectId);
}
