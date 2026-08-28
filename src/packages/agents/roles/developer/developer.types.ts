/**
 * @file developer.types.ts
 * @package @ai-teams/agents/roles/developer
 * @description Types and Zod schemas for the Developer Agent.
 */

import { z } from 'zod';
import type { ImplementationDeliverable, ArchitectureSpec, UIDesignSpec } from '../../contracts/deliverable-schemas';

export interface DeveloperExecutionInput {
  projectId: string;
  projectName?: string;
  visionPrompt: string;
  architectureSpec?: ArchitectureSpec;
  designSpec?: UIDesignSpec;
}

export type DeveloperDeliverable = ImplementationDeliverable;

export const DEVELOPER_CAPABILITIES = ['CODING', 'DEBUGGING', 'IMPLEMENTATION'] as const;
export type ChangeType = 'CREATE' | 'MODIFY' | 'DELETE';
export type TaskStatus = 'pending' | 'running' | 'done' | 'failed';
export type BuildEventType =
  | 'planning:analyzing'
  | 'planning:identifying'
  | 'planning:ordering'
  | 'planning:complete'
  | 'task:starting'
  | 'task:complete'
  | 'task:failed'
  | 'batch:starting'
  | 'batch:complete'
  | 'saving'
  | 'complete'
  | 'cancelled'
  | 'error';

const smartString = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())])
  .transform((val) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  });

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

export const qualityScoreSchema = z.object({
  completeness: z.number().min(1).max(10),
  typeSafety: z.number().min(1).max(10),
  errorHandling: z.number().min(1).max(10),
  consistency: z.number().min(1).max(10),
  overall: z.number().min(1).max(10),
  verdict: z.enum(['APPROVED', 'NEEDS_REVISION', 'REJECTED']),
  notes: z.string().optional(),
});
export type QualityScore = z.infer<typeof qualityScoreSchema>;

export const developerOutputSchema = z.object({
  plan: developmentPlanSchema,
  changes: z.array(codeChangeSchema),
  report: implementationReportSchema,
  qualityScore: qualityScoreSchema.optional(),
});
export type DeveloperOutput = z.infer<typeof developerOutputSchema>;

export interface TaskInfo {
  description: string;
  status: TaskStatus;
  fileCount?: number;
}

export interface BuildEvent {
  type: BuildEventType;
  phase: 'planning' | 'generating' | 'saving' | 'complete';
  message: string;
  completedTasks: number;
  totalTasks: number;
  activeTasks?: string[];
  tasks?: TaskInfo[];
  generatedFiles?: string[];
  error?: string;
  eta?: number;
}

export interface BuildState {
  controller: AbortController;
  progress: BuildEvent;
  tasks: TaskInfo[];
  generatedFiles: string[];
  startedAt: number;
}
