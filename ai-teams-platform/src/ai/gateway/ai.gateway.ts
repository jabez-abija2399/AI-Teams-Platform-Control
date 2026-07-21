import type { AIGenerateOptions, AIResponse, AIStreamChunk, AIProviderName } from './ai.types';
import { getFirstAvailableProvider, getOrCreateProvider } from '../providers/provider.factory';
import { getAvailableProviders } from '../providers/provider.registry';
import { MAX_RETRIES } from './ai.constants';

function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /429|rate.?limit|too many request|500|502|503|service.?unavailable|timeout|etimedout|econnrefused|econnreset|network|fetch.*fail/i.test(msg);
}

function getRetryDelay(attempt: number): number {
  return 1000 * Math.pow(2, attempt);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const FALLBACK_CHAIN: AIProviderName[] = ['groq', 'deepseek', 'gemini', 'openrouter', 'anthropic', 'openai', 'ollama', 'together', 'huggingface'];

function buildProviderChain(preferred?: AIProviderName): Array<{ name: AIProviderName; provider: ReturnType<typeof getOrCreateProvider> }> {
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

export async function aiGenerate(
  options: AIGenerateOptions,
  providerName?: AIProviderName,
): Promise<AIResponse> {
  const chain = buildProviderChain(providerName);

  let lastError: Error | undefined;

  for (const { name, provider } of chain) {
    for (let attempt = 0; attempt <= Math.min(MAX_RETRIES, 1); attempt++) {
      try {
        const response = await provider.generate(options);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (!isRetryable(error)) break;

        if (attempt < MAX_RETRIES) {
          await sleep(getRetryDelay(attempt));
        }
      }
    }
  }

  throw lastError ?? new Error('AI generation failed across all providers');
}

export async function* aiStream(
  options: AIGenerateOptions,
  providerName?: AIProviderName,
): AsyncGenerator<AIStreamChunk, void, undefined> {
  const chain = buildProviderChain(providerName);

  for (const { name, provider } of chain) {
    try {
      yield* provider.stream(options);
      return;
    } catch (error) {
      if (chain.indexOf({ name, provider } as typeof chain[number]) === chain.length - 1) {
        throw error;
      }
    }
  }
}

export async function aiGenerateStructured<T>(
  options: AIGenerateOptions,
  schema: { parse: (data: unknown) => T },
  providerName?: AIProviderName,
): Promise<{ data: T; response: AIResponse }> {
  const response = await aiGenerate(options, providerName);

  try {
    const parsed = schema.parse(JSON.parse(response.content));
    return { data: parsed, response };
  } catch {
    const jsonMatch = response.content.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch?.[1]) {
      const parsed = schema.parse(JSON.parse(jsonMatch[1]));
      return { data: parsed, response };
    }
    throw new Error('Failed to parse AI response as structured data');
  }
}
