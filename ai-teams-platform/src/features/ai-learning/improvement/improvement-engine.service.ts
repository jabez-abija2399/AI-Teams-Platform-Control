import { prisma } from '@/lib/prisma';
import { detectRecurringLessons } from '../services/pattern-detection.service';
import type { ApiResult } from '@/types/common.types';

interface ImprovementProposal {
  id: string;
  change: string;
  reason: string;
  status: string;
}

export async function generateImprovementProposals(
  agentId: string,
): Promise<ApiResult<ImprovementProposal[]>> {
  const recurring = await detectRecurringLessons(agentId);

  if (recurring.length === 0) {
    return { success: true, data: [] };
  }

  const proposals: ImprovementProposal[] = [];

  for (const lesson of recurring) {
    const existing = await prisma.improvement.findFirst({
      where: {
        agentId,
        reason: { contains: lesson.lesson },
        status: { in: ['PROPOSED', 'APPROVED', 'APPLIED'] },
      },
    });

    if (existing) continue;

    const improvement = await prisma.improvement.create({
      data: {
        agentId,
        change: `Address recurring issue: ${lesson.lesson}`,
        reason: `Occurred ${lesson.occurrences} times. First seen: ${lesson.firstSeen.toISOString()}. Last seen: ${lesson.lastSeen.toISOString()}.`,
        status: 'PROPOSED',
      },
    });

    proposals.push({
      id: improvement.id,
      change: improvement.change,
      reason: improvement.reason,
      status: improvement.status,
    });
  }

  return { success: true, data: proposals };
}

export async function approveImprovement(
  improvementId: string,
): Promise<ApiResult<{ id: string; status: string }>> {
  const improvement = await prisma.improvement.findUnique({ where: { id: improvementId } });

  if (!improvement) {
    return { success: false, error: { message: 'Improvement not found', code: 'NOT_FOUND' } };
  }

  if (improvement.status !== 'PROPOSED') {
    return {
      success: false,
      error: {
        message: `Cannot approve improvement in ${improvement.status} status`,
        code: 'VALIDATION_ERROR',
      },
    };
  }

  const updated = await prisma.improvement.update({
    where: { id: improvementId },
    data: { status: 'APPROVED' },
  });

  return { success: true, data: { id: updated.id, status: updated.status } };
}

export async function applyImprovement(
  improvementId: string,
): Promise<ApiResult<{ id: string; status: string }>> {
  const improvement = await prisma.improvement.findUnique({ where: { id: improvementId } });

  if (!improvement) {
    return { success: false, error: { message: 'Improvement not found', code: 'NOT_FOUND' } };
  }

  if (improvement.status !== 'APPROVED') {
    return {
      success: false,
      error: {
        message: `Cannot apply improvement in ${improvement.status} status`,
        code: 'VALIDATION_ERROR',
      },
    };
  }

  const updated = await prisma.improvement.update({
    where: { id: improvementId },
    data: { status: 'APPLIED' },
  });

  return { success: true, data: { id: updated.id, status: updated.status } };
}
