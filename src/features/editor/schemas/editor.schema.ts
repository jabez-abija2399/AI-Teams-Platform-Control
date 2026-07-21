import { z } from 'zod';

export const editorPreferencesSchema = z.object({
  fontSize: z.number().min(8).max(72).default(14),
  minimap: z.boolean().default(true),
  wordWrap: z.enum(['on', 'off', 'wordWrapColumn']).default('off'),
  lineNumbers: z.boolean().default(true),
  tabSize: z.number().min(1).max(8).default(2),
  theme: z.enum(['vs-dark', 'vs-light', 'hc-black']).default('vs-dark'),
});

export type EditorPreferencesInput = z.infer<typeof editorPreferencesSchema>;

export const saveFileContentSchema = z.object({
  fileId: z.string().min(1),
  content: z.string(),
});

export type SaveFileContentInput = z.infer<typeof saveFileContentSchema>;
