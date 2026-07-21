import type { AIProviderName } from '../gateway/ai.types';

export interface AIServiceConfig {
  providers: Partial<Record<AIProviderName, ProviderEnvConfig>>;
  defaultProvider: AIProviderName;
  defaultModel: string;
  timeout: number;
  maxRetries: number;
}

export interface ProviderEnvConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel: string;
  enabled: boolean;
}

function getProviderConfig(): AIServiceConfig {
  return {
    providers: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        defaultModel: 'gpt-4o',
        enabled: !!process.env.OPENAI_API_KEY,
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        defaultModel: 'claude-sonnet-4-20250514',
        enabled: !!process.env.ANTHROPIC_API_KEY,
      },
      gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        defaultModel: 'gemini-2.0-flash',
        enabled: !!process.env.GEMINI_API_KEY,
      },
      groq: {
        apiKey: process.env.GROQ_API_KEY,
        baseUrl: 'https://api.groq.com/openai/v1',
        defaultModel: 'llama-3.3-70b-versatile',
        enabled: !!process.env.GROQ_API_KEY,
      },
      openrouter: {
        apiKey: process.env.OPENROUTER_API_KEY,
        baseUrl: 'https://openrouter.ai/api/v1',
        defaultModel: 'anthropic/claude-sonnet-4-20250514',
        enabled: !!process.env.OPENROUTER_API_KEY,
      },
      together: {
        apiKey: process.env.TOGETHER_API_KEY,
        baseUrl: 'https://api.together.xyz/v1',
        defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        enabled: !!process.env.TOGETHER_API_KEY,
      },
      huggingface: {
        apiKey: process.env.HUGGINGFACE_API_KEY,
        baseUrl: 'https://api-inference.huggingface.co/v1',
        defaultModel: 'meta-llama/Llama-3.3-70B-Instruct',
        enabled: !!process.env.HUGGINGFACE_API_KEY,
      },
      ollama: {
        baseUrl: process.env.OLLAMA_URL ?? 'http://localhost:11434/v1',
        defaultModel: 'llama3.1',
        enabled: process.env.NODE_ENV === 'development',
      },
      'openai-compat': {
        apiKey: process.env.OPENAI_COMPAT_API_KEY,
        baseUrl: process.env.OPENAI_COMPAT_BASE_URL,
        defaultModel: process.env.OPENAI_COMPAT_MODEL ?? 'default',
        enabled: !!process.env.OPENAI_COMPAT_API_KEY && !!process.env.OPENAI_COMPAT_BASE_URL,
      },
      deepseek: {
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseUrl: 'https://api.deepseek.com/v1',
        defaultModel: 'deepseek-v4-flash',
        enabled: !!process.env.DEEPSEEK_API_KEY,
      },
    },
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o',
    timeout: 30_000,
    maxRetries: 2,
  };
}

let cachedConfig: AIServiceConfig | null = null;

export function getAIConfig(): AIServiceConfig {
  if (!cachedConfig) {
    cachedConfig = getProviderConfig();
  }
  return cachedConfig;
}

export function resetAIConfig(): void {
  cachedConfig = null;
}
