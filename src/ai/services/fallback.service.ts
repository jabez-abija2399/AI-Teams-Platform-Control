import { generate } from './ai.service';
import type { AIGenerateOptions, AIProviderName } from '@/ai/gateway/ai.types';

export async function generateWithFallback(
  request: AIGenerateOptions,
  chain: { provider: AIProviderName; model: string }[],
  options: { agentId?: string; projectId?: string } = {},
): Promise<{ success: true; content: string; usedProvider: AIProviderName } | { success: false; error: string }> {
  let lastError = '';

  for (const { provider, model } of chain) {
    const result = await generate({ ...request, model, provider }, options);
    if (result.success) {
      return { success: true, content: result.data.content, usedProvider: provider };
    }
    lastError = result.error.message;
  }

  return { success: false, error: `All providers failed. Last error: ${lastError}` };
}
