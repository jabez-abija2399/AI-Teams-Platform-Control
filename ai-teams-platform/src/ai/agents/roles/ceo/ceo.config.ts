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
  preferredProvider: (process.env.CEO_AI_PROVIDER as AIProviderName) ?? 'groq',
  preferredModel: process.env.CEO_AI_MODEL ?? 'llama-3.3-70b-versatile',
  fallbackProvider: 'groq',
  fallbackModel: 'llama-3.3-70b-versatile',
  temperature: 0.6,
  maxTokens: 3000,
};
