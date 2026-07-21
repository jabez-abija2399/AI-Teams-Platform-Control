export const AI_MODELS = {
  openai: {
    'gpt-4o': { name: 'gpt-4o', maxTokens: 128_000, costPer1kInput: 0.0025, costPer1kOutput: 0.01 },
    'gpt-4o-mini': {
      name: 'gpt-4o-mini',
      maxTokens: 128_000,
      costPer1kInput: 0.00015,
      costPer1kOutput: 0.0006,
    },
  },
  anthropic: {
    'claude-sonnet-4-20250514': {
      name: 'claude-sonnet-4-20250514',
      maxTokens: 200_000,
      costPer1kInput: 0.003,
      costPer1kOutput: 0.015,
    },
    'claude-3-5-haiku-20241022': {
      name: 'claude-3-5-haiku-20241022',
      maxTokens: 200_000,
      costPer1kInput: 0.001,
      costPer1kOutput: 0.005,
    },
  },
  gemini: {
    'gemini-2.0-flash': {
      name: 'gemini-2.0-flash',
      maxTokens: 1_048_576,
      costPer1kInput: 0.0001,
      costPer1kOutput: 0.0004,
    },
    'gemini-1.5-pro': {
      name: 'gemini-1.5-pro',
      maxTokens: 2_097_152,
      costPer1kInput: 0.00125,
      costPer1kOutput: 0.005,
    },
  },
  groq: {
    'llama-3.3-70b-versatile': {
      name: 'llama-3.3-70b-versatile',
      maxTokens: 128_000,
      costPer1kInput: 0,
      costPer1kOutput: 0,
    },
  },
  ollama: {
    'llama3.1': { name: 'llama3.1', maxTokens: 128_000, costPer1kInput: 0, costPer1kOutput: 0 },
  },
  openrouter: {
    'anthropic/claude-sonnet-4-20250514': {
      name: 'anthropic/claude-sonnet-4-20250514',
      maxTokens: 200_000,
      costPer1kInput: 0.003,
      costPer1kOutput: 0.015,
    },
  },
  together: {
    'meta-llama/Llama-3.3-70B-Instruct-Turbo': {
      name: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      maxTokens: 128_000,
      costPer1kInput: 0.0009,
      costPer1kOutput: 0.0009,
    },
  },
  huggingface: {
    'meta-llama/Llama-3.3-70B-Instruct': {
      name: 'meta-llama/Llama-3.3-70B-Instruct',
      maxTokens: 128_000,
      costPer1kInput: 0,
      costPer1kOutput: 0,
    },
  },
  'openai-compat': {},
} as const;

export const DEFAULT_PROVIDER = 'openai' as const;

export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1000;
export const PROVIDER_TIMEOUT_MS = 30_000;
