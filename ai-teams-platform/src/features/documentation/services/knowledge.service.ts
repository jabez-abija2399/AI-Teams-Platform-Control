import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type { KnowledgeEntry } from '../types';
import { createKnowledgeSchema, type CreateKnowledgeInput } from '../schemas/documentation.schema';

function toKnowledgeEntry(item: {
  id: string;
  projectId: string;
  source: string;
  content: string;
  metadata: unknown;
  createdAt: Date;
}): KnowledgeEntry {
  const metadata =
    item.metadata !== null && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : null;
  return {
    id: item.id,
    projectId: item.projectId,
    source: item.source,
    content: item.content,
    metadata,
    createdAt: item.createdAt,
  };
}

export async function recordKnowledge(
  projectId: string,
  input: CreateKnowledgeInput,
): Promise<ApiResult<KnowledgeEntry>> {
  const parsed = createKnowledgeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid knowledge data',
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

  const item = await prisma.knowledgeItem.create({
    data: {
      projectId,
      source: parsed.data.source,
      content: parsed.data.content,
      metadata: (parsed.data.metadata as never) ?? undefined,
    },
  });

  return { success: true, data: toKnowledgeEntry(item) };
}

export async function searchKnowledge(
  projectId: string,
  query: string,
): Promise<ApiResult<KnowledgeEntry[]>> {
  const items = await prisma.knowledgeItem.findMany({
    where: {
      projectId,
      content: { contains: query, mode: 'insensitive' },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return { success: true, data: items.map(toKnowledgeEntry) };
}

export async function listKnowledge(
  projectId: string,
  limit = 50,
): Promise<ApiResult<KnowledgeEntry[]>> {
  const items = await prisma.knowledgeItem.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return { success: true, data: items.map(toKnowledgeEntry) };
}

export async function deleteKnowledge(knowledgeId: string): Promise<ApiResult<void>> {
  const existing = await prisma.knowledgeItem.findUnique({ where: { id: knowledgeId } });
  if (!existing) {
    return {
      success: false,
      error: { message: 'Knowledge item not found', code: 'NOT_FOUND' },
    };
  }

  await prisma.knowledgeItem.delete({ where: { id: knowledgeId } });
  return { success: true, data: undefined };
}
