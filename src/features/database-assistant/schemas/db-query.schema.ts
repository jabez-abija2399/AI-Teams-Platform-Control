import { z } from 'zod';

export const dbQuerySchema = z.object({
  projectId: z.string().min(1),
  question: z.string().min(1).max(2000),
});

export type DBQueryInput = z.infer<typeof dbQuerySchema>;
