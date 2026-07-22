import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unauthorizedResponse } from '@/lib/api-response';

const schema = z.object({ projectId: z.string() });

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json(
      { success: false, error: { message: 'projectId required', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json(
      { success: false, error: { message: 'Project not found', code: 'NOT_FOUND' } },
      { status: 404 },
    );
  }

  const inProgressDoc = await prisma.document.findFirst({
    where: {
      projectId,
      type: 'BUILD_IN_PROGRESS',
    },
  });

  const hasDeployment = await prisma.deployment.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    success: true,
    data: {
      projectStatus: project.status,
      running: !!inProgressDoc,
      hasDeployment: !!hasDeployment,
      deploymentStatus: hasDeployment?.status ?? null,
    },
  });
}
