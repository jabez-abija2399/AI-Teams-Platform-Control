import type { AgentModelConfig } from '@/ai/agents/roles/ceo/ceo.config';

export const developerConfig: AgentModelConfig = {
  preferredProvider:
    (process.env.DEVELOPER_AI_PROVIDER as AgentModelConfig['preferredProvider']) ?? 'groq',
  preferredModel: process.env.DEVELOPER_AI_MODEL ?? 'llama-3.3-70b-versatile',
  fallbackProvider: 'groq',
  fallbackModel: 'llama-3.3-70b-versatile',
  temperature: 0.3,
  maxTokens: 6000,
};
