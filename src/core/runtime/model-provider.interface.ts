import type { AIModelResponse } from './runtime.types';

/**
 * Abstract interface for AI model providers.
 * Concrete implementations wrap OpenAI, Anthropic, or local model APIs.
 */
export interface AIModelProvider {
  readonly name: string;

  /**
   * Send a prompt and receive a complete response
   */
  generate(params: {
    model: string;
    systemPrompt: string;
    userPrompt: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<AIModelResponse>;

  /**
   * Estimate input tokens for a given text (approximate)
   */
  estimateTokens(text: string): number;
}
