import { prisma } from '@/lib/prisma';
import type { Prisma } from '../../../../prisma/generated/prisma/client';
import type { ApiResult } from '@/types/common.types';
import type { EnvironmentInfo } from '@/features/deployment/types';
import {
  createEnvironmentSchema,
  updateEnvironmentSchema,
  type CreateEnvironmentInput,
  type UpdateEnvironmentInput,
} from '@/features/deployment/schemas/deployment.schema';

function toEnvironmentInfo(
  env: {
    id: string;
    projectId: string;
    name: string;
    variables: unknown;
    configuration: unknown;
    createdAt: Date;
  },
  deploymentCount: number,
): EnvironmentInfo {
  const variables =
    typeof env.variables === 'object' && env.variables !== null
      ? (env.variables as Record<string, string>)
      : {};
  const configuration =
    typeof env.configuration === 'object' && env.configuration !== null
      ? (env.configuration as Record<string, unknown>)
      : null;

  return {
    id: env.id,
    projectId: env.projectId,
    name: env.name,
    variables,
    configuration,
    createdAt: env.createdAt,
    deploymentCount,
  };
}

export async function createEnvironment(
  projectId: string,
  input: CreateEnvironmentInput,
): Promise<ApiResult<EnvironmentInfo>> {
  const parsed = createEnvironmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid environment data',
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

  const existing = await prisma.environment.findFirst({
    where: { projectId, name: parsed.data.name },
  });
  if (existing) {
    return {
      success: false,
      error: { message: 'Environment with this name already exists', code: 'CONFLICT' },
    };
  }

  const created = await prisma.environment.create({
    data: {
      projectId,
      name: parsed.data.name,
      variables: parsed.data.variables ?? {},
      configuration: (parsed.data.configuration as unknown as Prisma.InputJsonValue) ?? undefined,
    },
  });

  return { success: true, data: toEnvironmentInfo(created, 0) };
}

export async function listEnvironments(projectId: string): Promise<ApiResult<EnvironmentInfo[]>> {
  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return {
      success: false,
      error: { message: 'Project not found', code: 'NOT_FOUND' },
    };
  }

  const environments = await prisma.environment.findMany({
    where: { projectId },
    include: { deployments: true },
    orderBy: { createdAt: 'desc' },
  });

  return {
    success: true,
    data: environments.map((env) => toEnvironmentInfo(env, env.deployments.length)),
  };
}

export async function getEnvironment(envId: string): Promise<ApiResult<EnvironmentInfo>> {
  const environment = await prisma.environment.findFirst({
    where: { id: envId },
    include: { deployments: true },
  });

  if (!environment) {
    return {
      success: false,
      error: { message: 'Environment not found', code: 'NOT_FOUND' },
    };
  }

  return {
    success: true,
    data: toEnvironmentInfo(environment, environment.deployments.length),
  };
}

export async function updateEnvironment(
  envId: string,
  input: UpdateEnvironmentInput,
): Promise<ApiResult<EnvironmentInfo>> {
  const parsed = updateEnvironmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid environment data',
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const existing = await prisma.environment.findFirst({ where: { id: envId } });
  if (!existing) {
    return {
      success: false,
      error: { message: 'Environment not found', code: 'NOT_FOUND' },
    };
  }

  if (parsed.data.name && parsed.data.name !== existing.name) {
    const duplicate = await prisma.environment.findFirst({
      where: { projectId: existing.projectId, name: parsed.data.name, id: { not: envId } },
    });
    if (duplicate) {
      return {
        success: false,
        error: { message: 'Environment with this name already exists', code: 'CONFLICT' },
      };
    }
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.variables !== undefined) updateData.variables = parsed.data.variables;
  if (parsed.data.configuration !== undefined) {
    updateData.configuration = (parsed.data.configuration as unknown as Prisma.InputJsonValue) ?? undefined;
  }

  const environment = await prisma.environment.update({
    where: { id: envId },
    data: updateData,
    include: { deployments: true },
  });

  return {
    success: true,
    data: toEnvironmentInfo(environment, environment.deployments.length),
  };
}

export async function deleteEnvironment(envId: string): Promise<ApiResult<void>> {
  const existing = await prisma.environment.findFirst({ where: { id: envId } });
  if (!existing) {
    return {
      success: false,
      error: { message: 'Environment not found', code: 'NOT_FOUND' },
    };
  }

  await prisma.environment.delete({ where: { id: envId } });
  return { success: true, data: undefined };
}
