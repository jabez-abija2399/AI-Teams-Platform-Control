import type { AgentModelConfig } from '@/packages/agents/roles/ceo/ceo.config';
import { envModels } from '@/packages/agents/core/model-routes';

export const securityConfig: AgentModelConfig = {
  models: envModels('SECURITY'),
  maxTokens: 10000,
  temperature: 0.1,
};
