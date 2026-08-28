import type { AgentModelConfig } from '@/packages/agents/roles/ceo/ceo.config';
import { envModels } from '@/packages/agents/core/model-routes';

export const productManagerConfig: AgentModelConfig = {
  models: envModels('PRODUCT_MANAGER'),
  temperature: 0.4,
  maxTokens: 4000,
};
