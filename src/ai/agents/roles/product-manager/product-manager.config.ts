import type { AgentModelConfig } from '@/ai/agents/roles/ceo/ceo.config';
import { envModels } from '@/ai/agents/core/model-routes';

export const productManagerConfig: AgentModelConfig = {
  models: envModels('PRODUCT_MANAGER'),
  temperature: 0.4,
  maxTokens: 4000,
};
