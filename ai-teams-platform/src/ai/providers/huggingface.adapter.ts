import { OpenAICompatProvider } from './openai-compat.base';

export class HuggingFaceProvider extends OpenAICompatProvider {
  override readonly name = 'huggingface';

  constructor(options: { apiKey?: string; defaultModel?: string; timeout?: number } = {}) {
    super({
      apiKey: options.apiKey ?? process.env.HUGGINGFACE_API_KEY,
      baseUrl: 'https://api-inference.huggingface.co/v1',
      defaultModel: options.defaultModel ?? 'meta-llama/Llama-3.3-70B-Instruct',
      timeout: options.timeout,
    });
  }
}
