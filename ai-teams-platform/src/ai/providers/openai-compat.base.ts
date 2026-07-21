import { BaseProvider } from './provider.interface';
import type { AIGenerateOptions, AIResponse, AIStreamChunk } from '../gateway/ai.types';
import { ProviderRequestError } from '../errors/AIError';

export class OpenAICompatProvider extends BaseProvider {
  override readonly name: string = 'openai-compat';

  async generate(options: AIGenerateOptions): Promise<AIResponse> {
    const model = this.resolveModel(options.model);
    const startTime = Date.now();

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        stream: false,
      }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new ProviderRequestError(
        `OpenAI-compat request failed: ${response.status}`,
        this.name,
        response.status,
      );
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const latencyMs = Date.now() - startTime;
    const usage = data.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return {
      content: data.choices[0]?.message.content ?? '',
      provider: this.name,
      model,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
      latencyMs,
    };
  }

  async *stream(options: AIGenerateOptions): AsyncGenerator<AIStreamChunk, void, undefined> {
    const model = this.resolveModel(options.model);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        stream: true,
      }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new ProviderRequestError(
        `OpenAI-compat stream failed: ${response.status}`,
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
          if (data === '[DONE]') {
            yield { type: 'done' };
            return;
          }

          try {
            const parsed = JSON.parse(data) as {
              choices: Array<{ delta?: { content?: string } }>;
              usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
            };

            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              yield { type: 'token', content, provider: this.name, model };
            }

            if (parsed.usage) {
              yield {
                type: 'usage',
                provider: this.name,
                model,
                usage: {
                  promptTokens: parsed.usage.prompt_tokens,
                  completionTokens: parsed.usage.completion_tokens,
                  totalTokens: parsed.usage.total_tokens,
                },
              };
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
