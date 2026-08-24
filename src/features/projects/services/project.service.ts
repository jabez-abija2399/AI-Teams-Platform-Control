import { prisma } from '@/lib/prisma';
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from '@/features/projects/schemas/project.schema';
import type { ApiResult } from '@/types/common.types';
import type { Project, Task } from '../../../../prisma/generated/prisma/client';

export type ProjectWithTasks = Project & {
  tasks?: Task[];
  _count?: { tasks: number };
};
import { checkProjectAccess } from '@/lib/project-access';

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

  try {
    // 1. Ensure owner user exists in DB
    await prisma.user.upsert({
      where: { id: ownerId },
      create: {
        id: ownerId,
        email: 'user@aiteams.com',
        name: 'User',
      },
      update: {},
    });

    const { stack, organizationId, ...projectData } = parsed.data;

    // Verify organization exists if provided
    let validOrgId: string | null = null;
    if (organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
      });
      if (org) validOrgId = org.id;
    }

    const baseSlug =
      parsed.data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'project';
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const selectedStackId =
      stack === 'react'
        ? 'react-vite-frontend-v1'
        : stack === 'static-html'
          ? 'static-html-v1'
          : 'nextjs-fullstack-v1';

    // 2. Create project record in DB
    const project = await prisma.project.create({
      data: {
        ...projectData,
        slug,
        ownerId,
        organizationId: validOrgId,
        selectedStackId,
        selectedStackVersion: '1.0.0',
        stackSource: 'PLATFORM_TEMPLATE',
        status: 'IN_PROGRESS',
        favorite: true,
      },
      include: {
        tasks: true,
        _count: { select: { tasks: true } },
      },
    });

    if (stack) {
      try {
        const { confirmProjectStack } = await import(
          '@/core/project-stack/project-stack.service'
        );
        await confirmProjectStack(project.id, stack);
      } catch (err) {
        console.error('[ProjectService] Failed to confirm stack on create:', err);
      }
    }

    try {
      await prisma.activity.create({
        data: {
          userId: ownerId,
          action: `Created project "${project.name}" (${selectedStackId})`,
        },
      });
    } catch {}

    return { success: true, data: project };
  } catch (err: any) {
    console.error('[ProjectService] Error creating project in DB:', err);
    return {
      success: false,
      error: {
        message: err?.message || 'Failed to create project in database',
        code: 'DATABASE_ERROR',
      },
    };
  }
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

  const access = await checkProjectAccess(projectId, ownerId);
  if (!access.hasAccess) {
    return {
      success: false,
      error: { message: 'Project not found or access denied', code: 'NOT_FOUND' },
    };
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: parsed.data,
  });

  return { success: true, data: project };
}

export async function listProjects(ownerId: string): Promise<Project[]> {
  try {
    const dbProjects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId },
          { organization: { members: { some: { userId: ownerId } } } },
        ],
        status: { not: 'ARCHIVED' },
      },
      include: { _count: { select: { tasks: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    return dbProjects;
  } catch (err) {
    console.error('[ProjectService] Error listing projects from DB:', err);
    return [];
  }
}

export async function getProject(projectId: string, ownerId: string): Promise<ProjectWithTasks | null> {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId },
          { organization: { members: { some: { userId: ownerId } } } },
        ],
      },
      include: {
        tasks: true,
        _count: { select: { tasks: true } },
      },
    });

    if (project) return project;

    // Direct ID lookup fallback if user has access
    const directProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: true,
        _count: { select: { tasks: true } },
      },
    });

    if (directProject) {
      const access = await checkProjectAccess(projectId, ownerId);
      if (access.hasAccess) return directProject;
    }

    // Auto-create project row for direct workspace routes if missing
    try {
      await prisma.user.upsert({
        where: { id: ownerId },
        create: {
          id: ownerId,
          email: 'user@aiteams.com',
          name: 'User',
        },
        update: {},
      });

      const autoCreated = await prisma.project.create({
        data: {
          id: projectId,
          name: 'AI Engineering Project',
          slug: `project-${projectId.slice(-6)}`,
          description: 'Autonomous AI software engineering project.',
          ownerId,
          status: 'IN_PROGRESS',
          selectedStackId: 'nextjs-fullstack-v1',
          selectedStackVersion: '1.0.0',
          stackSource: 'PLATFORM_TEMPLATE',
          favorite: true,
        },
        include: {
          tasks: true,
          _count: { select: { tasks: true } },
        },
      });

      return autoCreated;
    } catch {
      return null;
    }
  } catch (err) {
    console.error(`[ProjectService] Error getting project ${projectId}:`, err);
    return null;
  }
}

export async function deleteProject(projectId: string, ownerId: string): Promise<ApiResult<null>> {
  const access = await checkProjectAccess(projectId, ownerId);
  if (!access.hasAccess || access.role !== 'owner') {
    return {
      success: false,
      error: { message: 'Project not found or permission denied', code: 'NOT_FOUND' },
    };
  }

  await prisma.project.delete({ where: { id: projectId } });
  return { success: true, data: null };
}
