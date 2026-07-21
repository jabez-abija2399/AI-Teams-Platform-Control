import { OpenAICompatProvider } from './openai-compat.base';

export class OpenRouterProvider extends OpenAICompatProvider {
  override readonly name = 'openrouter';

  constructor(options: { apiKey?: string; defaultModel?: string; timeout?: number } = {}) {
    super({
      apiKey: options.apiKey ?? process.env.OPENROUTER_API_KEY,
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: options.defaultModel ?? 'anthropic/claude-sonnet-4-20250514',
      timeout: options.timeout,
    });
  }
}
