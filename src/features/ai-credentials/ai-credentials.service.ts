import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';
import type { ApiResult } from '@/types/common.types';
import { getAIConfig } from '@/ai/config/ai.config';
import {
  getProviderCatalogEntry,
  isUserAiProviderId,
  type UserAiProviderId,
} from './ai-provider-catalog';
import type {
  AiCredentialPublicStatus,
  AiAccessStatus,
  PlatformAiStatus,
} from './ai-credentials.types';
import { createProviderWithApiKey } from '@/ai/providers/provider.registry';
import type { AIProviderName } from '@/ai/gateway/ai.types';

export type { AiCredentialPublicStatus, AiAccessStatus, PlatformAiStatus } from './ai-credentials.types';

export interface ResolvedUserAiCredential {
  userId: string;
  provider: UserAiProviderId;
  apiKey: string;
  defaultModel: string;
}

function maskHint(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (trimmed.length <= 4) return '••••';
  return `••••${trimmed.slice(-4)}`;
}

export async function getAiCredentialStatus(userId: string): Promise<AiCredentialPublicStatus> {
  const row = await prisma.userAiCredential.findUnique({ where: { userId } });
  if (!row) {
    return {
      configured: false,
      provider: null,
      providerName: null,
      keyHint: null,
      defaultModel: null,
      updatedAt: null,
    };
  }

  const entry = getProviderCatalogEntry(row.provider);
  return {
    configured: true,
    provider: isUserAiProviderId(row.provider) ? row.provider : null,
    providerName: entry?.name ?? row.provider,
    keyHint: row.keyHint,
    defaultModel: row.defaultModel,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function userHasAiCredential(userId: string): Promise<boolean> {
  const count = await prisma.userAiCredential.count({ where: { userId } });
  if (count > 0) return true;
  const platform = getPlatformAiStatus();
  if (platform.available) return true;
  if (process.env.NODE_ENV === 'development' || process.env.ALLOW_DEMO_AI === 'true') return true;
  return false;
}

/** Internal: server .env keys (never exposed in user-facing UI). */
export function getPlatformAiStatus(): PlatformAiStatus {
  const config = getAIConfig();
  const providers: PlatformAiStatus['providers'] = [];

  for (const [id, cfg] of Object.entries(config.providers)) {
    if (!cfg?.enabled) continue;
    if (!cfg.apiKey) continue;

    const catalog = getProviderCatalogEntry(id as UserAiProviderId);
    providers.push({
      id,
      name: catalog?.name ?? id,
      defaultModel: cfg.defaultModel,
    });
  }

  return {
    available: providers.length > 0,
    providers,
  };
}

export async function getAiAccessStatus(userId: string): Promise<AiAccessStatus> {
  const userKey = await getAiCredentialStatus(userId);
  const platform = getPlatformAiStatus();
  const userKeyConfigured = userKey.configured;

  return {
    userKey,
    platform,
    userKeyConfigured,
    platformConfigured: platform.available,
    canRun: userKeyConfigured || platform.available || process.env.NODE_ENV === 'development',
    activeSource: userKeyConfigured ? 'user' : platform.available ? 'platform' : 'none',
  };
}

export async function testAiCredential(input: {
  provider: string;
  apiKey: string;
  defaultModel?: string;
}): Promise<ApiResult<{ latencyMs: number; provider: string; model: string }>> {
  if (!isUserAiProviderId(input.provider)) {
    return {
      success: false,
      error: { message: `Unsupported AI provider: ${input.provider}`, code: 'VALIDATION_ERROR' },
    };
  }

  const apiKey = (input.apiKey || '').trim();
  if (apiKey.length < 8) {
    return {
      success: false,
      error: {
        message: 'API key is too short. Please paste the full key from your provider.',
        code: 'VALIDATION_ERROR',
      },
    };
  }

  if (input.provider === 'groq' && !apiKey.startsWith('gsk_')) {
    return {
      success: false,
      error: {
        message:
          'Invalid Groq API key. Groq keys start with "gsk_". Please copy your key from console.groq.com/keys.',
        code: 'VALIDATION_ERROR',
      },
    };
  }

  if (input.provider === 'gemini' && !apiKey.startsWith('AIza') && !apiKey.startsWith('AQ.')) {
    return {
      success: false,
      error: {
        message:
          'Invalid Google Gemini API key. Gemini keys start with "AIza…" or "AQ…". Please copy your key from aistudio.google.com/apikey.',
        code: 'VALIDATION_ERROR',
      },
    };
  }

  if (input.provider === 'openrouter' && !apiKey.startsWith('sk-or-')) {
    return {
      success: false,
      error: {
        message:
          'Invalid OpenRouter API key. OpenRouter keys start with "sk-or-". Please copy your key from openrouter.ai/keys.',
        code: 'VALIDATION_ERROR',
      },
    };
  }

  const entry = getProviderCatalogEntry(input.provider);
  const primaryModel = (input.defaultModel?.trim() || entry?.defaultModel || '').slice(0, 120);

  const fallbackCandidateMap: Record<string, string[]> = {
    gemini: ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'],
    groq: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b', 'groq/compound'],
    openrouter: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet'],
    openai: ['gpt-4o-mini', 'gpt-4o'],
    anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    deepseek: ['deepseek-chat'],
  };

  const candidateModels = Array.from(
    new Set([primaryModel, ...(fallbackCandidateMap[input.provider] || [])]),
  ).filter(Boolean);

  const startTime = Date.now();
  let lastError: Error | null = null;

  for (const modelToTest of candidateModels) {
    try {
      const adapter = createProviderWithApiKey(input.provider as AIProviderName, apiKey, modelToTest);
      const res = await Promise.race([
        adapter.generate({
          messages: [{ role: 'user', content: 'Say "connected" in one word.' }],
          temperature: 0.1,
          maxTokens: 10,
          model: modelToTest || undefined,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection test timed out after 15s')), 15000),
        ),
      ]);

      return {
        success: true,
        data: {
          latencyMs: Date.now() - startTime,
          provider: input.provider,
          model: res.model || modelToTest || 'default',
        },
      };
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // If error is 401/auth failure, don't keep trying models with an invalid key
      if (/401|unauthorized|invalid.*key/i.test(lastError.message)) {
        break;
      }
    }
  }

  const raw = lastError?.message || 'Connection test failed';
  return {
    success: false,
    error: {
      message: `API Key verification failed: ${raw}`,
      code: 'AUTH_ERROR',
    },
  };
}

export async function upsertAiCredential(
  userId: string,
  input: { provider: string; apiKey: string; defaultModel?: string },
): Promise<ApiResult<AiCredentialPublicStatus>> {
  if (!isUserAiProviderId(input.provider)) {
    return {
      success: false,
      error: { message: 'Unsupported AI provider.', code: 'VALIDATION_ERROR' },
    };
  }

  const apiKey = input.apiKey.trim();
  if (apiKey.length < 8) {
    return {
      success: false,
      error: {
        message: 'API key looks too short. Paste the full key from your provider.',
        code: 'VALIDATION_ERROR',
      },
    };
  }

  if (input.provider === 'groq' && !apiKey.startsWith('gsk_')) {
    return {
      success: false,
      error: {
        message:
          'Invalid Groq API key. Groq keys start with "gsk_". Please copy your key from console.groq.com/keys.',
        code: 'VALIDATION_ERROR',
      },
    };
  }

  if (input.provider === 'gemini' && !apiKey.startsWith('AIza') && !apiKey.startsWith('AQ.')) {
    return {
      success: false,
      error: {
        message:
          'Invalid Google Gemini API key. Gemini keys start with "AIza…" or "AQ…". Please copy your key from aistudio.google.com/apikey.',
        code: 'VALIDATION_ERROR',
      },
    };
  }

  if (input.provider === 'openrouter' && !apiKey.startsWith('sk-or-')) {
    return {
      success: false,
      error: {
        message:
          'Invalid OpenRouter API key. OpenRouter keys start with "sk-or-". Please copy your key from openrouter.ai/keys.',
        code: 'VALIDATION_ERROR',
      },
    };
  }

  const entry = getProviderCatalogEntry(input.provider)!;
  const defaultModel = (input.defaultModel?.trim() || entry.defaultModel).slice(0, 120);

  let encryptedApiKey: string;
  try {
    encryptedApiKey = encrypt(apiKey);
  } catch (err: any) {
    return {
      success: false,
      error: {
        message: `Could not encrypt API key: ${err?.message || 'Encryption error'}`,
        code: 'INTERNAL_ERROR',
      },
    };
  }

  await prisma.userAiCredential.upsert({
    where: { userId },
    create: {
      userId,
      provider: input.provider,
      encryptedApiKey,
      keyHint: maskHint(apiKey),
      defaultModel,
    },
    update: {
      provider: input.provider,
      encryptedApiKey,
      keyHint: maskHint(apiKey),
      defaultModel,
    },
  });

  const status = await getAiCredentialStatus(userId);
  return { success: true, data: status };
}

export async function deleteAiCredential(userId: string): Promise<ApiResult<{ deleted: true }>> {
  await prisma.userAiCredential.deleteMany({ where: { userId } });
  return { success: true, data: { deleted: true } };
}

export async function resolveUserAiCredential(
  userId: string,
): Promise<ResolvedUserAiCredential | null> {
  const row = await prisma.userAiCredential.findUnique({ where: { userId } });
  if (!row || !isUserAiProviderId(row.provider)) return null;

  let apiKey: string;
  try {
    apiKey = decrypt(row.encryptedApiKey);
  } catch {
    return null;
  }

  const entry = getProviderCatalogEntry(row.provider)!;
  return {
    userId,
    provider: row.provider,
    apiKey,
    defaultModel: row.defaultModel || entry.defaultModel,
  };
}

export async function resolveUserAiCredentialForProject(
  projectId: string,
): Promise<ResolvedUserAiCredential | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) return null;
  return resolveUserAiCredential(project.ownerId);
}
