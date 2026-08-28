/**
 * @file ceo.types.ts
 * @package @ai-teams/agents/roles/ceo
 * @description Types for the Chief Executive Officer Agent.
 */

import type { BusinessStrategy } from '../../contracts/deliverable-schemas';

export interface CeoExecutionInput {
  projectId: string;
  projectName?: string;
  visionPrompt: string;
  targetMarket?: string;
}

export type CeoDeliverable = BusinessStrategy;
