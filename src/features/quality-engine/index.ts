export type {
  TestCaseInfo,
  TestExecutionInfo,
  BugReportInfo,
  CoverageReportInfo,
  CoverageFile,
  CodeReviewInfo,
  CodeReviewIssue,
  QualityMetrics,
} from './types';

export {
  createTestCaseSchema,
  testCaseFilterSchema,
  createBugReportSchema,
  bugReportFilterSchema,
  updateBugStatusSchema,
  submitCodeReviewSchema,
} from './schemas/quality.schema';

export type {
  CreateTestCaseInput,
  TestCaseFilter,
  CreateBugReportInput,
  BugReportFilter,
  UpdateBugStatusInput,
  SubmitCodeReviewInput,
} from './schemas/quality.schema';

export {
  createTestCase,
  listTestCases,
  deleteTestCase,
  executeTest,
  getTestExecutions,
} from './services/test.service';

export {
  createBugReport,
  listBugReports,
  updateBugStatus,
  deleteBugReport,
} from './services/bug-report.service';

export {
  generateCoverageReport,
  getLatestCoverage,
  getCoverageHistory,
} from './services/coverage.service';

export {
  submitCodeReview,
  getCodeReview,
  getQualityMetrics,
} from './services/quality-score.service';

export { useTestCases, useCreateTestCase, useDeleteTestCase, useExecuteTest, useTestExecutions } from './hooks/use-test-cases';
export { useBugReports, useCreateBugReport, useUpdateBugStatus, useDeleteBugReport } from './hooks/use-bug-reports';
export { useLatestCoverage, useCoverageHistory, useGenerateCoverage } from './hooks/use-coverage';
export { useQualityMetrics } from './hooks/use-quality-metrics';

export { TestList } from './components/test-list';
export { BugReportList } from './components/bug-report-list';
export { CoverageChart } from './components/coverage-chart';
export { QualityDashboard } from './components/quality-dashboard';
export { QualityPanel } from './components/quality-panel';
