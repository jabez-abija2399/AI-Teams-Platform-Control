import { describe, expect, it } from 'vitest';
import { isPlatformSuperAdmin, resolvePlatformRole } from '@/lib/platform-admin';

describe('platform-admin', () => {
  it('treats SUPER_ADMIN platformRole as admin', () => {
    expect(
      isPlatformSuperAdmin({ email: 'a@b.com', platformRole: 'SUPER_ADMIN' }),
    ).toBe(true);
    expect(resolvePlatformRole({ email: 'a@b.com', platformRole: 'SUPER_ADMIN' })).toBe(
      'SUPER_ADMIN',
    );
  });

  it('defaults normal users to USER', () => {
    expect(isPlatformSuperAdmin({ email: 'a@b.com', platformRole: 'USER' })).toBe(false);
    expect(resolvePlatformRole({ email: 'a@b.com' })).toBe('USER');
  });
});
