import { z } from 'zod';

export const PRODUCT_MANAGER_CAPABILITIES = ['REQUIREMENTS_ANALYSIS', 'PLANNING', 'DOCUMENTATION'] as const;

const smartString = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())])
  .transform((val) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  });

export const refinedUserStorySchema = z.object({
  id: smartString.default('US-001'),
  title: smartString.default(''),
  asA: smartString.default(''),
  iWant: smartString.default(''),
  soThat: smartString.default(''),
  acceptanceCriteria: z.array(smartString).default([]),
  priority: smartString.default('MEDIUM'),
  estimatedEffort: smartString.default('MEDIUM'),
});

function coerceStringToUserStory(val: unknown): unknown {
  if (typeof val === 'string') {
    return { id: 'US-000', title: val, asA: 'user', iWant: val, soThat: 'it works', acceptanceCriteria: [], priority: 'MEDIUM', estimatedEffort: 'MEDIUM' };
  }
  return val;
}

export const featureSpecSchema = z.object({
  name: smartString.default(''),
  description: smartString.default(''),
  userStories: z.preprocess((val) => {
    if (Array.isArray(val)) return val.map(coerceStringToUserStory);
    return val;
  }, z.array(refinedUserStorySchema)).default([]),
  dependencies: z.array(smartString).default([]),
  technicalNotes: smartString.default(''),
});

export const nonFunctionalRequirementSchema = z.object({
  category: smartString.default(''),
  requirement: smartString.default(''),
  rationale: smartString.default(''),
});

export const refinedRequirementsSchema = z.object({
  userStories: z.preprocess((val) => {
    if (Array.isArray(val)) return val.map(coerceStringToUserStory);
    return val;
  }, z.array(refinedUserStorySchema)).default([]),
  featureSpecs: z.preprocess((val) => {
    if (Array.isArray(val)) return val.map((fs: unknown) => {
      const record = fs as Record<string, unknown>;
      if (fs && typeof fs === 'object' && 'userStories' in record && Array.isArray(record.userStories)) {
        return { ...record, userStories: (record.userStories as unknown[]).map(coerceStringToUserStory) };
      }
      return fs;
    });
    return val;
  }, z.array(featureSpecSchema)).default([]),
  nonFunctionalRequirements: z.array(nonFunctionalRequirementSchema).default([]),
  backlog: z.array(smartString).default([]),
  clarificationsNeeded: z.array(smartString).default([]),
});

export type RefinedRequirements = z.infer<typeof refinedRequirementsSchema>;
