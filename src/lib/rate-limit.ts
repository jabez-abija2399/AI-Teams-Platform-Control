import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, number>({
  max: 5000,
  ttl: 60_000,
});

export function rateLimit(key: string, limit = 10): { allowed: boolean } {
  const count = (cache.get(key) ?? 0) + 1;
  cache.set(key, count);
  return { allowed: count <= limit };
}
