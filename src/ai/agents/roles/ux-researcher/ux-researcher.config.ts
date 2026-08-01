import type { AgentModelConfig } from '@/ai/agents/roles/ceo/ceo.config';
import { envModels } from '@/ai/agents/core/model-routes';

export const uxResearcherConfig: AgentModelConfig = {
  models: envModels('UX_RESEARCHER'),
  maxTokens: 10000,
  temperature: 0.2,
};
