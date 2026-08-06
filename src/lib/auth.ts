import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/features/auth/schemas/auth.schema';
import { resolvePlatformRole, type PlatformRole } from '@/lib/platform-admin';

const isProd = process.env.NODE_ENV === 'production';
const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

if (isProd && !authSecret) {
  throw new Error('AUTH_SECRET or NEXTAUTH_SECRET must be set in production');
}

const cookieSecure = isProd;

const { handlers, auth: nextAuthAuth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  logger: {
    error(error: unknown) {
      const name =
        typeof error === 'object' && error && 'name' in error
          ? String((error as { name?: string }).name)
          : '';
      if (name === 'JWTSessionError') return;
      console.error(error);
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh session payload at most once/day
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 7,
  },
  secret: authSecret,
  trustHost: true,
  useSecureCookies: cookieSecure,
  cookies: {
    sessionToken: {
      name: cookieSecure ? '__Secure-authjs.session-token' : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: cookieSecure,
      },
    },
    csrfToken: {
      name: cookieSecure ? '__Host-authjs.csrf-token' : 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: cookieSecure,
      },
    },
    callbackUrl: {
      name: cookieSecure ? '__Secure-authjs.callback-url' : 'authjs.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: cookieSecure,
      },
    },
  },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        const platformRole = resolvePlatformRole({
          email: user.email,
          platformRole: (user as { platformRole?: string }).platformRole,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
          platformRole,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.platformRole = (user as { platformRole?: PlatformRole }).platformRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.platformRole = (token.platformRole as PlatformRole) || 'USER';
      }
      return session;
    },
  },
});

export const auth = async (...args: unknown[]) => {
  try {
    const session = await (nextAuthAuth as (...a: unknown[]) => Promise<unknown>)(...args);
    if (
      session &&
      typeof session === 'object' &&
      'user' in session &&
      session.user &&
      typeof session.user === 'object' &&
      'id' in session.user &&
      session.user.id
    ) {
      return session as {
        user: {
          id: string;
          name?: string | null;
          email?: string | null;
          image?: string | null;
          platformRole?: PlatformRole;
        };
      };
    }
  } catch {
    // ignore invalid/expired sessions
  }
  return null;
};

export { handlers, signIn, signOut };
