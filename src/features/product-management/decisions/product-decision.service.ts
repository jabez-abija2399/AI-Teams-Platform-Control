import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';

interface ProductDecisionData {
  id: string;
  projectId: string;
  title: string;
  reason: string;
  impact: string | null;
  createdAt: Date;
}

export async function recordProductDecision(
  projectId: string,
  title: string,
  reason: string,
  impact?: string,
): Promise<ApiResult<ProductDecisionData>> {
  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return { success: false, error: { message: 'Project not found', code: 'NOT_FOUND' } };
  }

  if (!title || title.trim().length === 0) {
    return { success: false, error: { message: 'Decision title is required', code: 'VALIDATION_ERROR' } };
  }

  if (!reason || reason.trim().length === 0) {
    return { success: false, error: { message: 'Decision reason is required', code: 'VALIDATION_ERROR' } };
  }

  const decision = await prisma.productDecision.create({
    data: {
      projectId,
      title: title.trim(),
      reason: reason.trim(),
      impact: impact?.trim() ?? null,
    },
  });

  return { success: true, data: decision };
}

export async function listProductDecisions(
  projectId: string,
): Promise<ApiResult<ProductDecisionData[]>> {
  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return { success: false, error: { message: 'Project not found', code: 'NOT_FOUND' } };
  }

  const decisions = await prisma.productDecision.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  return { success: true, data: decisions };
}
