import 'next-auth';
import 'next-auth/jwt';
import type { PlatformRole } from '@/lib/platform-admin';

declare module 'next-auth' {
  interface User {
    platformRole?: PlatformRole;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      platformRole?: PlatformRole;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    platformRole?: PlatformRole;
  }
}
