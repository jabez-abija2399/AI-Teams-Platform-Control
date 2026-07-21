import { z } from 'zod';

export const createEnvironmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  variables: z.record(z.string(), z.string()).optional(),
  configuration: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const updateEnvironmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  variables: z.record(z.string(), z.string()).optional(),
  configuration: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const createDeploymentSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  environmentId: z.string().min(1, 'Environment ID is required'),
  provider: z.string().min(1, 'Provider is required').max(100),
  steps: z.array(z.object({ name: z.string().min(1) })).min(1, 'At least one step is required'),
  releaseId: z.string().optional(),
});

export const createReleaseSchema = z.object({
  version: z.string().min(1, 'Version is required').max(50),
  commit: z.string().optional(),
});

export const deploymentStatusSchema = z.object({
  status: z.enum(['PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED']),
});

export const deploymentFilterSchema = z.object({
  environmentId: z.string().optional(),
  status: z.enum(['PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED']).optional(),
});

export type CreateEnvironmentInput = z.infer<typeof createEnvironmentSchema>;
export type UpdateEnvironmentInput = z.infer<typeof updateEnvironmentSchema>;
export type CreateDeploymentInput = z.infer<typeof createDeploymentSchema>;
export type CreateReleaseInput = z.infer<typeof createReleaseSchema>;
export type DeploymentStatus = z.infer<typeof deploymentStatusSchema>;
export type DeploymentFilter = z.infer<typeof deploymentFilterSchema>;
