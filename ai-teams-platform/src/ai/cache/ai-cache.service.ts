import { LRUCache } from 'lru-cache';
import { createHash } from 'crypto';
import type { AIGenerateOptions, AIResponse } from '@/ai/gateway/ai.types';

interface CacheEntry {
  response: AIResponse;
  cachedAt: number;
}

const cache = new LRUCache<string, CacheEntry>({
  max: 500,
  ttl: 5 * 60 * 1000,
});

function hashKey(options: AIGenerateOptions): string {
  const hash = createHash('sha256');
  const content = JSON.stringify({
    messages: options.messages,
    model: options.model,
    temperature: options.temperature,
  });
  hash.update(content);
  return hash.digest('hex');
}

export function getCachedResponse(options: AIGenerateOptions): AIResponse | null {
  const key = hashKey(options);
  const entry = cache.get(key);
  if (!entry) return null;
  return entry.response;
}

export function setCachedResponse(options: AIGenerateOptions, response: AIResponse): void {
  const key = hashKey(options);
  cache.set(key, { response, cachedAt: Date.now() });
}

export function invalidateProjectCache(projectId: string): void {
  for (const [key] of cache) {
    if (key.includes(projectId)) {
      cache.delete(key);
    }
  }
}

export const aiCache = { get: getCachedResponse, set: setCachedResponse, invalidate: invalidateProjectCache };
