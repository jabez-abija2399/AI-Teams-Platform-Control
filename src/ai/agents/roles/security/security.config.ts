import type { AgentModelConfig } from '@/ai/agents/roles/ceo/ceo.config';
import { envModels } from '@/ai/agents/core/model-routes';

export const securityConfig: AgentModelConfig = {
  models: envModels('SECURITY'),
  maxTokens: 10000,
  temperature: 0.1,
};
