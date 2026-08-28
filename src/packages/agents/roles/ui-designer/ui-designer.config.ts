import type { AgentModelConfig } from '@/packages/agents/roles/ceo/ceo.config';
import { envModels } from '@/packages/agents/core/model-routes';

export const uiDesignerConfig: AgentModelConfig = {
  models: envModels('UI_DESIGNER'),
  maxTokens: 10000,
  temperature: 0.3,
};
