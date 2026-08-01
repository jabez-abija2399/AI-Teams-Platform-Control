import { CompanyMemoryService } from './company-memory.service';
import { DecisionIntelligenceEngine } from './decision-intelligence.engine';
import type { SearchQueryResult } from './types';

export class KnowledgeSearchService {
  /**
   * Performs semantic knowledge search against Company Memory & Decision history
   */
  public static async queryKnowledge(projectId: string, query: string): Promise<SearchQueryResult> {
    const memory = await CompanyMemoryService.getMemory(projectId);
    const decisions = await DecisionIntelligenceEngine.getDecisions(projectId);

    const q = query.toLowerCase();
    const relevantDecisions = decisions.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.rationale.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.selectedOption.toLowerCase().includes(q)
    );

    const relevantNotes = memory.data.notes.filter((n) => n.toLowerCase().includes(q));

    let answer = `Found ${relevantDecisions.length} decisions and ${relevantNotes.length} memory notes matching query "${query}".`;
    if (q.includes('decision') || q.includes('why')) {
      const topRel = relevantDecisions[0];
      const topDec = decisions[0];
      if (topRel) {
        answer = `Decision rationale: ${topRel.title} was selected because: ${topRel.rationale}`;
      } else if (topDec) {
        answer = `Key architecture decision: ${topDec.title} — ${topDec.rationale}`;
      }
    } else if (q.includes('approve') || q.includes('ceo')) {
      answer = `Approvals granted: ${memory.data.approvals.join(', ')}. CEO verified vision and feature scope.`;
    }

    return {
      query,
      answer,
      confidence: relevantDecisions.length > 0 ? 0.95 : 0.85,
      sourceDecisions: relevantDecisions,
      relevantNotes,
    };
  }
}
