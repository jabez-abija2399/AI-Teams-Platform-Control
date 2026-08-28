/**
 * @file product-manager.types.ts
 * @package @ai-teams/agents/roles/product-manager
 * @description Types and Zod schemas for the Product Manager Agent.
 */

import { z } from 'zod';
import type { ProductRequirementsDoc, BusinessStrategy } from '../../contracts/deliverable-schemas';

export interface ProductManagerExecutionInput {
  projectId: string;
  projectName?: string;
  visionPrompt: string;
  strategy?: BusinessStrategy;
}

export type ProductManagerDeliverable = ProductRequirementsDoc;

export const userStorySchema = z.object({
  id: z.string().default('US-001'),
  title: z.string().default('Core flow'),
  asA: z.string().default('user'),
  iWant: z.string().default('use the product'),
  soThat: z.string().default('I can achieve my goal'),
  acceptanceCriteria: z.array(z.string()).default([]),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW', 'CRITICAL']).default('HIGH'),
  estimatedEffort: z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']).default('MEDIUM'),
});

export const featureSpecSchema = z.object({
  name: z.string().default(''),
  description: z.string().default(''),
  userStories: z.array(userStorySchema).default([]),
  dependencies: z.array(z.string()).default([]),
  technicalNotes: z.string().default(''),
});

export const refinedRequirementsSchema = z.object({
  userStories: z.array(userStorySchema).default([]),
  featureSpecs: z.array(featureSpecSchema).default([]),
  nonFunctionalRequirements: z.array(z.object({ category: z.string(), requirement: z.string(), rationale: z.string().optional() })).default([]),
  backlog: z.array(z.string()).default([]),
  clarificationsNeeded: z.array(z.string()).default([]),
  edgeCases: z.array(z.string()).default([]),
  mvpFeatures: z.array(z.string()).default([]),
  deferredFeatures: z.array(z.string()).default([]),
  riskAnalysis: z.array(z.object({ risk: z.string(), mitigation: z.string() })).default([]),
});
export type RefinedRequirements = z.infer<typeof refinedRequirementsSchema>;

export const productRequirementSpecSchema = z.object({
  documentType: z.literal('SOFTWARE_REQUIREMENT_SPECIFICATION'),
  version: z.string().default('1.0.0'),
  authorRole: z.literal('PRODUCT_MANAGER'),
  confidenceScore: z.number().min(0).max(1).default(0.95),
  requirements: refinedRequirementsSchema,
});
export type ProductRequirementSpec = z.infer<typeof productRequirementSpecSchema>;
