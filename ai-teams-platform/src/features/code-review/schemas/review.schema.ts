import { z } from 'zod';

export const reviewRequestSchema = z.object({
  projectId: z.string().min(1),
  files: z
    .array(
      z.object({
        name: z.string().min(1),
        content: z.string(),
      }),
    )
    .min(1, 'At least one file is required')
    .max(20, 'Maximum 20 files per review'),
});

export type ReviewRequestInput = z.infer<typeof reviewRequestSchema>;
