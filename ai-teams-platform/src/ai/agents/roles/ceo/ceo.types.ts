import { z } from 'zod';

export const CEO_CAPABILITIES = ['PLANNING', 'ANALYSIS', 'DOCUMENTATION'] as const;

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Complexity = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

const smartString = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())])
  .transform((val) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  });

export const productVisionSchema = z.object({
  problem: smartString.default(''),
  solution: smartString.default(''),
  targetUsers: z.array(smartString).default([]),
  businessGoal: smartString.default(''),
});
export type ProductVision = z.infer<typeof productVisionSchema>;

export const userStorySchema = z.object({
  as: smartString.default('user'),
  iWant: smartString.default('a feature'),
  soThat: smartString.default('I can use it'),
  priority: smartString.default('MEDIUM'),
});

export const productRequirementSchema = z.object({
  features: z.array(z.object({ name: smartString, description: smartString })).default([]),
  userStories: z.array(userStorySchema).default([]),
  priorities: z.array(smartString).default([]),
  constraints: z.array(smartString).default([]),
});
export type ProductRequirement = z.infer<typeof productRequirementSchema>;

export const developmentPhaseSchema = z.object({
  name: smartString.default('Phase 1'),
  goal: smartString.default('Implement features'),
  tasks: z.array(smartString).default([]),
});

export const developmentPlanSchema = z.object({
  phases: z.array(developmentPhaseSchema).default([]),
  tasks: z.array(smartString).default([]),
  estimatedComplexity: smartString.default('MEDIUM'),
});
export type DevelopmentPlan = z.infer<typeof developmentPlanSchema>;

export const ceoAnalysisSchema = z.object({
  vision: productVisionSchema,
  requirements: productRequirementSchema,
  plan: developmentPlanSchema,
});
export type CEOAnalysis = z.infer<typeof ceoAnalysisSchema>;
