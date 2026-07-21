import { BaseProvider } from './provider.interface';
import type { AIGenerateOptions, AIResponse, AIStreamChunk } from '../gateway/ai.types';
import { ProviderRequestError } from '../errors/AIError';

export class GeminiProvider extends BaseProvider {
  readonly name = 'gemini';

  constructor(options: { apiKey?: string; defaultModel?: string; timeout?: number } = {}) {
    super({
      apiKey: options.apiKey ?? process.env.GEMINI_API_KEY,
      baseUrl: 'https://generativelanguage.googleapis.com',
      defaultModel: options.defaultModel ?? 'gemini-3.5-flash',
      timeout: options.timeout,
    });
  }

  async generate(options: AIGenerateOptions): Promise<AIResponse> {
    const model = this.resolveModel(options.model);
    const startTime = Date.now();

    const contents = options.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const systemMsg = options.messages.find((m) => m.role === 'system');

    const response = await fetch(
      `${this.baseUrl}/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          ...(systemMsg
            ? {
                systemInstruction: {
                  parts: [{ text: systemMsg.content }],
                },
              }
            : {}),
          generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxTokens ?? 4096,
          },
        }),
        signal: AbortSignal.timeout(this.timeout),
      },
    );

    if (!response.ok) {
      throw new ProviderRequestError(
        `Gemini request failed: ${response.status}`,
        this.name,
        response.status,
      );
    }

    const data = (await response.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
      };
    };

    const latencyMs = Date.now() - startTime;
    const usage = data.usageMetadata ?? {
      promptTokenCount: 0,
      candidatesTokenCount: 0,
      totalTokenCount: 0,
    };

    return {
      content: data.candidates[0]?.content.parts.map((p) => p.text).join('') ?? '',
      provider: this.name,
      model,
      usage: {
        promptTokens: usage.promptTokenCount,
        completionTokens: usage.candidatesTokenCount,
        totalTokens: usage.totalTokenCount,
      },
      latencyMs,
    };
  }

  async *stream(options: AIGenerateOptions): AsyncGenerator<AIStreamChunk, void, undefined> {
    const model = this.resolveModel(options.model);

    const contents = options.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const systemMsg = options.messages.find((m) => m.role === 'system');

    const response = await fetch(
      `${this.baseUrl}/v1beta/models/${model}:streamGenerateContent?key=${this.apiKey}&alt=sse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          ...(systemMsg ? { systemInstruction: { parts: [{ text: systemMsg.content }] } } : {}),
          generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxTokens ?? 4096,
          },
        }),
        signal: AbortSignal.timeout(this.timeout),
      },
    );

    if (!response.ok) {
      throw new ProviderRequestError(
        `Gemini stream failed: ${response.status}`,
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

          try {
            const parsed = JSON.parse(trimmed.slice(6)) as {
              candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
              usageMetadata?: {
                promptTokenCount: number;
                candidatesTokenCount: number;
                totalTokenCount: number;
              };
            };

            const text = parsed.candidates?.[0]?.content.parts.map((p) => p.text).join('');
            if (text) {
              yield { type: 'token', content: text, provider: this.name, model };
            }

            if (parsed.usageMetadata) {
              yield {
                type: 'usage',
                provider: this.name,
                model,
                usage: {
                  promptTokens: parsed.usageMetadata.promptTokenCount,
                  completionTokens: parsed.usageMetadata.candidatesTokenCount,
                  totalTokens: parsed.usageMetadata.totalTokenCount,
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
