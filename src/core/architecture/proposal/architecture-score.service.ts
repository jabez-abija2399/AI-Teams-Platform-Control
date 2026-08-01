import type { ArchitectureProposal } from './architecture-proposal.engine';

export interface ArchitectureQualityScores {
  scalability: number;
  security: number;
  maintainability: number;
  complexity: number;
  overall: number;
}

export class ArchitectureScoreService {
  /**
   * Calculates scalability, security, maintainability, complexity, and overall scores for an ArchitectureProposal
   */
  public static calculateScore(proposal: Partial<ArchitectureProposal> | Record<string, unknown>): ArchitectureQualityScores {
    let scalability = 80;
    const db = proposal.database as { technology?: string } | undefined;
    if (db?.technology?.includes('PostgreSQL')) scalability += 10;
    if (proposal.architecturePattern && typeof proposal.architecturePattern === 'string' && proposal.architecturePattern.includes('Modular')) scalability += 5;
    scalability = Math.min(100, scalability);

    let security = 85;
    const auth = proposal.authentication as { strategy?: string } | undefined;
    if (auth?.strategy?.includes('JWT') || auth?.strategy?.includes('OAuth')) security += 10;
    security = Math.min(100, security);

    let maintainability = 85;
    const decisions = proposal.decisions as unknown[];
    if (Array.isArray(decisions) && decisions.length >= 2) maintainability += 10;
    maintainability = Math.min(100, maintainability);

    let complexity = 75; // 75 simplicity / manageable complexity
    const risks = proposal.risks as unknown[];
    if (Array.isArray(risks) && risks.length <= 2) complexity += 15;
    complexity = Math.min(100, complexity);

    const overall = Math.round(
      (scalability * 0.3) + (security * 0.3) + (maintainability * 0.25) + (complexity * 0.15)
    );

    return {
      scalability,
      security,
      maintainability,
      complexity,
      overall,
    };
  }
}
