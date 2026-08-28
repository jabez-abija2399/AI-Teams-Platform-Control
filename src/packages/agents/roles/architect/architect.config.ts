import type { AgentModelConfig } from '@/packages/agents/roles/ceo/ceo.config';
import { envModels } from '@/packages/agents/core/model-routes';

export const architectConfig: AgentModelConfig = {
  models: envModels('ARCHITECT'),
  temperature: 0.4,
  maxTokens: 4000,
};
