export class AIError extends Error {
  public readonly code: string;
  public readonly provider?: string;

  constructor(message: string, code: string, provider?: string) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.provider = provider;
  }
}

export class ProviderNotFoundError extends AIError {
  constructor(provider: string) {
    super(`Provider "${provider}" not found`, 'PROVIDER_NOT_FOUND', provider);
    this.name = 'ProviderNotFoundError';
  }
}

export class ProviderRequestError extends AIError {
  public readonly statusCode?: number;

  constructor(message: string, provider: string, statusCode?: number) {
    super(message, 'PROVIDER_REQUEST_ERROR', provider);
    this.name = 'ProviderRequestError';
    this.statusCode = statusCode;
  }
}

export class ProviderConfigError extends AIError {
  constructor(message: string, provider: string) {
    super(message, 'PROVIDER_CONFIG_ERROR', provider);
    this.name = 'ProviderConfigError';
  }
}

export class RateLimitError extends AIError {
  public readonly retryAfterMs?: number;

  constructor(provider: string, retryAfterMs?: number) {
    super(`Rate limited by ${provider}`, 'RATE_LIMIT_ERROR', provider);
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

export class TokenLimitError extends AIError {
  public readonly maxTokens: number;

  constructor(provider: string, model: string, maxTokens: number) {
    super(
      `Token limit exceeded for ${model} on ${provider} (max: ${maxTokens})`,
      'TOKEN_LIMIT_ERROR',
      provider,
    );
    this.name = 'TokenLimitError';
    this.maxTokens = maxTokens;
  }
}
