import type { AgentModelConfig } from '@/ai/agents/roles/ceo/ceo.config';

export const architectConfig: AgentModelConfig = {
  preferredProvider:
    (process.env.ARCHITECT_AI_PROVIDER as AgentModelConfig['preferredProvider']) ?? 'anthropic',
  preferredModel: process.env.ARCHITECT_AI_MODEL ?? 'claude-sonnet-4-20250514',
  fallbackProvider: 'openrouter',
  fallbackModel: 'anthropic/claude-3.5-sonnet',
  temperature: 0.4,
  maxTokens: 4000,
};
