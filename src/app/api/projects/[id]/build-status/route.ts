import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { PipelineState } from '@/features/workspace/pipeline/types/pipeline.types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {

  const { id: projectId } = await params;

  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json(
      { success: false, error: { message: 'Project not found', code: 'NOT_FOUND' } },
      { status: 404 },
    );
  }

  const inProgressDoc = await prisma.document.findFirst({
    where: { projectId, type: 'BUILD_IN_PROGRESS' },
    orderBy: { createdAt: 'desc' },
  });

  let pipeline: PipelineState | null = null;
  if (inProgressDoc) {
    try {
      const parsed = JSON.parse(inProgressDoc.content);
      if (parsed.steps && Array.isArray(parsed.steps)) {
        pipeline = parsed as PipelineState;
      }
    } catch {
      // malformed document — ignore
    }
  }

  const hasDeployment = await prisma.deployment.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    success: true,
    data: {
      projectStatus: project.status,
      running: !!inProgressDoc,
      pipeline,
      hasDeployment: !!hasDeployment,
      deploymentStatus: hasDeployment?.status ?? null,
    },
  });
}
