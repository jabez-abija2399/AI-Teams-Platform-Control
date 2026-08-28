import type { AgentModelConfig } from '@/packages/agents/roles/ceo/ceo.config';
import { envModels } from '@/packages/agents/core/model-routes';

export const developerConfig: AgentModelConfig = {
  models: envModels('DEVELOPER'),
  temperature: 0.3,
  maxTokens: 4000,
};
