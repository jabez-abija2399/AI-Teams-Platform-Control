import { OpenAICompatProvider } from './openai-compat.base';

export class GroqProvider extends OpenAICompatProvider {
  override readonly name = 'groq';

  constructor(options: { apiKey?: string; defaultModel?: string; timeout?: number } = {}) {
    super({
      apiKey: options.apiKey ?? process.env.GROQ_API_KEY,
      baseUrl: 'https://api.groq.com/openai/v1',
      defaultModel: options.defaultModel ?? 'openai/gpt-oss-120b',
      timeout: options.timeout,
    });
  }
}
