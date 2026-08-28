/**
 * @file memory.service.ts
 * @package @ai-teams/agents/memory
 * @description In-memory semantic and episodic agent memory storage service.
 */

export interface MemoryRecord {
  id: string;
  agentId: string;
  content: string;
  type: 'episodic' | 'semantic' | 'procedural';
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const memoryStore = new Map<string, MemoryRecord[]>();

export async function storeMemory(params: {
  agentId: string;
  content: string;
  type?: 'episodic' | 'semantic' | 'procedural';
  metadata?: Record<string, unknown>;
}): Promise<MemoryRecord> {
  const record: MemoryRecord = {
    id: crypto.randomUUID(),
    agentId: params.agentId,
    content: params.content,
    type: params.type || 'episodic',
    metadata: params.metadata,
    createdAt: new Date(),
  };
  const list = memoryStore.get(params.agentId) || [];
  list.push(record);
  memoryStore.set(params.agentId, list);
  return record;
}

export async function searchMemory(params: {
  agentId?: string;
  search?: string;
  type?: string;
  limit?: number;
}): Promise<MemoryRecord[]> {
  let list: MemoryRecord[] = [];
  if (params.agentId) {
    list = memoryStore.get(params.agentId) || [];
  } else {
    for (const arr of memoryStore.values()) {
      list.push(...arr);
    }
  }
  let matched = list;
  if (params.type) {
    matched = matched.filter((r) => r.type === params.type);
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    matched = matched.filter((r) => r.content.toLowerCase().includes(q));
  }
  return matched.slice(0, params.limit || 10);
}

export async function deleteMemory(id: string): Promise<boolean> {
  for (const [agentId, list] of memoryStore.entries()) {
    const filtered = list.filter((r) => r.id !== id);
    if (filtered.length !== list.length) {
      memoryStore.set(agentId, filtered);
      return true;
    }
  }
  return false;
}

export async function getMemoryStats(agentId?: string): Promise<{ totalRecords: number; types: Record<string, number> }> {
  let records: MemoryRecord[] = [];
  if (agentId) {
    records = memoryStore.get(agentId) || [];
  } else {
    for (const list of memoryStore.values()) {
      records.push(...list);
    }
  }
  const types: Record<string, number> = {};
  for (const r of records) {
    types[r.type] = (types[r.type] || 0) + 1;
  }
  return { totalRecords: records.length, types };
}
