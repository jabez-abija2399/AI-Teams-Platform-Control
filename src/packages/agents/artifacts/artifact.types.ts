import { z } from 'zod';

export const ArtifactStatusSchema = z.enum([
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'REJECTED',
  'ARCHIVED',
]);
export type ArtifactStatus = z.infer<typeof ArtifactStatusSchema>;

export const ReviewerStatusSchema = z.object({
  reviewedBy: z.string(),
  verdict: z.enum(['APPROVED', 'NEEDS_REVISION', 'REJECTED']),
  score: z.number().min(1).max(10),
  reviewedAt: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
  notes: z.string().optional(),
});
export type ReviewerStatus = z.infer<typeof ReviewerStatusSchema>;

export const StructuredArtifactSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  type: z.string(),
  owner: z.string(), // e.g. "CEO AI", "Architect AI"
  version: z.number().int().positive().default(1),
  status: ArtifactStatusSchema.default('DRAFT'),
  createdAt: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
  updatedAt: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
  content: z.unknown(),
  reviewerStatus: ReviewerStatusSchema.optional(),
});
export type StructuredArtifact<T = unknown> = Omit<z.infer<typeof StructuredArtifactSchema>, 'content'> & {
  content: T;
};

export interface CreateArtifactInput<T = unknown> {
  projectId: string;
  title: string;
  type: string;
  owner: string;
  content: T;
  status?: ArtifactStatus;
}
