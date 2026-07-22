import { z } from 'zod';

export const codeAssistantSchema = z.object({
  projectId: z.string().min(1),
  message: z.string().min(1).max(10000),
  context: z
    .object({
      fileName: z.string().optional(),
      language: z.string().optional(),
      content: z.string().optional(),
      selectedText: z.string().optional(),
      cursorLine: z.number().optional(),
      cursorColumn: z.number().optional(),
    })
    .optional(),
  history: z
    .array(
      z.object({
        role: z.string(),
        content: z.string(),
      }),
    )
    .optional(),
});

export type CodeAssistantInput = z.infer<typeof codeAssistantSchema>;
