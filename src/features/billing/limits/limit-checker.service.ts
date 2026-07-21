import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';

interface UsageLimitResult {
  withinLimits: boolean;
  planName: string;
  usageThisMonth: number;
  limit: number;
  usagePercent: number;
}

export async function checkUsageLimit(
  organizationId: string,
): Promise<ApiResult<UsageLimitResult>> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });

  if (!subscription || !subscription.plan) {
    return {
      success: true,
      data: {
        withinLimits: true,
        planName: 'FREE',
        usageThisMonth: 0,
        limit: 0,
        usagePercent: 0,
      },
    };
  }

  const limits = subscription.plan.limits as Record<string, unknown>;
  const usageLimit = typeof limits.usageLimit === 'number' ? limits.usageLimit : 0;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const usage = await prisma.aIUsageLog.aggregate({
    where: {
      createdAt: { gte: startOfMonth },
      project: {
        teamProjects: {
          some: {
            team: { organizationId },
          },
        },
      },
    },
    _sum: { costUsd: true },
  });

  const usageThisMonth = usage._sum.costUsd ?? 0;
  const usagePercent = usageLimit > 0 ? (usageThisMonth / usageLimit) * 100 : 0;

  return {
    success: true,
    data: {
      withinLimits: usageLimit === 0 || usageThisMonth < usageLimit,
      planName: subscription.plan.name,
      usageThisMonth,
      limit: usageLimit,
      usagePercent,
    },
  };
}
