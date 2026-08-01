import type { MemoryRecord } from './memory.service';
import * as memoryService from './memory.service';

export class MemoryManager {
  async addToMemory(
    agentId: string,
    content: string,
    type: 'episodic' | 'semantic' | 'procedural' = 'episodic',
    metadata?: Record<string, unknown>,
  ): Promise<MemoryRecord> {
    return memoryService.storeMemory({
      agentId,
      content,
      type,
      metadata,
    });
  }

  async recall(agentId: string, query: string, limit = 10): Promise<MemoryRecord[]> {
    return memoryService.searchMemory({
      agentId,
      search: query,
      limit,
    });
  }

  async getRecentMemories(agentId: string, limit = 5): Promise<MemoryRecord[]> {
    return memoryService.searchMemory({
      agentId,
      limit,
    });
  }

  async getMemoriesByType(
    agentId: string,
    type: 'episodic' | 'semantic' | 'procedural',
  ): Promise<MemoryRecord[]> {
    return memoryService.searchMemory({
      agentId,
      type,
    });
  }

  async deleteMemory(id: string): Promise<boolean> {
    return memoryService.deleteMemory(id);
  }

  async search(agentId: string, query: string, limit = 10): Promise<MemoryRecord[]> {
    return memoryService.searchMemory({
      agentId,
      search: query,
      limit,
    });
  }

  async remember(opts: {
    agentId: string;
    content: string;
    type: string;
    metadata?: Record<string, unknown>;
  }): Promise<MemoryRecord> {
    const memoryType: 'episodic' | 'semantic' | 'procedural' =
      opts.type === 'PROCEDURAL' || opts.type === 'procedural'
        ? 'procedural'
        : opts.type === 'PROJECT' || opts.type === 'episodic'
          ? 'episodic'
          : 'semantic';
    return memoryService.storeMemory({
      agentId: opts.agentId,
      content: opts.content,
      type: memoryType,
      metadata: opts.metadata,
    });
  }

  async retrieve(agentId: string, query: string, limit = 10): Promise<MemoryRecord[]> {
    return this.search(agentId, query, limit);
  }

  async storeShortTerm(agentId: string, content: string | Record<string, unknown>, metadata?: Record<string, unknown>): Promise<MemoryRecord> {
    const strContent = typeof content === 'string' ? content : JSON.stringify(content);
    return this.addToMemory(agentId, strContent, 'episodic', { layer: 'short_term', ...metadata });
  }

  async storeLongTerm(agentId: string, content: string | Record<string, unknown>, metadata?: Record<string, unknown>): Promise<MemoryRecord> {
    const strContent = typeof content === 'string' ? content : JSON.stringify(content);
    return this.addToMemory(agentId, strContent, 'semantic', { layer: 'long_term', ...metadata });
  }

  async storeLesson(arg1: string, arg2: string, arg3: string, arg4?: Record<string, unknown> | string): Promise<MemoryRecord> {
    let agentId = arg1;
    let mistake = arg2;
    let lesson = arg3;
    let metadata: Record<string, unknown> | undefined = typeof arg4 === 'object' ? arg4 : undefined;

    if (typeof arg4 === 'string' || (typeof arg4 === 'object' && arg4 !== null && 'fix' in arg4)) {
      agentId = arg2;
      mistake = arg3;
      lesson = typeof arg4 === 'string' ? arg4 : JSON.stringify(arg4);
    }

    const content = `Mistake: ${mistake} | Lesson: ${lesson}`;
    return this.addToMemory(agentId, content, 'procedural', metadata);
  }

  async getRelevantLessons(arg1: string, arg2?: string, arg3?: string | number, arg4 = 5): Promise<any[]> {
    let agentId = arg1;
    let query = typeof arg2 === 'string' ? arg2 : undefined;
    let limit = typeof arg3 === 'number' ? arg3 : typeof arg4 === 'number' ? arg4 : 5;

    if (typeof arg3 === 'string') {
      agentId = arg2 || arg1;
      query = arg3;
    }

    let records = await memoryService.searchMemory({
      agentId,
      type: 'procedural',
      search: query,
      limit,
    });

    if (records.length === 0) {
      records = await memoryService.searchMemory({
        type: 'procedural',
        search: query,
        limit,
      });
    }

    return records.map((r) => r.content);
  }

  async getStats(agentId?: string) {
    return memoryService.getMemoryStats(agentId);
  }
}

let memoryManagerInstance: MemoryManager | null = null;

export function getMemoryManager(): MemoryManager {
  if (!memoryManagerInstance) {
    memoryManagerInstance = new MemoryManager();
  }
  return memoryManagerInstance;
}
