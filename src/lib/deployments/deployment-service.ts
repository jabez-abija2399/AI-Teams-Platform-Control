import { DeploymentConfig, DeploymentResult } from './types';
import { vercelProvider } from './providers/vercel';
import { netlifyProvider } from './providers/netlify';
import { cloudflareProvider } from './providers/cloudflare';
import { prisma } from '@/lib/prisma';

/**
 * Triggers a production deployment using the specified cloud provider (Vercel, Netlify, Cloudflare Pages).
 */
export async function triggerProductionDeploy(config: DeploymentConfig): Promise<DeploymentResult> {
  let result: DeploymentResult;

  switch (config.provider) {
    case 'VERCEL':
      result = await vercelProvider.deploy(config);
      break;
    case 'NETLIFY':
      result = await netlifyProvider.deploy(config);
      break;
    case 'CLOUDFLARE':
      result = await cloudflareProvider.deploy(config);
      break;
    default:
      throw new Error(`Unsupported deployment provider: ${config.provider}`);
  }

  // Record deployment in database if project exists
  try {
    const project = await prisma.project.findUnique({
      where: { id: config.projectId },
      include: { environments: true },
    });

    if (project) {
      let envId = project.environments[0]?.id;
      if (!envId) {
        const env = await prisma.environment.create({
          data: {
            projectId: config.projectId,
            name: 'Production',
            variables: config.envVars as any,
          },
        });
        envId = env.id;
      }

      await prisma.deployment.create({
        data: {
          projectId: config.projectId,
          environmentId: envId,
          provider: config.provider,
          status: result.status,
        },
      });
    }
  } catch (err) {
    console.warn('[Deployment Service] DB persistence warning:', err);
  }

  return result;
}
