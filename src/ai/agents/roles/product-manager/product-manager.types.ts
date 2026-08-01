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

export const personaSchema = z.object({
  id: smartString.default('PER-001'),
  name: smartString.default(''),
  role: smartString.default(''),
  goals: z.array(smartString).default([]),
  painPoints: z.array(smartString).default([]),
  behaviors: z.array(smartString).default([]),
});

export const functionalRequirementSchema = z.object({
  id: smartString.default('FR-001'),
  module: smartString.default(''),
  requirement: smartString.default(''),
  priority: smartString.default('MEDIUM'),
});

export const roadmapItemSchema = z.object({
  id: smartString.default('RDM-001'),
  phase: smartString.default('Phase 1'),
  title: smartString.default(''),
  description: smartString.default(''),
  targetTimeline: smartString.default('2 weeks'),
  deliverables: z.array(smartString).default([]),
});

export const releasePlanSchema = z.object({
  version: smartString.default('v1.0.0'),
  releaseDateTarget: smartString.default('TBD'),
  scope: smartString.default('MVP Release'),
  includedFeatures: z.array(smartString).default([]),
  rolloutStrategy: smartString.default('Gradual Rollout'),
});

export const productRequirementSpecSchema = z.object({
  prd: z.object({
    title: smartString.default(''),
    vision: smartString.default(''),
    targetAudience: smartString.default(''),
    problemStatement: smartString.default(''),
  }).default({ title: '', vision: '', targetAudience: '', problemStatement: '' }),
  personas: z.array(personaSchema).default([]),
  stories: z.array(refinedUserStorySchema).default([]),
  acceptanceCriteria: z.record(z.string(), z.array(smartString)).default({}),
  functionalRequirements: z.array(functionalRequirementSchema).default([]),
  nonFunctionalRequirements: z.array(nonFunctionalRequirementSchema).default([]),
  mvpScope: z.object({
    inScope: z.array(smartString).default([]),
    outOfScope: z.array(smartString).default([]),
    coreValueProposition: smartString.default(''),
  }).default({ inScope: [], outOfScope: [], coreValueProposition: '' }),
  featurePriorities: z.array(z.object({
    featureName: smartString.default(''),
    priority: smartString.default('MEDIUM'),
    effort: smartString.default('MEDIUM'),
    businessValue: smartString.default('MEDIUM'),
  })).default([]),
  roadmap: z.array(roadmapItemSchema).default([]),
  releasePlan: releasePlanSchema.default({
    version: 'v1.0.0',
    releaseDateTarget: 'TBD',
    scope: 'MVP Release',
    includedFeatures: [],
    rolloutStrategy: 'Gradual Rollout',
  }),
  dependencies: z.array(smartString).default([]),
  risks: z.array(z.object({
    risk: smartString.default(''),
    mitigation: smartString.default(''),
    severity: smartString.default('LOW'),
  })).default([]),
  status: smartString.default('APPROVED'),
});

export type ProductRequirementSpec = z.infer<typeof productRequirementSpecSchema>;

