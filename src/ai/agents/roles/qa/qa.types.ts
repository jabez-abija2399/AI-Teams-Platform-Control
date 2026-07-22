import { z } from 'zod';

export const QA_CAPABILITIES = ['TESTING', 'ANALYSIS'] as const;

export type TestType = 'UNIT' | 'INTEGRATION' | 'E2E';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const smartString = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())])
  .transform((val) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  });

export const testCaseSchema = z.object({
  name: smartString.default('Test case'),
  type: smartString.default('UNIT'),
  steps: z.array(smartString).default([]),
});

export const testPlanSchema = z.object({
  tests: z.array(testCaseSchema).default([]),
  coverage: smartString.default(''),
  strategy: smartString.default(''),
});
export type TestPlan = z.infer<typeof testPlanSchema>;

export const bugReportSchema = z.object({
  severity: smartString.default('MEDIUM'),
  description: smartString.default(''),
  location: smartString.default(''),
  solution: smartString.default(''),
});
export type BugReport = z.infer<typeof bugReportSchema>;

export const qualityReportSchema = z.object({
  score: z.number().default(0),
  issues: z.array(bugReportSchema).default([]),
  recommendations: z.array(smartString).default([]),
});
export type QualityReport = z.infer<typeof qualityReportSchema>;

export const qaOutputSchema = z.object({
  testPlan: testPlanSchema,
  qualityReport: qualityReportSchema,
});
export type QAOutput = z.infer<typeof qaOutputSchema>;
