import { z } from 'zod';

export const createTestCaseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(['UNIT', 'INTEGRATION', 'E2E', 'SNAPSHOT', ' PERFORMANCE']).default('UNIT'),
  framework: z.string().min(1, 'Framework is required').max(100),
  file: z.string().min(1, 'File path is required'),
});

export const testCaseFilterSchema = z.object({
  status: z.enum(['PENDING', 'RUNNING', 'PASSED', 'FAILED', 'SKIPPED']).optional(),
  type: z.string().optional(),
  framework: z.string().optional(),
});

export const createBugReportSchema = z.object({
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().min(1, 'Description is required').max(5000),
  file: z.string().optional(),
  line: z.number().int().positive().optional(),
  solution: z.string().max(2000).optional(),
});

export const bugReportFilterSchema = z.object({
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
});

export const updateBugStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  solution: z.string().max(2000).optional(),
});

export const submitCodeReviewSchema = z.object({
  commitId: z.string().min(1, 'Commit ID is required'),
  score: z.number().min(0).max(100),
  issues: z.array(
    z.object({
      severity: z.enum(['critical', 'warning', 'info']),
      file: z.string(),
      line: z.number().int().positive().optional(),
      message: z.string(),
      suggestion: z.string().optional(),
    }),
  ),
  summary: z.string().max(2000).optional(),
});

export type CreateTestCaseInput = z.infer<typeof createTestCaseSchema>;
export type TestCaseFilter = z.infer<typeof testCaseFilterSchema>;
export type CreateBugReportInput = z.infer<typeof createBugReportSchema>;
export type BugReportFilter = z.infer<typeof bugReportFilterSchema>;
export type UpdateBugStatusInput = z.infer<typeof updateBugStatusSchema>;
export type SubmitCodeReviewInput = z.infer<typeof submitCodeReviewSchema>;
