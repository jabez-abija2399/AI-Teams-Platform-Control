import { z } from 'zod';

const smartString = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())])
  .transform((val) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  });

export const testCaseSchema = z.object({
  id: smartString.default('TC-01'),
  title: smartString.default(''),
  type: z.enum(['unit', 'integration', 'e2e', 'performance', 'security', 'accessibility']).default('unit'),
  steps: z.array(smartString).default([]),
  expectedResult: smartString.default(''),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
});

export const bugReportSchema = z.object({
  id: smartString.default('BUG-01'),
  title: smartString.default(''),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  description: smartString.default(''),
  location: smartString.default(''),
  reproductionSteps: z.array(smartString).default([]),
  suggestedSolution: smartString.default(''),
  solution: smartString.default(''),
}).transform((val) => ({
  ...val,
  solution: val.solution || val.suggestedSolution || '',
  suggestedSolution: val.suggestedSolution || val.solution || '',
}));

export type BugReport = z.output<typeof bugReportSchema>;

export const testPlanSchema = z.object({
  tests: z.array(z.object({
    name: smartString.default(''),
    type: smartString.default('UNIT'),
    steps: z.array(smartString).default([]),
  })).default([]),
  coverage: smartString.default('85%'),
  strategy: smartString.default('Comprehensive testing'),
});

export type TestPlan = z.output<typeof testPlanSchema>;

export const testSuiteSchema = z.object({
  name: smartString.default(''),
  testCount: z.number().default(0),
  targetModule: smartString.default(''),
});

export const coverageAnalysisSchema = z.object({
  estimatedCoverage: z.number().default(85),
  uncoveredAreas: z.array(smartString).default([]),
  highRiskModules: z.array(smartString).default([]),
}).default({ estimatedCoverage: 85, uncoveredAreas: [], highRiskModules: [] });

export const riskMatrixItemSchema = z.object({
  risk: smartString.default(''),
  impact: smartString.default('High'),
  likelihood: smartString.default('Low'),
  mitigation: smartString.default(''),
});

export const qualityReportSummarySchema = z.object({
  score: z.number().default(85),
  verdict: z.enum(['APPROVED', 'NEEDS_REVISION', 'REJECTED']).default('APPROVED'),
  summary: smartString.default(''),
  recommendations: z.array(smartString).default([]),
  issues: z.array(bugReportSchema).default([]),
}).default({ score: 85, verdict: 'APPROVED', summary: '', recommendations: [], issues: [] });

export type QualityReport = z.output<typeof qualityReportSummarySchema>;

export const qaReportSpecSchema = z.object({
  unitTests: z.array(testCaseSchema).default([]),
  integrationTests: z.array(testCaseSchema).default([]),
  e2eTests: z.array(testCaseSchema).default([]),
  regressionPlan: z.array(smartString).default(['Verify core user login', 'Verify critical API workflows']),
  coverageAnalysis: coverageAnalysisSchema,
  riskMatrix: z.array(riskMatrixItemSchema).default([]),
  bugReports: z.array(bugReportSchema).default([]),
  testSuites: z.array(testSuiteSchema).default([]),
  performanceTests: z.array(testCaseSchema).default([]),
  accessibilityTests: z.array(testCaseSchema).default([]),
  securityTests: z.array(testCaseSchema).default([]),
  qualityReport: qualityReportSummarySchema,
  testPlan: testPlanSchema.optional(),
  status: smartString.default('APPROVED'),
}).transform((val) => {
  const allTests = [
    ...val.unitTests,
    ...val.integrationTests,
    ...val.e2eTests,
  ].map((t) => ({
    name: t.title || t.id || 'Test case',
    type: t.type?.toUpperCase() || 'UNIT',
    steps: t.steps || [],
  }));
  const tp = val.testPlan || {
    tests: allTests,
    coverage: `${val.coverageAnalysis?.estimatedCoverage ?? 85}%`,
    strategy: 'Comprehensive unit, integration, and e2e testing',
  };
  const issues = val.qualityReport?.issues?.length ? val.qualityReport.issues : val.bugReports;
  return {
    ...val,
    testPlan: tp,
    qualityReport: {
      ...val.qualityReport,
      issues,
    },
  };
});

export type QaReportSpec = z.output<typeof qaReportSpecSchema>;
export type QAOutput = QaReportSpec;
