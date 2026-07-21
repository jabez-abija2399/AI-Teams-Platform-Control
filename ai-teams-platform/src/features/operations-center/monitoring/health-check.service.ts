import { prisma } from '@/lib/prisma';
import { getAIConfig } from '@/ai/config/ai.config';

export interface HealthCheckResult {
  service: string;
  status: 'UP' | 'DOWN' | 'DEGRADED';
  latencyMs: number;
  message: string;
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      service: 'database',
      status: 'UP',
      latencyMs: Date.now() - start,
      message: 'Database connection healthy',
    };
  } catch (err) {
    return {
      service: 'database',
      status: 'DOWN',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Database connection failed',
    };
  }
}

async function checkAIGateway(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const config = getAIConfig();
    const enabledProviders = Object.entries(config.providers).filter(
      ([, p]) => p?.enabled,
    );

    if (enabledProviders.length === 0) {
      return {
        service: 'ai-gateway',
        status: 'DOWN',
        latencyMs: Date.now() - start,
        message: 'No AI providers are configured or enabled',
      };
    }

    return {
      service: 'ai-gateway',
      status: 'UP',
      latencyMs: Date.now() - start,
      message: `${enabledProviders.length} provider(s) enabled: ${enabledProviders.map(([k]) => k).join(', ')}`,
    };
  } catch (err) {
    return {
      service: 'ai-gateway',
      status: 'DOWN',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'AI gateway check failed',
    };
  }
}

async function checkDeploymentService(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const recentFailureCount = await prisma.deployment.count({
      where: {
        status: 'FAILED',
        updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    const recentTotal = await prisma.deployment.count({
      where: {
        updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    const failureRate = recentTotal > 0 ? recentFailureCount / recentTotal : 0;

    if (failureRate > 0.5 && recentTotal > 2) {
      return {
        service: 'deployment',
        status: 'DEGRADED',
        latencyMs: Date.now() - start,
        message: `High failure rate: ${recentFailureCount}/${recentTotal} deployments failed in the last 24h`,
      };
    }

    return {
      service: 'deployment',
      status: 'UP',
      latencyMs: Date.now() - start,
      message: `${recentTotal} deployment(s) in the last 24h, ${recentFailureCount} failure(s)`,
    };
  } catch (err) {
    return {
      service: 'deployment',
      status: 'DOWN',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Deployment service check failed',
    };
  }
}

export async function runHealthChecks(): Promise<HealthCheckResult[]> {
  const results = await Promise.all([
    checkDatabase(),
    checkAIGateway(),
    checkDeploymentService(),
  ]);

  for (const result of results) {
    await prisma.systemHealth.create({
      data: {
        service: result.service,
        status: result.status,
        latencyMs: result.latencyMs,
        message: result.message,
      },
    });
  }

  return results;
}
