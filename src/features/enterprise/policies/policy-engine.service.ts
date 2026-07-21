import type { ApiResult } from '@/types/common.types';

interface PolicyCheckResult {
  allowed: boolean;
  reason: string;
}

export async function checkAIUsagePolicy(
  organizationId: string,
  projectId: string,
): Promise<ApiResult<PolicyCheckResult>> {
  const { prisma } = await import('@/lib/prisma');

  const policy = await prisma.policy.findFirst({
    where: {
      organizationId,
      type: 'AI_USAGE_LIMIT',
      enabled: true,
    },
  });

  if (!policy) {
    return {
      success: true,
      data: { allowed: true, reason: 'No AI usage limit policy configured' },
    };
  }

  const config = policy.configuration as {
    maxTokensPerProject?: number;
    maxTokensPerMonth?: number;
    blockedModels?: string[];
  };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const usage = await prisma.aIUsageLog.aggregate({
    where: {
      projectId,
      createdAt: { gte: startOfMonth },
    },
    _sum: { totalTokens: true },
  });

  const totalTokens = usage._sum.totalTokens ?? 0;

  if (config.maxTokensPerProject && totalTokens >= config.maxTokensPerProject) {
    return {
      success: true,
      data: {
        allowed: false,
        reason: `Project token limit reached: ${totalTokens}/${config.maxTokensPerProject} tokens used this month`,
      },
    };
  }

  if (config.maxTokensPerMonth) {
    const orgUsage = await prisma.aIUsageLog.aggregate({
      where: {
        project: { owner: { organizations: { some: { organizationId } } } },
        createdAt: { gte: startOfMonth },
      },
      _sum: { totalTokens: true },
    });

    const orgTotalTokens = orgUsage._sum.totalTokens ?? 0;
    if (orgTotalTokens >= config.maxTokensPerMonth) {
      return {
        success: true,
        data: {
          allowed: false,
          reason: `Organization token limit reached: ${orgTotalTokens}/${config.maxTokensPerMonth} tokens used this month`,
        },
      };
    }
  }

  return {
    success: true,
    data: { allowed: true, reason: 'AI usage within policy limits' },
  };
}

export async function checkDeploymentPolicy(
  organizationId: string,
  environment: string,
): Promise<ApiResult<PolicyCheckResult>> {
  const { prisma } = await import('@/lib/prisma');

  const policy = await prisma.policy.findFirst({
    where: {
      organizationId,
      type: 'DEPLOYMENT_RESTRICTION',
      enabled: true,
    },
  });

  if (!policy) {
    return {
      success: true,
      data: { allowed: true, reason: 'No deployment restriction policy configured' },
    };
  }

  const config = policy.configuration as {
    blockedEnvironments?: string[];
    allowedEnvironments?: string[];
    requireApproval?: boolean;
  };

  if (config.blockedEnvironments?.includes(environment)) {
    return {
      success: true,
      data: {
        allowed: false,
        reason: `Deployment to "${environment}" is blocked by organization policy`,
      },
    };
  }

  if (
    config.allowedEnvironments &&
    config.allowedEnvironments.length > 0 &&
    !config.allowedEnvironments.includes(environment)
  ) {
    return {
      success: true,
      data: {
        allowed: false,
        reason: `Deployment to "${environment}" is not in the allowed environments list: ${config.allowedEnvironments.join(', ')}`,
      },
    };
  }

  return {
    success: true,
    data: {
      allowed: true,
      reason: config.requireApproval
        ? 'Deployment allowed but requires approval'
        : 'Deployment allowed by policy',
    },
  };
}
