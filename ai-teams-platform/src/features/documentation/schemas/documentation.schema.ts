import { z } from 'zod';

export const createDocumentSchema = z.object({
  type: z.string().min(1, 'Document type is required').max(50),
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().default(''),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).optional(),
  content: z.string().optional(),
});

export const createKnowledgeSchema = z.object({
  source: z.string().min(1, 'Source is required').max(200),
  content: z.string().min(1, 'Content is required').max(10000),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const recordDecisionSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  decision: z.string().min(1, 'Decision is required').max(500),
  reasoning: z.string().min(1, 'Reasoning is required').max(2000),
  outcome: z.string().min(1, 'Outcome is required').max(500),
  confidence: z.number().min(0).max(1),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type CreateKnowledgeInput = z.infer<typeof createKnowledgeSchema>;
export type RecordDecisionInput = z.infer<typeof recordDecisionSchema>;
