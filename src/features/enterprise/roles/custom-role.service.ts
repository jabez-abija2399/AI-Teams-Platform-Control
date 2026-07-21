import type { ApiResult } from '@/types/common.types';

export interface CustomRoleInfo {
  id: string;
  organizationId: string;
  name: string;
  permissions: string[];
  createdAt: Date;
}

export async function createCustomRole(
  organizationId: string,
  name: string,
  permissions: string[],
): Promise<ApiResult<CustomRoleInfo>> {
  const { prisma } = await import('@/lib/prisma');

  const existing = await prisma.customRole.findUnique({
    where: { organizationId_name: { organizationId, name } },
  });

  if (existing) {
    return {
      success: false,
      error: { message: `A role named "${name}" already exists in this organization`, code: 'VALIDATION_ERROR' },
    };
  }

  const role = await prisma.customRole.create({
    data: {
      organizationId,
      name,
      permissions,
    },
  });

  return {
    success: true,
    data: {
      id: role.id,
      organizationId: role.organizationId,
      name: role.name,
      permissions: role.permissions,
      createdAt: role.createdAt,
    },
  };
}

export async function listCustomRoles(
  organizationId: string,
): Promise<ApiResult<CustomRoleInfo[]>> {
  const { prisma } = await import('@/lib/prisma');

  const roles = await prisma.customRole.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });

  return {
    success: true,
    data: roles.map((role) => ({
      id: role.id,
      organizationId: role.organizationId,
      name: role.name,
      permissions: role.permissions,
      createdAt: role.createdAt,
    })),
  };
}
