import type { AIProviderName } from '../gateway/ai.types';
import { AI_MODELS } from '../gateway/ai.constants';

export interface ModelInfo {
  name: string;
  maxTokens: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  provider: AIProviderName;
}

export function getAvailableModels(): ModelInfo[] {
  const models: ModelInfo[] = [];

  for (const [provider, providerModels] of Object.entries(AI_MODELS)) {
    for (const model of Object.values(providerModels)) {
      models.push({
        ...model,
        provider: provider as AIProviderName,
      });
    }
  }

  return models;
}

export function getModelsForProvider(provider: AIProviderName): ModelInfo[] {
  const providerModels = AI_MODELS[provider as keyof typeof AI_MODELS];
  if (!providerModels) return [];

  return Object.values(providerModels).map((model) => ({
    ...model,
    provider,
  }));
}

export function getModelInfo(provider: AIProviderName, modelName: string): ModelInfo | undefined {
  const providerModels = AI_MODELS[provider as keyof typeof AI_MODELS];
  if (!providerModels) return undefined;

  const models = providerModels as Record<
    string,
    { name: string; maxTokens: number; costPer1kInput: number; costPer1kOutput: number }
  >;
  const model = models[modelName];
  if (!model) return undefined;

  return { ...model, provider };
}
