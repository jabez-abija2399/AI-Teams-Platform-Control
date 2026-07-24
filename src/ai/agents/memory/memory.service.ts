import { prisma } from '@/lib/prisma';
import type { AgentRole } from '../core/agent.types';

export interface MemoryFilter {
  agentId?: string;
  type?: 'episodic' | 'semantic' | 'procedural';
  role?: AgentRole;
  search?: string;
  limit?: number;
}

export interface MemoryRecord {
  id: string;
  agentId: string;
  content: string;
  type: 'episodic' | 'semantic' | 'procedural';
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

function encodeType(type: string): string {
  return `[@type:${type}]`;
}

function decodeContent(raw: string): { type: 'episodic' | 'semantic' | 'procedural'; content: string; } {
  const match = raw.match(/^\[@type:(\w+)\](.*)/s);
  if (match && match[1] && match[2]) {
    const t = match[1] as 'episodic' | 'semantic' | 'procedural';
    return { type: t, content: match[2].trim() };
  }
  return { type: 'episodic', content: raw };
}

export async function storeMemory(
  record: Omit<MemoryRecord, 'id' | 'createdAt'>,
): Promise<MemoryRecord> {
  const encoded = `${encodeType(record.type)} ${record.content}`;
  const created = await prisma.memory.create({
    data: {
      agentId: record.agentId,
      content: encoded,
      importance: record.type === 'episodic' ? 'LOW' : record.type === 'semantic' ? 'MEDIUM' : 'HIGH',
    },
  });
  return {
    id: created.id,
    agentId: created.agentId,
    content: record.content,
    type: decodeContent(created.content).type,
    createdAt: created.createdAt,
  };
}

export async function searchMemory(filter: MemoryFilter): Promise<MemoryRecord[]> {
  const where: Record<string, unknown> = {};
  if (filter.agentId) where.agentId = filter.agentId;

  const results = await prisma.memory.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filter.limit ?? 10,
  });

  let mapped = results.map((r) => {
    const decoded = decodeContent(r.content);
    return {
      id: r.id,
      agentId: r.agentId,
      content: decoded.content,
      type: decoded.type,
      createdAt: r.createdAt,
    };
  });

  if (filter.type) {
    mapped = mapped.filter((r) => r.type === filter.type);
  }

  if (filter.search) {
    const q = filter.search.toLowerCase();
    mapped = mapped.filter((r) => r.content.toLowerCase().includes(q));
  }

  return mapped;
}

export async function getMemoryById(id: string): Promise<MemoryRecord | undefined> {
  const record = await prisma.memory.findUnique({ where: { id } });
  if (!record) return undefined;
  const decoded = decodeContent(record.content);
  return {
    id: record.id,
    agentId: record.agentId,
    content: decoded.content,
    type: decoded.type,
    createdAt: record.createdAt,
  };
}

export async function deleteMemory(id: string): Promise<boolean> {
  try {
    await prisma.memory.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function getMemoryStats(agentId?: string): Promise<{
  total: number;
  byType: Record<string, number>;
}> {
  const where = agentId ? { agentId } : {};
  const results = await prisma.memory.findMany({ where });
  const byType: Record<string, number> = {};
  for (const r of results) {
    const decoded = decodeContent(r.content);
    byType[decoded.type] = (byType[decoded.type] ?? 0) + 1;
  }
  return { total: results.length, byType };
}
