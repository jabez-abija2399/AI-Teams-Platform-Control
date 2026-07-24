import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import {
  createDeployment,
  executeDeployment,
} from '@/features/deployment/services/deployment.service';
import { triggerProductionDeploy } from '@/lib/deployments/deployment-service';

const deploySchema = z.object({
  provider: z.string().optional().default('vercel'),
  token: z.string().optional(),
  projectName: z.string().optional(),
  teamId: z.string().optional(),
  envVars: z.record(z.string(), z.string()).optional().default({}),
  files: z.record(z.string(), z.string()).optional().default({}),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id: projectId } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = deploySchema.safeParse(body);
  const data = parsed.success ? parsed.data : { provider: 'vercel', envVars: {}, files: {} };
  const providerUpper = data.provider.toUpperCase();

  // If token is provided or provider is Cloud provider, use triggerProductionDeploy
  if (data.token && (providerUpper === 'VERCEL' || providerUpper === 'NETLIFY' || providerUpper === 'CLOUDFLARE')) {
    const result = await triggerProductionDeploy({
      projectId,
      projectName: data.projectName || `project-${projectId}`,
      provider: providerUpper as any,
      token: data.token,
      teamId: data.teamId,
      envVars: data.envVars || {},
      files: data.files || {},
    });

    return NextResponse.json({
      success: result.status !== 'ERROR',
      data: result,
    });
  }

  // Standard deployment workflow
  let environments = await prisma.environment.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });

  if (environments.length === 0) {
    const defaultEnv = await prisma.environment.create({
      data: { projectId, name: 'Production', variables: {} },
    });
    environments = [defaultEnv];
  }

  const targetEnvironment = environments[0]!;

  const deployResult = await createDeployment({
    projectId,
    environmentId: targetEnvironment.id,
    provider: data.provider,
    steps: [
      { name: 'Install dependencies' },
      { name: 'Build project' },
      { name: 'Run tests' },
      { name: 'Deploy to production' },
    ],
  });

  if (!deployResult.success) {
    return NextResponse.json(deployResult, { status: 400 });
  }

  const executionResult = await executeDeployment(deployResult.data.id);
  if (!executionResult.success) {
    return NextResponse.json(executionResult, { status: 500 });
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { status: 'COMPLETED' },
  });

  return NextResponse.json({
    success: true,
    data: {
      deployment: executionResult.data,
      environment: targetEnvironment.name,
    },
  });
}
