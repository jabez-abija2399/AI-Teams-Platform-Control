import type { AIProviderName, AIProviderAdapter } from '../gateway/ai.types';
import { ProviderConfigError } from '../errors/AIError';
import { getProvider } from './provider.registry';

const providerCache = new Map<AIProviderName, AIProviderAdapter>();

export function getOrCreateProvider(name: AIProviderName): AIProviderAdapter {
  let provider = providerCache.get(name);
  if (provider) return provider;

  provider = getProvider(name);

  if (!provider.isAvailable()) {
    throw new ProviderConfigError(
      `Provider "${name}" is not configured or unavailable. Check your API keys.`,
      name,
    );
  }

  providerCache.set(name, provider);
  return provider;
}

export function getFirstAvailableProvider(): AIProviderAdapter {
  const names: AIProviderName[] = [
    'anthropic',
    'openai',
    'gemini',
    'groq',
    'deepseek',
    'ollama',
    'openrouter',
    'together',
    'huggingface',
  ];

  for (const name of names) {
    try {
      const provider = getProvider(name);
      if (provider.isAvailable()) return provider;
    } catch {
      continue;
    }
  }

  throw new ProviderConfigError(
    'No AI providers are configured. Please set at least one API key in your environment.',
    'none',
  );
}

export function resetFactoryCache(): void {
  providerCache.clear();
}
