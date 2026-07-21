import { z } from 'zod';

export const branchNameSchema = z
  .string()
  .min(1, 'Branch name is required')
  .max(100, 'Branch name must be at most 100 characters')
  .regex(
    /^[a-zA-Z0-9._\-\/]+$/,
    'Branch name can only contain letters, numbers, dots, hyphens, underscores, and slashes',
  )
  .refine((name) => !name.startsWith('.'), 'Branch name cannot start with a dot')
  .refine((name) => !name.endsWith('.'), 'Branch name cannot end with a dot')
  .refine((name) => !name.includes('..'), 'Branch name cannot contain consecutive dots')
  .refine((name) => !name.includes(' '), 'Branch name cannot contain spaces');

export const commitMessageSchema = z
  .string()
  .min(1, 'Commit message is required')
  .max(500, 'Commit message must be at most 500 characters');

export const branchTypeSchema = z.enum(['FEATURE', 'HOTFIX', 'RELEASE', 'BUGFIX', 'CUSTOM']);

export const fileChangeInputSchema = z.object({
  path: z.string().min(1, 'File path is required'),
  content: z.string(),
  changeType: z.enum(['CREATE', 'MODIFY', 'DELETE', 'RENAME']),
});

export const createCommitSchema = z.object({
  repositoryId: z.string().min(1, 'Repository ID is required'),
  branchId: z.string().min(1, 'Branch ID is required'),
  message: commitMessageSchema,
  author: z.string().min(1, 'Author is required'),
  files: z.array(fileChangeInputSchema).min(1, 'At least one file change is required'),
});

export const createBranchSchema = z.object({
  name: branchNameSchema,
  type: branchTypeSchema.default('FEATURE'),
});

export type BranchNameInput = z.infer<typeof branchNameSchema>;
export type CommitMessageInput = z.infer<typeof commitMessageSchema>;
export type BranchType = z.infer<typeof branchTypeSchema>;
export type FileChangeInput = z.infer<typeof fileChangeInputSchema>;
export type CreateCommitInput = z.infer<typeof createCommitSchema>;
export type CreateBranchInput = z.infer<typeof createBranchSchema>;
