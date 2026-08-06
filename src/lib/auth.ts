import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/features/auth/schemas/auth.schema';

const { handlers, auth: nextAuthAuth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  logger: {
    error(error: any) {
      if (error?.name === 'JWTSessionError' || (typeof error === 'string' && error.includes('JWTSessionError'))) return;
      console.error(error);
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
});

export const auth = async (...args: any[]) => {
  try {
    const session = await (nextAuthAuth as any)(...args);
    if (session?.user?.id) {
      return session;
    }
  } catch {
    // ignore
  }
  return null;
};

export { handlers, signIn, signOut };
