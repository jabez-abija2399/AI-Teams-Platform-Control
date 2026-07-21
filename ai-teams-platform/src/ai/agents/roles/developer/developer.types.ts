import { z } from 'zod';

export const DEVELOPER_CAPABILITIES = ['CODING', 'DEBUGGING', 'IMPLEMENTATION'] as const;

export type ChangeType = 'CREATE' | 'MODIFY' | 'DELETE';

const smartString = z.union([z.string(), z.record(z.string(), z.unknown())]).transform((val) =>
  typeof val === 'string' ? val : JSON.stringify(val),
);

export const developmentPlanSchema = z.object({
  tasks: z.array(smartString).default([]),
  files: z.array(smartString).default([]),
  dependencies: z.array(smartString).default([]),
  implementationOrder: z.array(smartString).default([]),
});
export type DeveloperPlan = z.infer<typeof developmentPlanSchema>;

export const codeChangeSchema = z.object({
  file: smartString.default(''),
  changeType: smartString.default('MODIFY'),
  description: smartString.default(''),
  code: smartString.default(''),
});
export type CodeChange = z.infer<typeof codeChangeSchema>;

export const implementationReportSchema = z.object({
  completed: z.boolean().default(false),
  changedFiles: z.array(smartString).default([]),
  issues: z.array(smartString).default([]),
  notes: smartString.default(''),
});
export type ImplementationReport = z.infer<typeof implementationReportSchema>;

export const developerOutputSchema = z.object({
  plan: developmentPlanSchema,
  changes: z.array(codeChangeSchema),
  report: implementationReportSchema,
});
export type DeveloperOutput = z.infer<typeof developerOutputSchema>;
