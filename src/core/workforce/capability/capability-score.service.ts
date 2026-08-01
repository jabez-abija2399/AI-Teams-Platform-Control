import type { TaskRequirement, CapabilityScore } from './capability.types';
import { ROLE_CAPABILITIES } from './capability.constants';

export class CapabilityScoreService {
  /**
   * Calculates capability match scores across all roles for a task
   */
  public static calculateScores(task: TaskRequirement): CapabilityScore[] {
    const textToMatch = `${task.title} ${task.description} ${(task.domainKeywords || []).join(' ')}`.toLowerCase();

    return ROLE_CAPABILITIES.map((cap) => {
      let matchedCount = 0;
      for (const kw of cap.keywords) {
        if (textToMatch.includes(kw)) {
          matchedCount += 1;
        }
      }

      // Calculate score out of 100
      let matchScore = Math.min(100, Math.round((matchedCount / Math.max(1, cap.keywords.length)) * 100 * 2.5));
      if (textToMatch.includes(cap.role.toLowerCase())) {
        matchScore = Math.min(100, matchScore + 30);
      }

      const confidenceScore = Number((cap.baseConfidence * Math.max(0.4, matchScore / 100)).toFixed(2));
      const reason = matchedCount > 0
        ? `Matched ${matchedCount} keyword(s) in domain ${cap.domain}`
        : `Baseline evaluation for domain ${cap.domain}`;

      return {
        role: cap.role,
        matchScore,
        confidenceScore,
        reason,
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }
}
