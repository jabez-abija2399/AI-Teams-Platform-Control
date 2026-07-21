import type {
  AIGenerateOptions,
  AIResponse,
  AIStreamChunk,
  AIProviderName,
} from '../gateway/ai.types';
import { aiGenerate, aiStream, aiGenerateStructured } from '../gateway/ai.gateway';
import { logUsage } from './usage.service';

function translateError(raw: string): { message: string; code: string } {
  const lower = raw.toLowerCase();
  if (/429|rate.?limit|too many request/.test(lower)) {
    return { message: 'AI service is busy. Please wait 30 seconds and try again.', code: 'RATE_LIMITED' };
  }
  if (/401|unauthorized|invalid.*key|api.?key/.test(lower)) {
    return { message: 'AI service authentication failed. Please check your API key.', code: 'AUTH_ERROR' };
  }
  if (/403|forbidden|access.?denied/.test(lower)) {
    return { message: 'AI service access denied. Please check your API key permissions.', code: 'ACCESS_DENIED' };
  }
  if (/quota|billing|limit.*exceeded/.test(lower)) {
    return { message: 'AI usage quota reached. Please check your billing or try again tomorrow.', code: 'QUOTA_EXCEEDED' };
  }
  if (/timeout|etimedout|timed.?out/.test(lower)) {
    return { message: 'Request timed out. The AI model may be overloaded. Please try again.', code: 'TIMEOUT' };
  }
  if (/500|502|503|service.?unavailable|internal.?error/.test(lower)) {
    return { message: 'AI service is temporarily unavailable. Please try again later.', code: 'SERVICE_ERROR' };
  }
  if (/network|fetch.*fail|econnrefused|econnreset/.test(lower)) {
    return { message: 'Could not reach the AI service. Please check your connection.', code: 'NETWORK_ERROR' };
  }
  return { message: 'Something went wrong with the AI service.', code: 'AI_ERROR' };
}

export class AIService {
  async generate(
    options: AIGenerateOptions,
    provider?: AIProviderName,
    metadata?: { agentId?: string; workflowId?: string; taskId?: string; projectId?: string },
  ): Promise<AIResponse> {
    const response = await aiGenerate(options, provider);

    await logUsage(
      { provider: response.provider, model: response.model, usage: response.usage },
      metadata?.agentId,
      metadata?.projectId,
    );

    return response;
  }

  async *stream(
    options: AIGenerateOptions,
    provider?: AIProviderName,
    metadata?: { agentId?: string; workflowId?: string; taskId?: string; projectId?: string },
  ): AsyncGenerator<AIStreamChunk, void, undefined> {
    let finalUsage: AIStreamChunk | undefined;

    for await (const chunk of aiStream(options, provider)) {
      if (chunk.type === 'usage') {
        finalUsage = chunk;
      }
      yield chunk;
    }

    if (finalUsage?.usage && finalUsage.provider && finalUsage.model) {
      await logUsage(
        { provider: finalUsage.provider, model: finalUsage.model, usage: finalUsage.usage },
        metadata?.agentId,
        metadata?.projectId,
      );
    }
  }

  async generateStructured<T>(
    options: AIGenerateOptions,
    schema: { parse: (data: unknown) => T },
    provider?: AIProviderName,
    metadata?: { agentId?: string; workflowId?: string; taskId?: string; projectId?: string },
  ): Promise<{ data: T; response: AIResponse }> {
    const result = await aiGenerateStructured(options, schema, provider);

    await logUsage(
      { provider: result.response.provider, model: result.response.model, usage: result.response.usage },
      metadata?.agentId,
      metadata?.projectId,
    );

    return result;
  }
}

let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}

export async function generate(
  options: AIGenerateOptions & { systemPrompt?: string; provider?: AIProviderName },
  metadata?: { agentId?: string; workflowId?: string; taskId?: string; projectId?: string },
): Promise<
  { success: true; data: AIResponse } | { success: false; error: { message: string; code: string } }
> {
  try {
    const ai = getAIService();
    const messages = options.systemPrompt
      ? [{ role: 'system' as const, content: options.systemPrompt }, ...options.messages]
      : options.messages;
    const response = await ai.generate({ ...options, messages }, options.provider, metadata);
    return { success: true, data: response };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    return { success: false, error: translateError(raw) };
  }
}

export async function generateStructured<T>(
  options: AIGenerateOptions & {
    systemPrompt?: string;
    schema?: unknown;
    provider?: AIProviderName;
  },
  meta?: { provider?: AIProviderName; projectId?: string },
): Promise<
  { success: true; data: T } | { success: false; error: { message: string; code: string } }
> {
  try {
    const ai = getAIService();
    const messages = options.systemPrompt
      ? [{ role: 'system' as const, content: options.systemPrompt }, ...options.messages]
      : options.messages;
    const zodSchema = { parse: (data: unknown) => data as T };
    const result = await ai.generateStructured(
      { ...options, messages },
      zodSchema,
      meta?.provider ?? options.provider,
      { projectId: meta?.projectId },
    );
    return { success: true, data: result.data };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    return { success: false, error: translateError(raw) };
  }
}
