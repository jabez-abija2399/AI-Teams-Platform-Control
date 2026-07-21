import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type { ReleaseInfo } from '@/features/deployment/types';
import {
  createReleaseSchema,
  type CreateReleaseInput,
} from '@/features/deployment/schemas/deployment.schema';

function toReleaseInfo(
  release: {
    id: string;
    projectId: string;
    version: string;
    commit: string | null;
    status: string;
    createdAt: Date;
  },
): ReleaseInfo {
  return {
    id: release.id,
    projectId: release.projectId,
    version: release.version,
    commit: release.commit,
    status: release.status,
    createdAt: release.createdAt,
  };
}

export async function createRelease(
  projectId: string,
  input: CreateReleaseInput,
): Promise<ApiResult<ReleaseInfo>> {
  const parsed = createReleaseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid release data',
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return {
      success: false,
      error: { message: 'Project not found', code: 'NOT_FOUND' },
    };
  }

  const release = await prisma.release.create({
    data: {
      projectId,
      version: parsed.data.version,
      commit: parsed.data.commit ?? null,
    },
  });

  return { success: true, data: toReleaseInfo(release) };
}

export async function listReleases(
  projectId: string,
  limit = 20,
): Promise<ApiResult<ReleaseInfo[]>> {
  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return {
      success: false,
      error: { message: 'Project not found', code: 'NOT_FOUND' },
    };
  }

  const releases = await prisma.release.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return { success: true, data: releases.map(toReleaseInfo) };
}

export async function getRelease(releaseId: string): Promise<ApiResult<ReleaseInfo>> {
  const release = await prisma.release.findFirst({ where: { id: releaseId } });

  if (!release) {
    return {
      success: false,
      error: { message: 'Release not found', code: 'NOT_FOUND' },
    };
  }

  return { success: true, data: toReleaseInfo(release) };
}
