import type { AgentModelConfig } from '@/ai/agents/roles/ceo/ceo.config';
import { envModels } from '@/ai/agents/core/model-routes';

export const frontendConfig: AgentModelConfig = {
  models: envModels('FRONTEND'),
  maxTokens: 10000,
  temperature: 0.1,
};
