import { z } from 'zod';

export const workflowNodeSchema = z.object({
  type: z.enum(['trigger', 'action', 'condition', 'ai_agent', 'deploy', 'webhook', 'output']),
  label: z.string().min(1, 'Label is required'),
  x: z.number(),
  y: z.number(),
  config: z.record(z.string(), z.unknown()).default({}),
});

export const workflowPipelineSchema = z.object({
  name: z.string().min(1, 'Pipeline name is required').max(100),
  description: z.string().max(500).optional(),
  nodes: z.array(workflowNodeSchema).min(1, 'At least one node required'),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    label: z.string().optional(),
  })),
});
