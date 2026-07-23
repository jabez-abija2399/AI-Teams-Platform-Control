import type { AgentModelConfig } from '@/ai/agents/roles/ceo/ceo.config';
import { envModels } from '@/ai/agents/core/model-routes';

export const reviewerConfig: AgentModelConfig = {
  models: envModels('REVIEWER'),
  temperature: 0.3,
  maxTokens: 4096,
};
