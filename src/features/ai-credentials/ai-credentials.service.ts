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
  return count > 0;
}

/** Internal: server .env keys (never exposed in user-facing UI). */
export function getPlatformAiStatus(): PlatformAiStatus {
  const config = getAIConfig();
  const providers: PlatformAiStatus['providers'] = [];

  for (const [id, cfg] of Object.entries(config.providers)) {
    if (!cfg?.enabled) continue;
    // Dev-only ollama without a cloud key must not unlock project create / pipeline start.
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

/** Internal only — gates use userHasAiCredential (BYOK required for users). */
export async function getAiAccessStatus(userId: string): Promise<AiAccessStatus> {
  const userKey = await getAiCredentialStatus(userId);
  const platform = getPlatformAiStatus();
  const userKeyConfigured = userKey.configured;

  return {
    userKey,
    platform,
    userKeyConfigured,
    platformConfigured: platform.available,
    canRun: userKeyConfigured,
    activeSource: userKeyConfigured ? 'user' : 'none',
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
      error: { message: 'API key looks too short. Paste the full key from your provider.', code: 'VALIDATION_ERROR' },
    };
  }

  const entry = getProviderCatalogEntry(input.provider)!;
  const defaultModel = (input.defaultModel?.trim() || entry.defaultModel).slice(0, 120);

  let encryptedApiKey: string;
  try {
    encryptedApiKey = encrypt(apiKey);
  } catch {
    return {
      success: false,
      error: {
        message: 'Server encryption is not configured (ENCRYPTION_KEY). Ask your admin to set it.',
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
