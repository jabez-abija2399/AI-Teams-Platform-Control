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
    return memoryService.storeMemory({
      agentId: opts.agentId,
      content: opts.content,
      type: opts.type === 'PROJECT' ? 'episodic' : 'semantic',
      metadata: opts.metadata,
    });
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
