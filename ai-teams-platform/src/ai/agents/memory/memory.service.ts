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

const memoryStore: MemoryRecord[] = [];

export async function storeMemory(
  record: Omit<MemoryRecord, 'id' | 'createdAt'>,
): Promise<MemoryRecord> {
  const entry: MemoryRecord = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date(),
  };
  memoryStore.push(entry);
  return entry;
}

export async function searchMemory(filter: MemoryFilter): Promise<MemoryRecord[]> {
  let results = [...memoryStore];

  if (filter.agentId) {
    results = results.filter((r) => r.agentId === filter.agentId);
  }
  if (filter.type) {
    results = results.filter((r) => r.type === filter.type);
  }
  if (filter.search) {
    const query = filter.search.toLowerCase();
    results = results.filter((r) => r.content.toLowerCase().includes(query));
  }

  results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (filter.limit) {
    results = results.slice(0, filter.limit);
  }

  return results;
}

export async function getMemoryById(id: string): Promise<MemoryRecord | undefined> {
  return memoryStore.find((r) => r.id === id);
}

export async function deleteMemory(id: string): Promise<boolean> {
  const index = memoryStore.findIndex((r) => r.id === id);
  if (index === -1) return false;
  memoryStore.splice(index, 1);
  return true;
}

export async function getMemoryStats(agentId?: string): Promise<{
  total: number;
  byType: Record<string, number>;
}> {
  const filtered = agentId ? memoryStore.filter((r) => r.agentId === agentId) : memoryStore;

  const byType: Record<string, number> = {};
  for (const record of filtered) {
    byType[record.type] = (byType[record.type] ?? 0) + 1;
  }

  return { total: filtered.length, byType };
}
