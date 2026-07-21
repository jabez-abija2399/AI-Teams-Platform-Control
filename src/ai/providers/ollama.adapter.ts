import { OpenAICompatProvider } from './openai-compat.base';

export class OllamaProvider extends OpenAICompatProvider {
  override readonly name = 'ollama';

  constructor(options: { baseUrl?: string; defaultModel?: string; timeout?: number } = {}) {
    super({
      baseUrl: options.baseUrl ?? process.env.OLLAMA_URL ?? 'http://localhost:11434/v1',
      defaultModel: options.defaultModel ?? 'llama3.1',
      timeout: options.timeout,
    });
  }

  override get isConfigured(): boolean {
    return true;
  }
}
