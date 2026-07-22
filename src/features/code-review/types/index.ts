export interface ReviewIssue {
  file: string;
  line?: number;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  suggestion?: string;
}

export interface CodeReviewResult {
  score: number;
  summary: string;
  issues: ReviewIssue[];
  strengths: string[];
  filesReviewed: number;
}

export interface ReviewRequest {
  projectId: string;
  files: { name: string; content: string }[];
}
