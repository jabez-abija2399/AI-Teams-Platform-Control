import { getMemoryManager } from './memory.manager';

export interface ContextBundle {
  memoryContext: string;
  priorDecisions: string[];
  relevantMemories: Array<{ content: string; type: string; createdAt: Date }>;
}

export async function buildContext(
  agentId: string,
  projectId: string,
  query: string,
  limit = 5,
): Promise<ContextBundle> {
  const memory = getMemoryManager();
  const memories = await memory.search(agentId, query, limit);

  const priorDecisions = memories
    .filter((m) => m.type === 'semantic' || m.type === 'episodic')
    .map((m) => m.content);

  const memoryContext = priorDecisions.length
    ? `Prior context for this project:\n${priorDecisions.map((d) => `- ${d}`).join('\n')}`
    : '';

  return {
    memoryContext,
    priorDecisions,
    relevantMemories: memories.map((m) => ({
      content: m.content,
      type: m.type,
      createdAt: m.createdAt,
    })),
  };
}
