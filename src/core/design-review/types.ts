export interface DesignReviewReport {
  id: string;
  projectId: string;
  designScore: number;
  accessibilityScore: number;
  consistencyScore: number;
  uxScore: number;
  overallScore: number;
  evaluations: {
    category: string;
    score: number;
    feedback: string;
  }[];
  improvementSuggestions: string[];
  createdAt: string;
}
