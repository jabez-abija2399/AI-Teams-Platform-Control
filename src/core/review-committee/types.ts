export type ReviewerRole =
  | 'SENIOR_ENGINEER'
  | 'ARCHITECT'
  | 'SECURITY'
  | 'PERFORMANCE'
  | 'ACCESSIBILITY'
  | 'QA'
  | 'DEVOPS';

export interface IndividualReviewResult {
  reviewerRole: ReviewerRole;
  score: number; // 0 - 100
  approved: boolean;
  comments: string[];
  requiredChanges: string[];
}

export interface ReviewCommitteeReport {
  id: string;
  projectId: string;
  overallScore: number;
  isApproved: boolean;
  decision: 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';
  individualReviews: IndividualReviewResult[];
  summaryRecommendations: string[];
  requiredActionItems: string[];
  createdAt: string;
}
