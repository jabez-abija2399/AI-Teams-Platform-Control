import { BaseProvider } from './provider.interface';
import type { AIGenerateOptions, AIResponse, AIStreamChunk } from '../gateway/ai.types';
import { ProviderRequestError } from '../errors/AIError';

export class AnthropicProvider extends BaseProvider {
  readonly name = 'anthropic';

  constructor(options: { apiKey?: string; defaultModel?: string; timeout?: number } = {}) {
    super({
      apiKey: options.apiKey ?? process.env.ANTHROPIC_API_KEY,
      baseUrl: 'https://api.anthropic.com',
      defaultModel: options.defaultModel ?? 'claude-sonnet-4-20250514',
      timeout: options.timeout,
    });
  }

  async generate(options: AIGenerateOptions): Promise<AIResponse> {
    const model = this.resolveModel(options.model);
    const startTime = Date.now();

    const systemMsg = options.messages.find((m) => m.role === 'system');
    const nonSystem = options.messages.filter((m) => m.role !== 'system');

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
        system: systemMsg?.content,
        messages: nonSystem.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new ProviderRequestError(
        `Anthropic request failed: ${response.status}`,
        this.name,
        response.status,
      );
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
      usage: { input_tokens: number; output_tokens: number };
    };

    const latencyMs = Date.now() - startTime;

    return {
      content: data.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join(''),
      provider: this.name,
      model,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      latencyMs,
    };
  }

  async *stream(options: AIGenerateOptions): AsyncGenerator<AIStreamChunk, void, undefined> {
    const model = this.resolveModel(options.model);

    const systemMsg = options.messages.find((m) => m.role === 'system');
    const nonSystem = options.messages.filter((m) => m.role !== 'system');

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
        system: systemMsg?.content,
        messages: nonSystem.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        stream: true,
      }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new ProviderRequestError(
        `Anthropic stream failed: ${response.status}`,
        this.name,
        response.status,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          try {
            const parsed = JSON.parse(data) as {
              type: string;
              delta?: { text?: string };
              usage?: { input_tokens: number; output_tokens: number };
            };

            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield { type: 'token', content: parsed.delta.text, provider: this.name, model };
            }

            if (parsed.type === 'message_delta' && parsed.usage) {
              yield {
                type: 'usage',
                provider: this.name,
                model,
                usage: {
                  promptTokens: parsed.usage.input_tokens,
                  completionTokens: parsed.usage.output_tokens,
                  totalTokens: parsed.usage.input_tokens + parsed.usage.output_tokens,
                },
              };
            }

            if (parsed.type === 'message_stop') {
              yield { type: 'done' };
              return;
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { type: 'done' };
  }
}
