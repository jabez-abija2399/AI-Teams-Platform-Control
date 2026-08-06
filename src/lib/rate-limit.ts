import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, number>({
  max: 5000,
  ttl: 60_000,
});

export function rateLimit(key: string, identifier: string, limit = 10): { allowed: boolean; resetIn: number } {
  const cacheKey = `${key}:${identifier}`;
  const count = (cache.get(cacheKey) ?? 0) + 1;
  cache.set(cacheKey, count);
  return { allowed: count <= limit, resetIn: 60_000 };
}
