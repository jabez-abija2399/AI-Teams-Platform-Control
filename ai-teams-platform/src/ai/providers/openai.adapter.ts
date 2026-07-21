import { OpenAICompatProvider } from './openai-compat.base';

export class OpenAIProvider extends OpenAICompatProvider {
  override readonly name = 'openai';

  constructor(options: { apiKey?: string; defaultModel?: string; timeout?: number } = {}) {
    super({
      apiKey: options.apiKey ?? process.env.OPENAI_API_KEY,
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: options.defaultModel ?? 'gpt-4o',
      timeout: options.timeout,
    });
  }
}
