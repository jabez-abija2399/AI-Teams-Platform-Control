/**
 * @file architect.types.ts
 * @package @ai-teams/agents/roles/architect
 * @description Types for the System Architect Agent.
 */

import type { ArchitectureSpec, ProductRequirementsDoc } from '../../contracts/deliverable-schemas';

export interface ArchitectExecutionInput {
  projectId: string;
  projectName?: string;
  visionPrompt: string;
  prd?: ProductRequirementsDoc;
}

export type ArchitectDeliverable = ArchitectureSpec;
