/**
 * @file developer.types.ts
 * @package @ai-teams/agents/roles/developer
 * @description Types for the Lead Fullstack Developer Agent.
 */

import type { ImplementationDeliverable, ArchitectureSpec, UIDesignSpec } from '../../contracts/deliverable-schemas';

export interface DeveloperExecutionInput {
  projectId: string;
  projectName?: string;
  visionPrompt: string;
  architectureSpec?: ArchitectureSpec;
  designSpec?: UIDesignSpec;
}

export type DeveloperDeliverable = ImplementationDeliverable;
