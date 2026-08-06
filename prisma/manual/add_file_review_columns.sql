-- Optional: apply File review columns if `npx prisma db push` cannot auth.
-- Run against your Postgres when credentials work.

ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "reviewStatus" TEXT NOT NULL DEFAULT 'accepted';
ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "previousContent" TEXT;

CREATE INDEX IF NOT EXISTS "files_reviewStatus_idx" ON "files"("reviewStatus");
