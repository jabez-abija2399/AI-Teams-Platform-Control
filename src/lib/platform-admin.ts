/**
 * Platform-wide roles (system), not org Membership.role.
 */
export type PlatformRole = 'USER' | 'SUPER_ADMIN';

export const PLATFORM_ROLES = {
  USER: 'USER',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const satisfies Record<PlatformRole, PlatformRole>;

function emailsFromEnv(): Set<string> {
  const raw = process.env.SUPER_ADMIN_EMAILS || '';
  return new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** True when email is listed in SUPER_ADMIN_EMAILS or DB platformRole is SUPER_ADMIN. */
export function isPlatformSuperAdmin(opts: {
  email?: string | null;
  platformRole?: string | null;
}): boolean {
  if (opts.platformRole === PLATFORM_ROLES.SUPER_ADMIN) return true;
  const email = opts.email?.trim().toLowerCase();
  if (email && emailsFromEnv().has(email)) return true;
  return false;
}

export function resolvePlatformRole(opts: {
  email?: string | null;
  platformRole?: string | null;
}): PlatformRole {
  return isPlatformSuperAdmin(opts) ? PLATFORM_ROLES.SUPER_ADMIN : PLATFORM_ROLES.USER;
}
