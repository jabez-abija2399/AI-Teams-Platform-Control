import { OpenAICompatProvider } from './openai-compat.base';

export class TogetherProvider extends OpenAICompatProvider {
  override readonly name = 'together';

  constructor(options: { apiKey?: string; defaultModel?: string; timeout?: number } = {}) {
    super({
      apiKey: options.apiKey ?? process.env.TOGETHER_API_KEY,
      baseUrl: 'https://api.together.xyz/v1',
      defaultModel: options.defaultModel ?? 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      timeout: options.timeout,
    });
  }
}
