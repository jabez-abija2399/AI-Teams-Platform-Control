import { z } from 'zod';

export const REVIEWER_CAPABILITIES = ['ANALYSIS', 'CODE_REVIEW'] as const;

const smartString = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())])
  .transform((val) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  });

export const reviewerIssueSchema = z.object({
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  category: smartString.default(''),
  description: smartString.default(''),
  location: smartString.optional(),
  suggestion: smartString.default(''),
});

export const reviewResultSchema = z.object({
  verdict: z.enum(['APPROVED', 'NEEDS_REVISION', 'REJECTED']),
  score: z.number().min(1).max(10),
  issues: z.array(reviewerIssueSchema).default([]),
  strengths: z.array(smartString).default([]),
  summary: smartString.default(''),
});

export type ReviewResult = z.infer<typeof reviewResultSchema>;
