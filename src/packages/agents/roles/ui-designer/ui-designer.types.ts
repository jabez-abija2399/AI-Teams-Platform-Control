/**
 * @file ui-designer.types.ts
 * @package @ai-teams/agents/roles/ui-designer
 * @description Types for the Lead UI/UX Designer Agent.
 */

import type { UIDesignSpec, ArchitectureSpec } from '../../contracts/deliverable-schemas';

export interface UIDesignerExecutionInput {
  projectId: string;
  projectName?: string;
  visionPrompt: string;
  architectureSpec?: ArchitectureSpec;
}

export type UIDesignerDeliverable = UIDesignSpec;
