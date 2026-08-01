import type { ProductProposal } from './product-proposal.engine';

export interface ProposalScore {
  clarity: number;
  features: number;
  feasibility: number;
  overall: number;
}

export class ProposalScoreService {
  /**
   * Calculates clarity, features, feasibility, and overall quality scores for a ProductProposal
   */
  public static calculateScore(proposal: ProductProposal): ProposalScore {
    let clarity = 70;
    if (proposal.vision && proposal.vision.length > 20) clarity += 15;
    if (proposal.problem && proposal.problem.length > 15) clarity += 15;
    clarity = Math.min(100, clarity);

    let features = 60;
    if (proposal.mvpFeatures && proposal.mvpFeatures.length >= 3) features += 25;
    if (proposal.futureFeatures && proposal.futureFeatures.length >= 2) features += 15;
    features = Math.min(100, features);

    let feasibility = 80;
    if (proposal.complexity === 'MVP') feasibility += 15;
    else if (proposal.complexity === 'MODERATE') feasibility += 10;
    if (proposal.aiTeam && proposal.aiTeam.length >= 4) feasibility += 5;
    feasibility = Math.min(100, feasibility);

    const overall = Math.round((clarity * 0.35) + (features * 0.35) + (feasibility * 0.30));

    return {
      clarity,
      features,
      feasibility,
      overall,
    };
  }
}
