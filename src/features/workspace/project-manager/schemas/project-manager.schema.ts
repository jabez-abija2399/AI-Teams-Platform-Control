import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  templateId: z.string().optional(),
});

export const renameProjectSchema = z.object({ name: z.string().min(2).max(100) });
export const duplicateProjectSchema = z.object({ newName: z.string().min(2).max(100) });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
