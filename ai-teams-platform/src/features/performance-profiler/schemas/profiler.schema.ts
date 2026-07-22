import { z } from 'zod';

export const analyzeProjectSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
});
