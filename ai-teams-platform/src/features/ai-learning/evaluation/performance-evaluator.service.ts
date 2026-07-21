import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';

interface PerformanceResult {
  id: string;
  agentId: string;
  taskType: string;
  score: number;
  metrics: Record<string, unknown>;
}

export async function evaluateTaskExecution(
  agentId: string,
  taskType: string,
  success: boolean,
  durationMs: number,
  tokensUsed: number,
  retries: number,
): Promise<ApiResult<PerformanceResult>> {
  let score = 50;

  if (success) {
    score += 30;
  } else {
    score -= 20;
  }

  if (durationMs < 5000) {
    score += 10;
  } else if (durationMs < 30000) {
    score += 5;
  } else if (durationMs > 120000) {
    score -= 10;
  }

  if (tokensUsed < 1000) {
    score += 5;
  } else if (tokensUsed > 10000) {
    score -= 5;
  }

  score -= retries * 5;

  score = Math.max(0, Math.min(100, score));

  const record = await prisma.agentPerformance.create({
    data: {
      agentId,
      taskType,
      score,
      metrics: {
        success,
        durationMs,
        tokensUsed,
        retries,
        evaluatedAt: new Date().toISOString(),
      },
    },
  });

  return {
    success: true,
    data: {
      id: record.id,
      agentId: record.agentId,
      taskType: record.taskType,
      score: record.score,
      metrics: record.metrics as Record<string, unknown>,
    },
  };
}

export async function getAgentAverageScore(
  agentId: string,
  taskType?: string,
): Promise<ApiResult<{ average: number; count: number }>> {
  const where = {
    agentId,
    ...(taskType ? { taskType } : {}),
  };

  const result = await prisma.agentPerformance.aggregate({
    where,
    _avg: { score: true },
    _count: { score: true },
  });

  return {
    success: true,
    data: {
      average: result._avg.score ?? 0,
      count: result._count.score,
    },
  };
}
