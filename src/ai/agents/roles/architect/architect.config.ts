import type { AgentModelConfig } from '@/ai/agents/roles/ceo/ceo.config';

export const architectConfig: AgentModelConfig = {
  preferredProvider:
    (process.env.ARCHITECT_AI_PROVIDER as AgentModelConfig['preferredProvider']) ?? 'groq',
  preferredModel: process.env.ARCHITECT_AI_MODEL ?? 'llama-3.3-70b-versatile',
  fallbackProvider: 'openrouter',
  fallbackModel: 'anthropic/claude-3.5-sonnet',
  temperature: 0.4,
  maxTokens: 4000,
};
