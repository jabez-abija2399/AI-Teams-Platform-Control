import { prisma } from './prisma';

let schemaSyncPromise: Promise<void> | null = null;

/**
 * Ensures missing columns and enums in PostgreSQL exist so Prisma queries never fail
 * on production databases that haven't run manual `prisma db push`.
 */
export async function ensureDatabaseSchema(): Promise<void> {
  if (schemaSyncPromise) {
    return schemaSyncPromise;
  }

  schemaSyncPromise = (async () => {
    try {
      // 1. Create Enums if they do not exist in PostgreSQL
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProjectType') THEN
            CREATE TYPE "ProjectType" AS ENUM ('FRONTEND_ONLY', 'BACKEND_ONLY', 'FULL_STACK', 'MOBILE', 'API', 'LIBRARY', 'CLI');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StackSource') THEN
            CREATE TYPE "StackSource" AS ENUM ('PLATFORM_TEMPLATE', 'DETECTED');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MissionStatus') THEN
            CREATE TYPE "MissionStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'PAUSED', 'WAITING_FOR_APPROVAL', 'COMPLETED', 'FAILED');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RootCauseCategory') THEN
            CREATE TYPE "RootCauseCategory" AS ENUM ('REQUIREMENT', 'ARCHITECTURE', 'CODE', 'TEST', 'ENVIRONMENT');
          END IF;
        END $$;
      `).catch(() => {});

      // 2. Add missing columns to "projects" table if not exists
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "projectType" "ProjectType" DEFAULT 'FULL_STACK';
        ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "selectedStackId" TEXT;
        ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "selectedStackVersion" TEXT;
        ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "stackSource" "StackSource" DEFAULT 'PLATFORM_TEMPLATE';
        ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "runtimeContract" JSONB;
        ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "capabilities" JSONB;
      `).catch(() => {});
    } catch (err) {
      console.warn('[db-schema-sync] Schema auto-sync skipped:', err);
    }
  })();

  return schemaSyncPromise;
}
