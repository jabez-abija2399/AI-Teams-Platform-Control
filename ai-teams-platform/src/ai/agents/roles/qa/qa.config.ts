import type { AgentModelConfig } from '@/ai/agents/roles/ceo/ceo.config';

export const qaConfig: AgentModelConfig = {
  preferredProvider:
    (process.env.QA_AI_PROVIDER as AgentModelConfig['preferredProvider']) ?? 'gemini',
  preferredModel: process.env.QA_AI_MODEL ?? 'gemini-2.0-flash',
  fallbackProvider: 'groq',
  fallbackModel: 'llama-3.3-70b-versatile',
  temperature: 0.2,
  maxTokens: 4000,
};
