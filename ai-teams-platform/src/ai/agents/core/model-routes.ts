import type { AIProviderName, ModelRoute } from '@/ai/gateway/ai.types';

export const DEFAULT_MODELS: ModelRoute[] = [
  { provider: 'gemini' as AIProviderName, model: 'gemini-2.5-flash' },
  { provider: 'gemini' as AIProviderName, model: 'gemini-3.5-flash-lite' },
  { provider: 'gemini' as AIProviderName, model: 'gemini-3.6-flash' },
  { provider: 'openrouter' as AIProviderName, model: 'openai/gpt-4o-mini' },
  { provider: 'groq' as AIProviderName, model: 'llama-3.3-70b-versatile' },
  { provider: 'gemini' as AIProviderName, model: 'gemini-2.0-flash' },
];

export function envModels(prefix: string): ModelRoute[] {
  const provider = process.env[`${prefix}_AI_PROVIDER`] as AIProviderName | undefined;
  const model = process.env[`${prefix}_AI_MODEL`] as string | undefined;
  if (provider && model) {
    const envRoute: ModelRoute = { provider, model };
    const uniqueDefaults = DEFAULT_MODELS.filter(
      (r) => !(r.provider === provider && r.model === model),
    );
    return [envRoute, ...uniqueDefaults];
  }
  if (provider) {
    const firstModel = DEFAULT_MODELS[0]?.model ?? 'gemini-2.5-flash';
    const envRoute: ModelRoute = { provider, model: firstModel };
    const uniqueDefaults = DEFAULT_MODELS.filter(
      (r) => !(r.provider === provider && r.model === envRoute.model),
    );
    return [envRoute, ...uniqueDefaults];
  }
  return [...DEFAULT_MODELS];
}
