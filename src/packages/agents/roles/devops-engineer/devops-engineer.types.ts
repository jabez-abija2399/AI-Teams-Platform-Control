/**
 * @file devops-engineer.types.ts
 * @package @ai-teams/agents/roles/devops-engineer
 * @description Types for the Cloud & DevOps Engineer Agent.
 */

import { z } from 'zod';

export const DeploymentRecipeSchema = z.object({
  targetPlatform: z.enum(['VERCEL', 'DOCKER', 'FLY_IO', 'AWS']),
  dockerfile: z.string().optional(),
  ciWorkflowYaml: z.string().optional(),
  environmentVariablesRequired: z.array(z.string()),
  readyToDeploy: z.boolean(),
});
export type DeploymentRecipe = z.infer<typeof DeploymentRecipeSchema>;

export interface DevopsEngineerExecutionInput {
  projectId: string;
  projectName?: string;
  visionPrompt: string;
}
