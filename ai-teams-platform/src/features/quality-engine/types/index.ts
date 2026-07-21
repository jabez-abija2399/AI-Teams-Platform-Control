export interface TestCaseInfo {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  type: string;
  framework: string;
  file: string;
  status: string;
  executionCount: number;
  lastResult: string | null;
}

export interface TestExecutionInfo {
  id: string;
  testId: string;
  result: string;
  logs: string;
  duration: number;
  createdAt: Date;
}

export interface BugReportInfo {
  id: string;
  projectId: string;
  severity: string;
  title: string;
  description: string;
  file: string | null;
  line: number | null;
  solution: string | null;
  status: string;
  createdAt: Date;
}

export interface CoverageReportInfo {
  id: string;
  projectId: string;
  percentage: number;
  files: CoverageFile[];
  createdAt: Date;
}

export interface CoverageFile {
  path: string;
  covered: number;
  total: number;
  percentage: number;
}

export interface CodeReviewInfo {
  id: string;
  commitId: string;
  score: number;
  issues: CodeReviewIssue[];
  summary: string;
  reviewedAt: Date;
}

export interface CodeReviewIssue {
  severity: 'critical' | 'warning' | 'info';
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
}

export interface QualityMetrics {
  totalTests: number;
  passingTests: number;
  failingTests: number;
  skippedTests: number;
  coverage: number;
  openBugs: number;
  criticalBugs: number;
  avgTestDuration: number;
}
