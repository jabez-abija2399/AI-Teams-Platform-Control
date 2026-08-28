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

  async storeLesson(projectId: string, agentRole: string, mistake: string, details?: Record<string, unknown>): Promise<MemoryRecord> {
    const fixNote = details?.fix ? ` | Fix: ${details.fix}` : '';
    const content = `Mistake: ${mistake}${fixNote}`;
    // Store keyed by agentRole (not projectId) so cross-project retrieval works
    return this.addToMemory(`role:${agentRole}`, content, 'procedural', { projectId, agentRole, ...details });
  }

  async getRelevantLessons(projectId: string, agentRole: string, query?: string, limit = 5): Promise<string[]> {
    const roleKey = `role:${agentRole}`;

    // First try: exact text search by role
    let records = await memoryService.searchMemory({
      agentId: roleKey,
      type: 'procedural',
      search: query,
      limit,
    });

    // Fallback: all procedural memories for this role (no text filter)
    if (records.length === 0) {
      records = await memoryService.searchMemory({
        agentId: roleKey,
        type: 'procedural',
        limit,
      });
    }

    // Final fallback: all procedural memories across all agents
    if (records.length === 0) {
      records = await memoryService.searchMemory({
        type: 'procedural',
        limit,
      });
    }

    return records.map((r: any) => r.content);
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
