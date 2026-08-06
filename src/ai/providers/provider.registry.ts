import type { AIProviderName, AIProviderAdapter } from '../gateway/ai.types';
import { ProviderNotFoundError } from '../errors/AIError';
import { OpenAIProvider } from './openai.adapter';
import { AnthropicProvider } from './anthropic.adapter';
import { OllamaProvider } from './ollama.adapter';
import { GeminiProvider } from './gemini.adapter';
import { GroqProvider } from './groq.adapter';
import { OpenRouterProvider } from './openrouter.adapter';
import { TogetherProvider } from './together.adapter';
import { HuggingFaceProvider } from './huggingface.adapter';
import { DeepSeekProvider } from './deepseek.adapter';

const providers = new Map<AIProviderName, AIProviderAdapter>();

function createProvider(name: AIProviderName, options?: { apiKey?: string; defaultModel?: string }): AIProviderAdapter {
  switch (name) {
    case 'openai':
      return new OpenAIProvider(options);
    case 'anthropic':
      return new AnthropicProvider(options);
    case 'ollama':
      return new OllamaProvider();
    case 'gemini':
      return new GeminiProvider(options);
    case 'groq':
      return new GroqProvider(options);
    case 'openrouter':
      return new OpenRouterProvider(options);
    case 'together':
      return new TogetherProvider(options);
    case 'huggingface':
      return new HuggingFaceProvider(options);
    case 'deepseek':
      return new DeepSeekProvider(options);
    default:
      throw new ProviderNotFoundError(name);
  }
}

export function getProvider(name: AIProviderName): AIProviderAdapter {
  let provider = providers.get(name);
  if (!provider) {
    provider = createProvider(name);
    providers.set(name, provider);
  }
  return provider;
}

/** Ephemeral provider with a user-supplied key — never cached into the shared env registry */
export function createProviderWithApiKey(
  name: AIProviderName,
  apiKey: string,
  defaultModel?: string,
): AIProviderAdapter {
  return createProvider(name, { apiKey, defaultModel });
}

export function getAvailableProviders(): AIProviderAdapter[] {
  const names: AIProviderName[] = [
    'openai',
    'anthropic',
    'ollama',
    'gemini',
    'groq',
    'openrouter',
    'together',
    'huggingface',
    'deepseek',
  ];
  return names.map((name) => getProvider(name)).filter((p) => p.isAvailable());
}

export function resetProviderCache(): void {
  providers.clear();
}
