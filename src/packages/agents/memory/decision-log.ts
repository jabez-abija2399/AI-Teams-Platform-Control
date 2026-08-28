/**
 * @file decision-log.ts
 * @package @ai-teams/agents/memory
 * @description Architectural Decision Record (ADR) storage and retrieval interface.
 */

export interface ArchitecturalDecision {
  id: string;
  projectId: string;
  agentRole: string;
  title: string;
  rationale: string;
  decision: string;
  consequences: string[];
  timestamp: string;
}

export class DecisionLog {
  private static decisions: ArchitecturalDecision[] = [];

  public static recordDecision(decision: Omit<ArchitecturalDecision, 'id' | 'timestamp'>): ArchitecturalDecision {
    const record: ArchitecturalDecision = {
      ...decision,
      id: `adr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.decisions.push(record);
    return record;
  }

  public static getDecisions(projectId: string): ArchitecturalDecision[] {
    return this.decisions.filter((d) => d.projectId === projectId);
  }
}
