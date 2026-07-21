import { OpenAICompatProvider } from './openai-compat.base';

export class DeepSeekProvider extends OpenAICompatProvider {
  override readonly name = 'deepseek';

  constructor(options: { apiKey?: string; defaultModel?: string; timeout?: number } = {}) {
    super({
      apiKey: options.apiKey ?? process.env.DEEPSEEK_API_KEY,
      baseUrl: 'https://api.deepseek.com/v1',
      defaultModel: options.defaultModel ?? 'deepseek-v4-flash',
      timeout: options.timeout,
    });
  }
}
