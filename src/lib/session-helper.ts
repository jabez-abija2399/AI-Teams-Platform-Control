import { auth } from '@/lib/auth';
import type { PlatformRole } from '@/lib/platform-admin';

export interface ResolvedAuthSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    platformRole?: PlatformRole;
  };
}

/**
 * Resolves the active NextAuth JWT session only.
 * Custom forgeable session_token cookies are intentionally not trusted.
 */
export async function getAuthSession(): Promise<ResolvedAuthSession | null> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return {
        user: {
          id: session.user.id,
          name: session.user.name || 'User',
          email: session.user.email,
          image: session.user.image,
          platformRole: session.user.platformRole,
        },
      };
    }
  } catch {
    // invalid / expired session
  }
  return null;
}
