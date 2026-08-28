/**
 * @file product-manager.types.ts
 * @package @ai-teams/agents/roles/product-manager
 * @description Types for the Product Manager Agent.
 */

import type { ProductRequirementsDoc, BusinessStrategy } from '../../contracts/deliverable-schemas';

export interface ProductManagerExecutionInput {
  projectId: string;
  projectName?: string;
  visionPrompt: string;
  strategy?: BusinessStrategy;
}

export type ProductManagerDeliverable = ProductRequirementsDoc;
