import type {
  AIGenerateOptions,
  AIResponse,
  AIStreamChunk,
  AIProviderName,
  ModelRoute,
} from './ai.types';
import { getOrCreateProvider } from '../providers/provider.factory';
import { createProviderWithApiKey, getAvailableProviders } from '../providers/provider.registry';
import { MAX_RETRIES } from './ai.constants';
import { extractJson } from '@/ai/utils/extract-json';

export interface UserAiKeyOverride {
  provider: AIProviderName;
  apiKey: string;
  defaultModel?: string;
}

function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /429|rate.?limit|too many request|500|502|503|service.?unavailable|timeout|etimedout|econnrefused|econnreset|network|fetch.*fail/i.test(
    msg,
  );
}

function isModelNotFound(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /model_not_found|does not exist|not found|failed: 404/.test(msg);
}

function getRetryDelay(attempt: number): number {
  return 1000 * Math.pow(2, attempt);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const FALLBACK_CHAIN: AIProviderName[] = [
  'groq',
  'deepseek',
  'gemini',
  'openrouter',
  'anthropic',
  'openai',
  'ollama',
  'together',
  'huggingface',
];

function buildProviderChain(
  preferred?: AIProviderName,
): Array<{ name: AIProviderName; provider: ReturnType<typeof getOrCreateProvider> }> {
  const available = getAvailableProviders();
  if (available.length === 0) {
    throw new Error('No AI providers are configured. Please set at least one API key.');
  }

  const availableNames = new Set(available.map((p) => p.name as AIProviderName));
  const chain: AIProviderName[] = [];

  if (preferred && availableNames.has(preferred)) {
    chain.push(preferred);
  }

  for (const name of FALLBACK_CHAIN) {
    if (!chain.includes(name) && availableNames.has(name)) {
      chain.push(name);
    }
  }

  for (const p of available) {
    const name = p.name as AIProviderName;
    if (!chain.includes(name)) {
      chain.push(name);
    }
  }

  return chain.map((name) => ({ name, provider: getOrCreateProvider(name) }));
}

async function generateWithProvider(
  provider: { generate: (options: AIGenerateOptions) => Promise<AIResponse> },
  options: AIGenerateOptions,
): Promise<AIResponse> {
  let currentOptions = { ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await provider.generate(currentOptions);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (isModelNotFound(error)) {
        currentOptions = { ...currentOptions, model: undefined };
        attempt = -1;
        continue;
      }

      if (!isRetryable(error)) break;

      if (attempt < MAX_RETRIES - 1) {
        await sleep(getRetryDelay(attempt));
      }
    }
  }

  throw lastError ?? new Error('AI generation failed');
}

export async function aiGenerate(
  options: AIGenerateOptions,
  providerName?: AIProviderName,
  routes?: ModelRoute[],
  userKey?: UserAiKeyOverride | null,
): Promise<AIResponse> {
  if (userKey?.apiKey) {
    try {
      const userProvider = createProviderWithApiKey(
        userKey.provider,
        userKey.apiKey,
        userKey.defaultModel,
      );
      if (userProvider.isAvailable()) {
        return await generateWithProvider(userProvider, {
          ...options,
          model: userKey.defaultModel || options.model,
        });
      }
    } catch {
      // Fall through to platform / env providers
    }
  }

  if (routes && routes.length > 0) {
    return aiGenerateWithRoutes(options, routes);
  }

  return aiGenerateWithFallback(options, providerName);
}

async function aiGenerateWithRoutes(
  options: AIGenerateOptions,
  routes: ModelRoute[],
): Promise<AIResponse> {
  let lastError: Error | undefined;
  let currentOptions = { ...options };

  for (const { provider: routeProvider, model } of routes) {
    let provider;
    try {
      provider = getOrCreateProvider(routeProvider);
      if (!provider.isAvailable()) continue;
    } catch {
      continue;
    }

    currentOptions = { ...currentOptions, model };

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await provider.generate(currentOptions);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (isModelNotFound(error)) {
          currentOptions = { ...currentOptions, model: undefined };
          attempt = -1;
          continue;
        }

        if (!isRetryable(error)) break;

        if (attempt < MAX_RETRIES - 1) {
          await sleep(getRetryDelay(attempt));
        }
      }
    }
  }

  throw lastError ?? new Error('AI generation failed across all routes');
}

async function aiGenerateWithFallback(
  options: AIGenerateOptions,
  providerName?: AIProviderName,
): Promise<AIResponse> {
  const chain = buildProviderChain(providerName);

  let lastError: Error | undefined;
  let currentOptions = { ...options };

  for (const { name, provider } of chain) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await provider.generate(currentOptions);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const msg = lastError.message.toLowerCase();

        if (/model_not_found|does not exist|not found|failed: 404/.test(msg)) {
          currentOptions = { ...currentOptions, model: undefined };
          attempt = -1;
          continue;
        }

        if (!isRetryable(error)) break;

        if (attempt < MAX_RETRIES - 1) {
          await sleep(getRetryDelay(attempt));
        }
      }
    }

    if (providerName && name === providerName) continue;
  }

  throw lastError ?? new Error('AI generation failed across all providers');
}

export async function* aiStream(
  options: AIGenerateOptions,
  providerName?: AIProviderName,
  userKey?: UserAiKeyOverride | null,
): AsyncGenerator<AIStreamChunk, void, undefined> {
  if (userKey?.apiKey) {
    try {
      const userProvider = createProviderWithApiKey(
        userKey.provider,
        userKey.apiKey,
        userKey.defaultModel,
      );
      if (userProvider.isAvailable()) {
        yield* userProvider.stream({
          ...options,
          model: userKey.defaultModel || options.model,
        });
        return;
      }
    } catch {
      // Fall through
    }
  }

  const chain = buildProviderChain(providerName);

  for (const { name, provider } of chain) {
    try {
      yield* provider.stream(options);
      return;
    } catch (error) {
      if (
        chain.findIndex((p) => p.name === name && p.provider === provider) ===
        chain.length - 1
      ) {
        throw error;
      }
    }
  }
}

export async function aiGenerateStructured<T>(
  options: AIGenerateOptions,
  schema: { parse: (data: unknown) => T },
  providerName?: AIProviderName,
  userKey?: UserAiKeyOverride | null,
): Promise<{ data: T; response: AIResponse }> {
  const response = await aiGenerate(options, providerName, undefined, userKey);
  const parsed = schema.parse(extractJson(response.content));
  return { data: parsed as T, response };
}
