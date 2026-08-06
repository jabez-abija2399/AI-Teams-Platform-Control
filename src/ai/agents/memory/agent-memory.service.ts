import { prisma } from '@/lib/prisma';

export const MemoryCategorySchema = [
  'previous_decisions',
  'lessons_learned',
  'technical_preferences',
  'common_mistakes',
  'improvements',
] as const;

export type MemoryCategory = (typeof MemoryCategorySchema)[number];

export interface CategorizedMemoryRecord {
  id: string;
  agentId: string;
  category: MemoryCategory;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

function encodeCategory(category: MemoryCategory): string {
  return `[@cat:${category}]`;
}

function decodeCategoryAndContent(raw: string): { category: MemoryCategory; content: string } {
  const match = raw.match(/^\[@cat:(\w+)\](.*)/s);
  if (match && match[1] && match[2]) {
    const cat = match[1] as MemoryCategory;
    if (MemoryCategorySchema.includes(cat)) {
      return { category: cat, content: match[2].trim() };
    }
  }
  return { category: 'lessons_learned', content: raw };
}

export class AgentMemoryService {
  async storeCategorizedMemory(
    agentId: string,
    content: string,
    category: MemoryCategory,
    metadata?: Record<string, unknown>,
  ): Promise<CategorizedMemoryRecord> {
    const encoded = `${encodeCategory(category)} ${content}`;
    const importance = category === 'common_mistakes' || category === 'previous_decisions' ? 'HIGH' : 'MEDIUM';

    const created = await prisma.memory.create({
      data: {
        agentId,
        content: encoded,
        importance,
      },
      select: { id: true, agentId: true, content: true, createdAt: true },
    });

    return {
      id: created.id,
      agentId: created.agentId,
      category,
      content,
      metadata,
      createdAt: created.createdAt,
    };
  }

  async recallRelevantMemories(
    agentId: string,
    taskQuery: string,
    category?: MemoryCategory,
    limit = 5,
  ): Promise<CategorizedMemoryRecord[]> {
    // Never load all memories; only query top recent or keyword-matching records for the agent
    const results = await prisma.memory.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Bound search window to avoid loading all database memories
    });

    const decodedList: CategorizedMemoryRecord[] = results.map((r) => {
      const { category: cat, content } = decodeCategoryAndContent(r.content);
      return {
        id: r.id,
        agentId: r.agentId,
        category: cat,
        content,
        createdAt: r.createdAt,
      };
    });

    let filtered = decodedList;
    if (category) {
      filtered = filtered.filter((m) => m.category === category);
    }

    if (taskQuery && taskQuery.trim().length > 0) {
      const keywords = taskQuery.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      if (keywords.length > 0) {
        // Score relevance by keyword hits
        const scored = filtered.map((m) => {
          const lower = m.content.toLowerCase();
          const hits = keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
          return { memory: m, hits };
        });
        scored.sort((a, b) => b.hits - a.hits);
        filtered = scored.filter((s) => s.hits > 0).map((s) => s.memory);
        if (filtered.length === 0) {
          // Fallback to top recent lessons if no direct keyword matches
          filtered = decodedList.slice(0, limit);
        }
      }
    }

    return filtered.slice(0, limit);
  }

  async getAgentMemoryStats(agentId: string): Promise<Record<MemoryCategory, number>> {
    const results = await prisma.memory.findMany({ where: { agentId } });
    const stats: Record<MemoryCategory, number> = {
      previous_decisions: 0,
      lessons_learned: 0,
      technical_preferences: 0,
      common_mistakes: 0,
      improvements: 0,
    };

    for (const r of results) {
      const { category } = decodeCategoryAndContent(r.content);
      stats[category] = (stats[category] ?? 0) + 1;
    }

    return stats;
  }
}

let agentMemoryServiceInstance: AgentMemoryService | null = null;

export function getAgentMemoryService(): AgentMemoryService {
  if (!agentMemoryServiceInstance) {
    agentMemoryServiceInstance = new AgentMemoryService();
  }
  return agentMemoryServiceInstance;
}
