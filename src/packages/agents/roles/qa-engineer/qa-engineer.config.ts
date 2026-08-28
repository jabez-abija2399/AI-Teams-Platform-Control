import type { AgentModelConfig } from '@/packages/agents/roles/ceo/ceo.config';
import { envModels } from '@/packages/agents/core/model-routes';

export const qaConfig: AgentModelConfig = {
  models: envModels('QA'),
  maxTokens: 10000,
  temperature: 0.1,
};
