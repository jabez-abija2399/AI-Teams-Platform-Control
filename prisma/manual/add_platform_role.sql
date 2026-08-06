-- Platform SUPER_ADMIN support (safe to re-run)
ALTER TABLE users ADD COLUMN IF NOT EXISTS "platformRole" TEXT NOT NULL DEFAULT 'USER';
