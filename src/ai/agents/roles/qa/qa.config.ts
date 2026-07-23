import type { AgentModelConfig } from '@/ai/agents/roles/ceo/ceo.config';
import { envModels } from '@/ai/agents/core/model-routes';

export const qaConfig: AgentModelConfig = {
  models: envModels('QA'),
  temperature: 0.2,
  maxTokens: 4096,
};
