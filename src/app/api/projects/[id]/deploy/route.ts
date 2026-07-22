import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import {
  createDeployment,
  executeDeployment,
} from '@/features/deployment/services/deployment.service';

const schema = z.object({
  provider: z.string().optional().default('vercel'),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id: projectId } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const provider = parsed.success ? parsed.data.provider : 'vercel';

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
    provider,
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
