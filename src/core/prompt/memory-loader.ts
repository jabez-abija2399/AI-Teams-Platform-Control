export class MemoryLoader {
  public static async loadAgentMemory(agentRole: string): Promise<string> {
    return `[AGENT MEMORY & PAST DECISIONS]\nRole: ${agentRole}\nPast Decision: Applied Modular App Router Pattern.\nPrevious Mistake Avoided: Always wrap async worker calls in try/catch to prevent zombie locks.`;
  }
}
