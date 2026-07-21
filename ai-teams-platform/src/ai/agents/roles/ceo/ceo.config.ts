import type { AIProviderName } from '@/ai/gateway/ai.types';

export interface AgentModelConfig {
  preferredProvider: AIProviderName;
  preferredModel: string;
  fallbackProvider: AIProviderName;
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
}

export const ceoConfig: AgentModelConfig = {
  preferredProvider: (process.env.CEO_AI_PROVIDER as AIProviderName) ?? 'anthropic',
  preferredModel: process.env.CEO_AI_MODEL ?? 'claude-sonnet-4-20250514',
  fallbackProvider: 'groq',
  fallbackModel: 'llama-3.3-70b-versatile',
  temperature: 0.6,
  maxTokens: 3000,
};
