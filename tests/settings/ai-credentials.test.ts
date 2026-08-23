import { describe, it, expect, beforeEach } from 'vitest';
import {
  upsertAiCredential,
  getAiCredentialStatus,
  deleteAiCredential,
  resolveUserAiCredential,
  testAiCredential,
} from '@/features/ai-credentials/ai-credentials.service';
import { encrypt, decrypt } from '@/lib/encryption';
import { prisma } from '@/lib/prisma';

describe('AI Credentials & BYOK Security', () => {
  const testUserId = 'test-user-byok-1';

  beforeEach(async () => {
    // Ensure test user exists
    await prisma.user.upsert({
      where: { id: testUserId },
      create: {
        id: testUserId,
        email: 'test-byok@example.com',
        name: 'BYOK Tester',
      },
      update: {},
    });
    await deleteAiCredential(testUserId);
  });

  it('1. Encrypts and decrypts API keys with AES-256-GCM', () => {
    const rawKey = 'sk-test-secret-key-123456789';
    const encrypted = encrypt(rawKey);
    expect(encrypted).not.toBe(rawKey);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(rawKey);
  });

  it('2. Saves, masks, and retrieves user API credential', async () => {
    const rawKey = 'sk-openai-test-key-99887766';
    const saveResult = await upsertAiCredential(testUserId, {
      provider: 'openai',
      apiKey: rawKey,
    });

    expect(saveResult.success).toBe(true);
    if (!saveResult.success) return;

    expect(saveResult.data.configured).toBe(true);
    expect(saveResult.data.provider).toBe('openai');
    expect(saveResult.data.keyHint).toBe('••••7766');

    // Verify resolved decrypted key for execution
    const resolved = await resolveUserAiCredential(testUserId);
    expect(resolved).not.toBeNull();
    expect(resolved?.apiKey).toBe(rawKey);
    expect(resolved?.provider).toBe('openai');
  });

  it('3. Removes user AI credential cleanly', async () => {
    await upsertAiCredential(testUserId, {
      provider: 'gemini',
      apiKey: 'AIzaSyTestKey12345678',
    });

    const statusBefore = await getAiCredentialStatus(testUserId);
    expect(statusBefore.configured).toBe(true);

    await deleteAiCredential(testUserId);

    const statusAfter = await getAiCredentialStatus(testUserId);
    expect(statusAfter.configured).toBe(false);
    expect(statusAfter.keyHint).toBeNull();
  });

  it('4. Rejects invalid or short API keys', async () => {
    const shortResult = await upsertAiCredential(testUserId, {
      provider: 'groq',
      apiKey: 'short',
    });
    expect(shortResult.success).toBe(false);
    if (!shortResult.success) {
      expect(shortResult.error.message).toMatch(/too short/i);
    }
  });
});
