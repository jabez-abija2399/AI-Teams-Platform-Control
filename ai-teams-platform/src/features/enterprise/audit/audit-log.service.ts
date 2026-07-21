import type { ApiResult } from '@/types/common.types';

export interface AuditLogEntry {
  id: string;
  organizationId: string;
  actorType: string;
  actorId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export async function logAuditEvent(
  organizationId: string,
  actorType: string,
  actorId: string,
  action: string,
  metadata?: Record<string, unknown>,
): Promise<ApiResult<AuditLogEntry>> {
  const { prisma } = await import('@/lib/prisma');

  const log = await prisma.auditLog.create({
    data: {
      organizationId,
      actorType,
      actorId,
      action,
      metadata: metadata as never,
    },
  });

  return {
    success: true,
    data: {
      id: log.id,
      organizationId: log.organizationId,
      actorType: log.actorType,
      actorId: log.actorId,
      action: log.action,
      metadata: log.metadata as Record<string, unknown> | null,
      createdAt: log.createdAt,
    },
  };
}

export async function getAuditLog(
  organizationId: string,
  limit = 100,
): Promise<ApiResult<AuditLogEntry[]>> {
  const { prisma } = await import('@/lib/prisma');

  const logs = await prisma.auditLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return {
    success: true,
    data: logs.map((log) => ({
      id: log.id,
      organizationId: log.organizationId,
      actorType: log.actorType,
      actorId: log.actorId,
      action: log.action,
      metadata: log.metadata as Record<string, unknown> | null,
      createdAt: log.createdAt,
    })),
  };
}
