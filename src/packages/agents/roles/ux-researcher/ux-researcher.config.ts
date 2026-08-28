import type { AgentModelConfig } from '@/packages/agents/roles/ceo/ceo.config';
import { envModels } from '@/packages/agents/core/model-routes';

export const uxResearcherConfig: AgentModelConfig = {
  models: envModels('UX_RESEARCHER'),
  maxTokens: 10000,
  temperature: 0.2,
};
