import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  it('should allow requests within limit', () => {
    const result = rateLimit('api', 'user-1', 10);
    expect(result.allowed).toBe(true);
  });

  it('should deny requests exceeding limit', () => {
    for (let i = 0; i < 10; i++) {
      rateLimit('api', 'user-2', 10);
    }
    const result = rateLimit('api', 'user-2', 10);
    expect(result.allowed).toBe(false);
  });

  it('should track different users independently', () => {
    for (let i = 0; i < 10; i++) {
      rateLimit('api', 'user-a', 10);
    }
    const resultA = rateLimit('api', 'user-a', 10);
    const resultB = rateLimit('api', 'user-b', 10);

    expect(resultA.allowed).toBe(false);
    expect(resultB.allowed).toBe(true);
  });

  it('should track different keys independently', () => {
    for (let i = 0; i < 10; i++) {
      rateLimit('api', 'key-1', 10);
    }
    const result1 = rateLimit('api', 'key-1', 10);
    const result2 = rateLimit('api', 'key-2', 10);

    expect(result1.allowed).toBe(false);
    expect(result2.allowed).toBe(true);
  });

  it('should return resetIn value', () => {
    const result = rateLimit('api', 'user-3', 10);
    expect(typeof result.resetIn).toBe('number');
    expect(result.resetIn).toBeGreaterThan(0);
  });
});