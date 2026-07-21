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

function createProvider(name: AIProviderName): AIProviderAdapter {
  switch (name) {
    case 'openai':
      return new OpenAIProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'ollama':
      return new OllamaProvider();
    case 'gemini':
      return new GeminiProvider();
    case 'groq':
      return new GroqProvider();
    case 'openrouter':
      return new OpenRouterProvider();
    case 'together':
      return new TogetherProvider();
    case 'huggingface':
      return new HuggingFaceProvider();
    case 'deepseek':
      return new DeepSeekProvider();
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
