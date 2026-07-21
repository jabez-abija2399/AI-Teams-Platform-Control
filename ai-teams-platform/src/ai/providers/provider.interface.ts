import type {
  AIProviderAdapter,
  AIGenerateOptions,
  AIResponse,
  AIStreamChunk,
} from '../gateway/ai.types';

export interface BaseProviderOptions {
  apiKey?: string;
  baseUrl?: string;
  defaultModel: string;
  timeout?: number;
}

export abstract class BaseProvider implements AIProviderAdapter {
  abstract readonly name: string;
  protected apiKey?: string;
  protected baseUrl?: string;
  protected defaultModel: string;
  protected timeout: number;

  constructor(options: BaseProviderOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl;
    this.defaultModel = options.defaultModel;
    this.timeout = options.timeout ?? 30_000;
  }

  get isConfigured(): boolean {
    return !!this.apiKey || !!this.baseUrl;
  }

  abstract generate(options: AIGenerateOptions): Promise<AIResponse>;
  abstract stream(options: AIGenerateOptions): AsyncGenerator<AIStreamChunk, void, undefined>;

  isAvailable(): boolean {
    return this.isConfigured;
  }

  protected resolveModel(model?: string): string {
    return model ?? this.defaultModel;
  }

  protected estimateCost(
    promptTokens: number,
    completionTokens: number,
    costPer1kInput: number,
    costPer1kOutput: number,
  ): number {
    return (promptTokens / 1000) * costPer1kInput + (completionTokens / 1000) * costPer1kOutput;
  }
}
