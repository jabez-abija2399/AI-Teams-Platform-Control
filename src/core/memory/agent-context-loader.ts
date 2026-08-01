import { CompanyMemoryService } from './company-memory.service';
import { DecisionIntelligenceEngine } from './decision-intelligence.engine';
import type { CompanyMemoryData, CompanyDecision } from './types';

export interface AgentContextPackage {
  projectId: string;
  agentRole: string;
  vision: string;
  relevantDecisions: CompanyDecision[];
  constraints: string[];
  risks: string[];
  activeMilestones: string[];
  notes: string[];
}

export class AgentContextLoader {
  /**
   * Automatically assembles relevant execution context for a specific AI agent from shared Company Memory
   */
  public static async loadAgentContext(projectId: string, agentRole: string): Promise<AgentContextPackage> {
    const memory = await CompanyMemoryService.getMemory(projectId);
    const allDecisions = await DecisionIntelligenceEngine.getDecisions(projectId);

    // Filter relevant decisions based on agent role
    const roleUpper = agentRole.toUpperCase();
    const relevantDecisions = allDecisions.filter((d) => {
      if (roleUpper === 'ARCHITECT' && d.category === 'architecture') return true;
      if (roleUpper === 'DATABASE' && d.category === 'database') return true;
      if (roleUpper === 'FRONTEND' && (d.category === 'product' || d.category === 'architecture')) return true;
      if (roleUpper === 'DEVELOPER' && (d.category === 'technical' || d.category === 'architecture')) return true;
      if (roleUpper === 'SECURITY' || roleUpper === 'QA') return true;
      return d.createdByAgent.toUpperCase() === roleUpper || d.status === 'approved';
    });

    return {
      projectId,
      agentRole,
      vision: memory.data.vision,
      relevantDecisions,
      constraints: memory.data.constraints,
      risks: memory.data.risks,
      activeMilestones: memory.data.milestones,
      notes: memory.data.notes,
    };
  }
}
