import type { ModelRoute } from '@/ai/gateway/ai.types';
import { envModels } from '@/ai/agents/core/model-routes';

export interface AgentModelConfig {
  models: ModelRoute[];
  temperature: number;
  maxTokens: number;
}

export const ceoConfig: AgentModelConfig = {
  models: envModels('CEO'),
  temperature: 0.6,
  maxTokens: 4000,
};
