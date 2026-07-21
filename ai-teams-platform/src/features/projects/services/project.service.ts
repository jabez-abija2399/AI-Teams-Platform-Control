import { prisma } from '@/lib/prisma';
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from '@/features/projects/schemas/project.schema';
import type { ApiResult } from '@/types/common.types';
import type { Project } from '../../../../prisma/generated/prisma/client';

export async function createProject(
  ownerId: string,
  input: CreateProjectInput,
): Promise<ApiResult<Project>> {
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid project data',
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const project = await prisma.project.create({
    data: { ...parsed.data, ownerId },
  });

  await prisma.activity.create({
    data: {
      userId: ownerId,
      action: `Created project "${project.name}"`,
    },
  });

  return { success: true, data: project };
}

export async function updateProject(
  projectId: string,
  ownerId: string,
  input: UpdateProjectInput,
): Promise<ApiResult<Project>> {
  const parsed = updateProjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid project data',
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const existing = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
  });
  if (!existing) {
    return {
      success: false,
      error: { message: 'Project not found', code: 'NOT_FOUND' },
    };
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: parsed.data,
  });

  return { success: true, data: project };
}

export async function listProjects(ownerId: string) {
  return prisma.project.findMany({
    where: { ownerId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getProject(projectId: string, ownerId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, ownerId },
    include: {
      tasks: true,
      _count: { select: { tasks: true } },
    },
  });
}

export async function deleteProject(projectId: string, ownerId: string): Promise<ApiResult<null>> {
  const existing = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
  });
  if (!existing) {
    return {
      success: false,
      error: { message: 'Project not found', code: 'NOT_FOUND' },
    };
  }
  await prisma.project.delete({ where: { id: projectId } });
  return { success: true, data: null };
}
