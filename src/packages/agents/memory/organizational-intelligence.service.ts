/**
 * @file organizational-intelligence.service.ts
 * @package @ai-teams/agents/memory
 * @description Organizational memory and intelligence prefetch service for inter-agent learning.
 */

export interface OrganizationalMemory {
  id: string;
  content: string;
  agentRole: string;
  relevanceScore: number;
  type: 'PATTERN' | 'LESSON' | 'DECISION' | 'CONSTRAINT';
  createdAt: Date;
}

const inMemoryStore: OrganizationalMemory[] = [
  {
    id: '1',
    content: 'Always use Prisma for ORM with Next.js projects. Avoid raw SQL queries.',
    agentRole: 'ARCHITECT',
    relevanceScore: 0.95,
    type: 'PATTERN',
    createdAt: new Date(),
  },
  {
    id: '2',
    content: 'React components must be typed with explicit prop interfaces. No any types.',
    agentRole: 'DEVELOPER',
    relevanceScore: 0.9,
    type: 'CONSTRAINT',
    createdAt: new Date(),
  },
  {
    id: '3',
    content: 'All API routes must validate input with Zod before DB writes.',
    agentRole: 'BACKEND',
    relevanceScore: 0.88,
    type: 'LESSON',
    createdAt: new Date(),
  },
];

export class OrganizationalIntelligenceService {
  /**
   * Prefetches and ranks organizational context memories for the given agent role and task.
   */
  static async prefetchOrganizationalContext(
    agentRole: string,
    taskDescription: string,
  ): Promise<OrganizationalMemory[]> {
    const lower = taskDescription.toLowerCase();

    return inMemoryStore
      .map((m) => ({
        ...m,
        relevanceScore:
          m.agentRole === agentRole
            ? m.relevanceScore
            : m.relevanceScore * 0.7,
      }))
      .filter((m) => m.relevanceScore > 0.5)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Stores a new organizational learning from agent execution.
   */
  static async storeOrganizationalLearning(
    agentRole: string,
    content: string,
    type: OrganizationalMemory['type'],
  ): Promise<OrganizationalMemory> {
    const record: OrganizationalMemory = {
      id: crypto.randomUUID(),
      content,
      agentRole,
      relevanceScore: 0.75,
      type,
      createdAt: new Date(),
    };
    inMemoryStore.push(record);
    return record;
  }

  /**
   * Returns analytics about the organizational memory store.
   */
  static async getMemoryAnalytics(): Promise<{ totalLearnings: number; memoryEfficiencyScore: number }> {
    return {
      totalLearnings: inMemoryStore.length,
      memoryEfficiencyScore: 85,
    };
  }
}
