import type { TaskRequirement, CapabilityMatchResult } from './capability.types';
import type { CompanyRole } from '../types';
import { CapabilityScoreService } from './capability-score.service';

export class CapabilityMatcherService {
  /**
   * Matches task requirements to primary AI employee and supporting reviewer agent
   */
  public static matchTask(task: TaskRequirement): CapabilityMatchResult {
    const scores = CapabilityScoreService.calculateScores(task);

    const topScore = scores[0];
    const primaryRole = topScore && topScore.matchScore > 0 ? topScore.role : 'BACKEND_ENGINEER';
    const primaryScore = scores[0]?.matchScore || 50;
    const primaryConfidence = scores[0]?.confidenceScore || 0.8;

    let supportingReviewer: CompanyRole = 'QA_ENGINEER';
    if (primaryRole === 'DATABASE_ENGINEER' || primaryRole === 'BACKEND_ENGINEER') {
      supportingReviewer = 'SOFTWARE_ARCHITECT';
    } else if (primaryRole === 'FRONTEND_ENGINEER' || primaryRole === 'UI_ENGINEER') {
      supportingReviewer = 'QA_ENGINEER';
    } else if (primaryRole === 'SOFTWARE_ARCHITECT' || primaryRole === 'PRODUCT_MANAGER') {
      supportingReviewer = 'CEO';
    } else if (primaryRole === 'QA_ENGINEER') {
      supportingReviewer = 'SECURITY_ENGINEER';
    }

    return {
      primaryAgent: primaryRole,
      supportingReviewer,
      matchScore: primaryScore,
      confidenceScore: primaryConfidence,
      allScores: scores,
    };
  }
}
