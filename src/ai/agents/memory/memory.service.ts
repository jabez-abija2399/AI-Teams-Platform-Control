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

const inMemoryStore = new Map<string, MemoryRecord>();

// Fast DB availability check — cached per process to avoid repeated timeouts
let _dbOk: boolean | null = null;
async function dbOk(): Promise<boolean> {
  if (_dbOk !== null) return _dbOk;
  try {
    const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 1000));
    await Promise.race([prisma.$queryRawUnsafe('SELECT 1'), timeout]);
    _dbOk = true;
  } catch {
    _dbOk = false;
  }
  return _dbOk;
}

export async function storeMemory(
  record: Omit<MemoryRecord, 'id' | 'createdAt'>,
): Promise<MemoryRecord> {
  const encoded = `${encodeType(record.type)} ${record.content}`;

  if (await dbOk()) {
    try {
      const created = await prisma.memory.create({
        data: {
          agentId: record.agentId,
          content: encoded,
          importance: record.type === 'episodic' ? 'LOW' : record.type === 'semantic' ? 'MEDIUM' : 'HIGH',
        },
      });
      const memRecord: MemoryRecord = {
        id: created.id,
        agentId: created.agentId,
        content: record.content,
        type: decodeContent(created.content).type,
        metadata: record.metadata,
        createdAt: created.createdAt,
      };
      inMemoryStore.set(memRecord.id, memRecord);
      return memRecord;
    } catch {
      _dbOk = false;
    }
  }

  // In-memory fallback
  const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const memRecord: MemoryRecord = {
    id,
    agentId: record.agentId,
    content: record.content,
    type: record.type,
    metadata: record.metadata,
    createdAt: new Date(),
  };
  inMemoryStore.set(id, memRecord);
  return memRecord;
}

export async function searchMemory(filter: MemoryFilter): Promise<MemoryRecord[]> {
  let results: Array<{ id: string; agentId: string; content: string; createdAt: Date; metadata?: Record<string, unknown> }> = [];

  if (await dbOk()) {
    try {
      const where: Record<string, unknown> = {};
      if (filter.agentId) where.agentId = filter.agentId;

      results = await prisma.memory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filter.limit ?? 10,
      });
    } catch {
      _dbOk = false;
      results = getInMemoryResults(filter);
    }
  } else {
    results = getInMemoryResults(filter);
  }

  let mapped = results.map((r) => {
    const decoded = decodeContent(r.content);
    return {
      id: r.id,
      agentId: r.agentId,
      content: decoded.content,
      type: decoded.type,
      metadata: r.metadata || inMemoryStore.get(r.id)?.metadata,
      createdAt: r.createdAt,
    };
  });

  if (filter.type) {
    mapped = mapped.filter((r) => r.type === filter.type);
  }

  if (filter.search) {
    const q = filter.search.toLowerCase();
    mapped = mapped.filter((r) => {
      const c = r.content.toLowerCase();
      if (c.includes(q)) return true;
      const keywords = q.split(/\s+/).filter((w) => w.length > 3);
      return keywords.some((kw) => c.includes(kw));
    });
  }

  return mapped;
}

function getInMemoryResults(filter: MemoryFilter) {
  return Array.from(inMemoryStore.values())
    .filter((m) => !filter.agentId || m.agentId === filter.agentId)
    .map((m) => ({ id: m.id, agentId: m.agentId, content: `${encodeType(m.type)} ${m.content}`, createdAt: m.createdAt, metadata: m.metadata }));
}

export async function getMemoryById(id: string): Promise<MemoryRecord | undefined> {
  const inMem = inMemoryStore.get(id);
  if (inMem) return inMem;

  if (await dbOk()) {
    try {
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
    } catch {
      _dbOk = false;
    }
  }

  return undefined;
}

export async function deleteMemory(id: string): Promise<boolean> {
  inMemoryStore.delete(id);
  if (await dbOk()) {
    try {
      await prisma.memory.delete({ where: { id } });
    } catch {
      // Ignore — may not exist in DB
    }
  }
  return true;
}

export async function getMemoryStats(agentId?: string): Promise<{
  total: number;
  byType: Record<string, number>;
}> {
  let results: Array<{ content: string }> = [];

  if (await dbOk()) {
    try {
      const where = agentId ? { agentId } : {};
      results = await prisma.memory.findMany({ where });
    } catch {
      _dbOk = false;
      results = Array.from(inMemoryStore.values())
        .filter((m) => !agentId || m.agentId === agentId)
        .map((m) => ({ content: `${encodeType(m.type)} ${m.content}` }));
    }
  } else {
    results = Array.from(inMemoryStore.values())
      .filter((m) => !agentId || m.agentId === agentId)
      .map((m) => ({ content: `${encodeType(m.type)} ${m.content}` }));
  }

  const byType: Record<string, number> = {};
  for (const r of results) {
    const decoded = decodeContent(r.content);
    byType[decoded.type] = (byType[decoded.type] ?? 0) + 1;
  }
  return { total: results.length, byType };
}
