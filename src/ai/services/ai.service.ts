import type {
  AIGenerateOptions,
  AIResponse,
  AIStreamChunk,
  AIProviderName,
  ModelRoute,
} from '../gateway/ai.types';
import { aiGenerate, aiStream, aiGenerateStructured } from '../gateway/ai.gateway';
import { logUsage } from './usage.service';
import { getCachedResponse, setCachedResponse } from '@/ai/cache/ai-cache.service';
import { resolveUserAiCredentialForProject } from '@/features/ai-credentials/ai-credentials.service';

function translateError(raw: string): { message: string; code: string } {
  const lower = raw.toLowerCase();
  if (/429|rate.?limit|too many request/.test(lower)) {
    return { message: `AI Rate Limit: ${raw}. Please wait 30 seconds and retry.`, code: 'RATE_LIMITED' };
  }
  if (/401|unauthorized|invalid.*key|api.?key/.test(lower)) {
    return { message: `AI Authentication Failed: ${raw}. Please check your API key in Settings.`, code: 'AUTH_ERROR' };
  }
  if (/403|forbidden|access.?denied/.test(lower)) {
    return { message: `AI Access Denied: ${raw}. Please check your API key permissions and model access.`, code: 'ACCESS_DENIED' };
  }
  if (/402|payment|billing|insufficient_credit/.test(lower)) {
    return {
      message: `AI Billing/Credit Required: ${raw}. Please top up credits with your AI provider.`,
      code: 'PAYMENT_REQUIRED',
    };
  }
  if (/quota|limit.*exceeded/.test(lower)) {
    return { message: `AI Quota Exceeded: ${raw}. Please check usage limits with your provider.`, code: 'QUOTA_EXCEEDED' };
  }
  if (/timeout|etimedout|timed.?out/.test(lower)) {
    return { message: `AI Request Timed Out: ${raw}. The model took too long to respond.`, code: 'TIMEOUT' };
  }
  if (/500|502|503|service.?unavailable|internal.?error/.test(lower)) {
    return { message: `AI Service Unavailable: ${raw}. The provider is experiencing issues.`, code: 'SERVICE_ERROR' };
  }
  if (/network|fetch.*fail|econnrefused|econnreset/.test(lower)) {
    return { message: `AI Network Error: ${raw}. Could not connect to provider.`, code: 'NETWORK_ERROR' };
  }
  if (/no ai providers are configured/.test(lower)) {
    return {
      message: 'No API key configured. Add your AI provider key in Settings before continuing.',
      code: 'NO_API_KEY',
    };
  }
  return { message: raw || 'Something went wrong with the AI service.', code: 'AI_ERROR' };
}

async function resolveUserKey(projectId?: string) {
  if (!projectId) return null;
  try {
    const cred = await resolveUserAiCredentialForProject(projectId);
    if (!cred) return null;
    return {
      provider: cred.provider,
      apiKey: cred.apiKey,
      defaultModel: cred.defaultModel,
    };
  } catch {
    return null;
  }
}

export class AIService {
  async generate(
    options: AIGenerateOptions,
    provider?: AIProviderName,
    metadata?: { agentId?: string; workflowId?: string; taskId?: string; projectId?: string },
    routes?: ModelRoute[],
  ): Promise<AIResponse> {
    const cached = getCachedResponse(options);
    if (cached) return cached;

    const userKey = await resolveUserKey(metadata?.projectId);
    const response = await aiGenerate(options, provider, routes, userKey);

    setCachedResponse(options, response);

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
    const userKey = await resolveUserKey(metadata?.projectId);

    for await (const chunk of aiStream(options, provider, userKey)) {
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
    const userKey = await resolveUserKey(metadata?.projectId);
    const result = await aiGenerateStructured(options, schema, provider, userKey);

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
  options: AIGenerateOptions & { systemPrompt?: string; provider?: AIProviderName; routes?: ModelRoute[] },
  metadata?: { agentId?: string; workflowId?: string; taskId?: string; projectId?: string },
): Promise<
  { success: true; data: AIResponse } | { success: false; error: { message: string; code: string } }
> {
  try {
    const ai = getAIService();
    const messages = options.systemPrompt
      ? [{ role: 'system' as const, content: options.systemPrompt }, ...options.messages]
      : options.messages;
    const response = await ai.generate({ ...options, messages }, options.provider, metadata, options.routes);
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
