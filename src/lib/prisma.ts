// Conditionally require server-only when running inside Next.js server
if (process.env.NEXT_RUNTIME) {
  try {
    require('server-only');
  } catch {}
}
import { PrismaClient } from '../../prisma/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: pg.Pool;
};

function getPoolConfig(): pg.PoolConfig {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return {};
  try {
    const parsed = new URL(connectionString);
    const queryHost = parsed.searchParams.get('host');
    if (queryHost) {
      const db = parsed.pathname.replace(/^\//, '') || undefined;
      const user = parsed.username ? decodeURIComponent(parsed.username) : undefined;
      const password = parsed.password ? decodeURIComponent(parsed.password) : undefined;
      return {
        host: queryHost,
        database: db,
        user: user || undefined,
        password: password || undefined,
      };
    }
  } catch {}
  return { connectionString };
}

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    if (!globalForPrisma.pool) {
      const config = getPoolConfig();
      globalForPrisma.pool = new pg.Pool({
        ...config,
        max: 5,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
      });
    }
    const adapter = new PrismaPg(globalForPrisma.pool);
    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();
