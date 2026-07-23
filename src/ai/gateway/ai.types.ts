import { z } from 'zod';

export const AIProviderNameSchema = z.enum([
  'openai',
  'anthropic',
  'ollama',
  'gemini',
  'openai-compat',
  'groq',
  'openrouter',
  'together',
  'huggingface',
  'deepseek',
]);
export type AIProviderName = z.infer<typeof AIProviderNameSchema>;

export const AIMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});
export type AIMessage = z.infer<typeof AIMessageSchema>;

export const AIUsageSchema = z.object({
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  estimatedCostUsd: z.number().nonnegative().optional(),
});
export type AIUsage = z.infer<typeof AIUsageSchema>;

export const AIResponseSchema = z.object({
  content: z.string(),
  provider: z.string(),
  model: z.string(),
  usage: AIUsageSchema,
  latencyMs: z.number().int().nonnegative(),
});
export type AIResponse = z.infer<typeof AIResponseSchema>;

export const AIStreamChunkSchema = z.object({
  type: z.enum(['token', 'usage', 'done', 'error']),
  content: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  usage: AIUsageSchema.optional(),
});
export type AIStreamChunk = z.infer<typeof AIStreamChunkSchema>;

export const AIGenerateOptionsSchema = z.object({
  messages: z.array(AIMessageSchema).min(1),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  stream: z.boolean().optional(),
});
export type AIGenerateOptions = z.infer<typeof AIGenerateOptionsSchema>;

export const AIProviderConfigSchema = z.object({
  name: AIProviderNameSchema,
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
  defaultModel: z.string(),
  maxTokens: z.number().int().positive().default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
  enabled: z.boolean().default(true),
});
export type AIProviderConfig = z.infer<typeof AIProviderConfigSchema>;

export interface ModelRoute {
  provider: AIProviderName;
  model: string;
}

export interface AIProviderAdapter {
  readonly name: string;
  readonly isConfigured: boolean;
  generate(options: AIGenerateOptions): Promise<AIResponse>;
  stream(options: AIGenerateOptions): AsyncGenerator<AIStreamChunk, void, undefined>;
  isAvailable(): boolean;
}
