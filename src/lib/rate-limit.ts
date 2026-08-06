import { LRUCache } from 'lru-cache';

type Counter = { count: number; resetAt: number };

const buckets = new LRUCache<string, Counter>({
  max: 10_000,
  ttl: 60 * 60_000,
});

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Milliseconds until the window resets */
  resetIn: number;
  limit: number;
}

/**
 * Fixed-window counter (in-memory).
 * Fine for single-node / MVP; swap to Redis for multi-instance later.
 */
export function rateLimit(
  key: string,
  identifier: string,
  limit = 10,
  windowMs = 60_000,
): RateLimitResult {
  const cacheKey = `${key}:${identifier}`;
  const now = Date.now();
  const existing = buckets.get(cacheKey);

  if (!existing || existing.resetAt <= now) {
    buckets.set(cacheKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs, limit };
  }

  existing.count += 1;
  buckets.set(cacheKey, existing);
  const resetIn = Math.max(0, existing.resetAt - now);

  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetIn,
    limit,
  };
}

/** Auth presets — blunt brute force without locking out normal users */
export const AUTH_RATE_LIMITS = {
  loginIp: { limit: 10, windowMs: 15 * 60_000 },
  loginEmail: { limit: 8, windowMs: 15 * 60_000 },
  registerIp: { limit: 5, windowMs: 60 * 60_000 },
} as const;

export function checkLoginIpRateLimit(ip: string): RateLimitResult {
  return rateLimit(
    'auth:login:ip',
    ip || 'unknown',
    AUTH_RATE_LIMITS.loginIp.limit,
    AUTH_RATE_LIMITS.loginIp.windowMs,
  );
}

export function checkLoginEmailRateLimit(email: string): RateLimitResult {
  return rateLimit(
    'auth:login:email',
    email.trim().toLowerCase() || 'unknown',
    AUTH_RATE_LIMITS.loginEmail.limit,
    AUTH_RATE_LIMITS.loginEmail.windowMs,
  );
}

export function checkRegisterRateLimit(ip: string): RateLimitResult {
  return rateLimit(
    'auth:register:ip',
    ip || 'unknown',
    AUTH_RATE_LIMITS.registerIp.limit,
    AUTH_RATE_LIMITS.registerIp.windowMs,
  );
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp.slice(0, 64);
  return 'unknown';
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'Retry-After': String(Math.max(1, Math.ceil(result.resetIn / 1000))),
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
  };
}

export function formatRetryMessage(result: RateLimitResult): string {
  const minutes = Math.max(1, Math.ceil(result.resetIn / 60_000));
  return `Too many attempts. Please try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`;
}
