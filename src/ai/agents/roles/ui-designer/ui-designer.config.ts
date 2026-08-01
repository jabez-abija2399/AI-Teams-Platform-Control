import type { AgentModelConfig } from '@/ai/agents/roles/ceo/ceo.config';
import { envModels } from '@/ai/agents/core/model-routes';

export const uiDesignerConfig: AgentModelConfig = {
  models: envModels('UI_DESIGNER'),
  maxTokens: 10000,
  temperature: 0.3,
};
