import type { AgentModelConfig } from '@/packages/agents/roles/ceo/ceo.config';
import { envModels } from '@/packages/agents/core/model-routes';

export const reviewerConfig: AgentModelConfig = {
  models: envModels('REVIEWER'),
  temperature: 0.3,
  maxTokens: 4096,
};
