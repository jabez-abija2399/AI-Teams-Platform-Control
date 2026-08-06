import type { UserAiProviderId } from './ai-provider-catalog';

export interface AiCredentialPublicStatus {
  configured: boolean;
  provider: UserAiProviderId | null;
  providerName: string | null;
  keyHint: string | null;
  defaultModel: string | null;
  updatedAt: string | null;
}

/** Server-level keys from .env (platform / demo / self-hosted). */
export interface PlatformAiStatus {
  available: boolean;
  providers: Array<{ id: string; name: string; defaultModel: string }>;
}

/**
 * Unified view: user BYOK and/or platform .env keys.
 * User key wins at runtime when both exist.
 */
export interface AiAccessStatus {
  userKey: AiCredentialPublicStatus;
  platform: PlatformAiStatus;
  /** User saved an encrypted API key */
  userKeyConfigured: boolean;
  /** At least one provider enabled via server .env */
  platformConfigured: boolean;
  /** Pipeline / project create allowed */
  canRun: boolean;
  /** Which source AI calls use first */
  activeSource: 'user' | 'platform' | 'none';
}
