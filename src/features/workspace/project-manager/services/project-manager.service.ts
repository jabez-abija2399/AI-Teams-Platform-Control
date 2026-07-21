import { prisma } from '@/lib/prisma';
import { createProjectSchema, type CreateProjectInput } from '../schemas/project-manager.schema';
import type { ApiResult } from '@/types/common.types';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let counter = 1;
  while (await prisma.project.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

export async function createWorkspaceProject(
  ownerId: string,
  input: CreateProjectInput,
): Promise<ApiResult<{ id: string }>> {
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

  const slug = await uniqueSlug(slugify(parsed.data.name));
  const project = await prisma.project.create({
    data: { ...parsed.data, slug, ownerId, lastOpenedAt: new Date() },
  });

  await recordRecentProject(ownerId, project.id);
  return { success: true, data: { id: project.id } };
}

export async function renameProject(
  projectId: string,
  ownerId: string,
  name: string,
): Promise<ApiResult<{ id: string }>> {
  const existing = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
  });
  if (!existing)
    return {
      success: false,
      error: { message: 'Project not found', code: 'NOT_FOUND' },
    };

  await prisma.project.update({ where: { id: projectId }, data: { name } });
  return { success: true, data: { id: projectId } };
}

export async function archiveProject(
  projectId: string,
  ownerId: string,
): Promise<ApiResult<null>> {
  const existing = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
  });
  if (!existing)
    return {
      success: false,
      error: { message: 'Project not found', code: 'NOT_FOUND' },
    };

  await prisma.project.update({
    where: { id: projectId },
    data: { status: 'ARCHIVED' },
  });
  return { success: true, data: null };
}

export async function deleteWorkspaceProject(
  projectId: string,
  ownerId: string,
): Promise<ApiResult<null>> {
  const existing = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
  });
  if (!existing)
    return {
      success: false,
      error: { message: 'Project not found', code: 'NOT_FOUND' },
    };

  await prisma.project.delete({ where: { id: projectId } });
  return { success: true, data: null };
}

export async function duplicateProject(
  projectId: string,
  ownerId: string,
  newName: string,
): Promise<ApiResult<{ id: string }>> {
  const existing = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
  });
  if (!existing)
    return {
      success: false,
      error: { message: 'Project not found', code: 'NOT_FOUND' },
    };

  const slug = await uniqueSlug(slugify(newName));
  const duplicate = await prisma.project.create({
    data: {
      name: newName,
      slug,
      description: existing.description,
      icon: existing.icon,
      color: existing.color,
      ownerId,
      lastOpenedAt: new Date(),
    },
  });
  return { success: true, data: { id: duplicate.id } };
}

export async function toggleFavorite(
  projectId: string,
  ownerId: string,
): Promise<ApiResult<{ favorite: boolean }>> {
  const existing = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
  });
  if (!existing)
    return {
      success: false,
      error: { message: 'Project not found', code: 'NOT_FOUND' },
    };

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { favorite: !existing.favorite },
  });
  return { success: true, data: { favorite: project.favorite } };
}

export async function recordRecentProject(
  userId: string,
  projectId: string,
): Promise<void> {
  await prisma.recentProject.upsert({
    where: { userId_projectId: { userId, projectId } },
    create: { userId, projectId },
    update: { lastOpenedAt: new Date() },
  });
  await prisma.project.update({
    where: { id: projectId },
    data: { lastOpenedAt: new Date() },
  });
}

export async function listRecentProjects(userId: string, limit = 8) {
  const recents = await prisma.recentProject.findMany({
    where: { userId },
    orderBy: { lastOpenedAt: 'desc' },
    take: limit,
    include: { project: true },
  });
  return recents.map((r) => r.project);
}
