import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';

interface Milestone {
  name: string;
  date: string;
  description?: string;
  status?: string;
}

interface RoadmapData {
  id: string;
  projectId: string;
  name: string;
  milestones: unknown;
  createdAt: Date;
}

export async function createRoadmap(
  projectId: string,
  name: string,
  milestones: Milestone[],
): Promise<ApiResult<RoadmapData>> {
  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return { success: false, error: { message: 'Project not found', code: 'NOT_FOUND' } };
  }

  if (!name || name.trim().length === 0) {
    return { success: false, error: { message: 'Roadmap name is required', code: 'VALIDATION_ERROR' } };
  }

  if (!milestones || milestones.length === 0) {
    return { success: false, error: { message: 'At least one milestone is required', code: 'VALIDATION_ERROR' } };
  }

  const roadmap = await prisma.roadmap.create({
    data: {
      projectId,
      name: name.trim(),
      milestones: milestones.map((m) => ({
        name: m.name,
        date: m.date,
        description: m.description ?? '',
        status: m.status ?? 'PLANNED',
      })),
    },
  });

  return { success: true, data: roadmap };
}

export async function getRoadmap(
  projectId: string,
): Promise<ApiResult<RoadmapData | null>> {
  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return { success: false, error: { message: 'Project not found', code: 'NOT_FOUND' } };
  }

  const roadmap = await prisma.roadmap.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  return { success: true, data: roadmap };
}
