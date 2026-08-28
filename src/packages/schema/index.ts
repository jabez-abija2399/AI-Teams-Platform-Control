import { z } from 'zod';

// We define exact allowed literals to match our UI types.
const AgentRoleEnum = z.enum([
  'PRODUCT_MANAGER',
  'ARCHITECT',
  'UI_DESIGNER',
  'DEVELOPER'
]);

const StepStatusEnum = z.enum([
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'PAUSED'
]);

const WorkflowStatusEnum = z.enum([
  'HEALTHY',
  'DEGRADED',
  'FAILED',
  'PAUSED',
  'COMPLETED',
  'IDLE'
]);

// Define the exact shape of a single step in the pipeline.
export const PipelineStepSchema = z.object({
  name: z.string(),
  status: StepStatusEnum,
  agentRole: AgentRoleEnum,
});

// Export the inferred TypeScript type so our frontend components can use it directly.
export type PipelineStep = z.infer<typeof PipelineStepSchema>;

// Define the exact shape of the overall workflow progress payload.
export const WorkflowProgressSchema = z.object({
  workflowId: z.string(),
  status: WorkflowStatusEnum,
  currentStep: z.number().int().min(0),
  totalSteps: z.number().int().min(1),
  percentComplete: z.number().min(0).max(100),
  steps: z.array(PipelineStepSchema),
});

export type WorkflowProgress = z.infer<typeof WorkflowProgressSchema>;

// Define the API Response Wrapper schema.
export const ApiResponseSchema = z.object({
  workflows: z.array(WorkflowProgressSchema),
});

export type ApiResponse = z.infer<typeof ApiResponseSchema>;
