import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import { z } from 'zod';
import type { Task } from '../../../../prisma/generated/prisma/client';

const createTaskSchema = z.object({
  title: z.string().min(2).max(150),
  description: z.string().max(1000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

export async function createTask(
  projectId: string,
  ownerId: string,
  input: unknown,
): Promise<ApiResult<Task>> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
  });
  if (!project) {
    return {
      success: false,
      error: {
        message: 'Project not found',
        code: 'NOT_FOUND',
      },
    };
  }

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid task data',
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const task = await prisma.task.create({
    data: { ...parsed.data, projectId },
  });
  return { success: true, data: task };
}

export async function listTasks(projectId: string, ownerId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
  });
  if (!project) return null;
  return prisma.task.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
}
