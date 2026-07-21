import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type { PlatformEventInfo } from '@/features/analytics/types';
import {
  recordEventSchema,
  eventFilterSchema,
  type RecordEventInput,
  type EventFilter,
} from '@/features/analytics/schemas/analytics.schema';
import type { Prisma } from '../../../../prisma/generated/prisma/client';

function toPlatformEventInfo(
  event: {
    id: string;
    projectId: string;
    type: string;
    source: string;
    data: unknown;
    createdAt: Date;
  },
): PlatformEventInfo {
  return {
    id: event.id,
    projectId: event.projectId,
    type: event.type,
    source: event.source,
    data: (event.data as Record<string, unknown>) ?? null,
    createdAt: event.createdAt,
  };
}

export async function recordEvent(
  projectId: string,
  input: RecordEventInput,
): Promise<ApiResult<PlatformEventInfo>> {
  const parsed = recordEventSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid event data',
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

  const event = await prisma.platformEvent.create({
    data: {
      projectId,
      type: parsed.data.type,
      source: parsed.data.source,
      data: parsed.data.data
        ? (parsed.data.data as unknown as Prisma.InputJsonValue)
        : undefined,
    },
  });

  return { success: true, data: toPlatformEventInfo(event) };
}

export async function listEvents(
  projectId: string,
  filter?: EventFilter,
): Promise<ApiResult<PlatformEventInfo[]>> {
  const parsedFilter = filter ? eventFilterSchema.safeParse(filter) : undefined;
  const where: Record<string, unknown> = { projectId };

  if (parsedFilter?.success) {
    if (parsedFilter.data.type) where.type = parsedFilter.data.type;
    if (parsedFilter.data.source) where.source = parsedFilter.data.source;
    if (parsedFilter.data.since) {
      where.createdAt = { gte: new Date(parsedFilter.data.since) };
    }
  }

  const limit = parsedFilter?.success ? (parsedFilter.data.limit ?? 50) : 50;

  const events = await prisma.platformEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return { success: true, data: events.map(toPlatformEventInfo) };
}

export async function getEventsByType(
  projectId: string,
  type: string,
): Promise<ApiResult<PlatformEventInfo[]>> {
  const events = await prisma.platformEvent.findMany({
    where: { projectId, type },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return { success: true, data: events.map(toPlatformEventInfo) };
}

export async function getEventCountsByType(
  projectId: string,
  since?: string,
): Promise<ApiResult<Record<string, number>>> {
  const where: Record<string, unknown> = { projectId };
  if (since) {
    where.createdAt = { gte: new Date(since) };
  }

  const events = await prisma.platformEvent.findMany({
    where,
    select: { type: true },
  });

  const counts: Record<string, number> = {};
  for (const event of events) {
    counts[event.type] = (counts[event.type] ?? 0) + 1;
  }

  return { success: true, data: counts };
}
