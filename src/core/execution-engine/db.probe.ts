import { prisma } from '@/lib/prisma';

let dbAvailable: boolean | null = null;

/**
 * Fast check whether the database connection is usable.
 * Caches the result for the process lifetime to avoid repeated slow timeouts.
 */
export async function isDbAvailable(): Promise<boolean> {
  if (dbAvailable !== null) return dbAvailable;

  try {
    // Use a fast 1-second timeout probe
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB probe timeout')), 1000),
    );
    await Promise.race([prisma.$queryRawUnsafe('SELECT 1'), timeout]);
    dbAvailable = true;
  } catch {
    dbAvailable = false;
  }

  return dbAvailable;
}

/**
 * Wrap a Prisma call so it is skipped entirely when the DB is known-unavailable.
 */
export async function withDb<T>(fn: () => Promise<T>): Promise<T | undefined> {
  const available = await isDbAvailable();
  if (!available) return undefined;

  try {
    return await fn();
  } catch {
    dbAvailable = false; // Poisoned — skip future calls
    return undefined;
  }
}
