-- BYOK: encrypted user AI credentials
CREATE TABLE IF NOT EXISTS "user_ai_credentials" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "encryptedApiKey" TEXT NOT NULL,
  "keyHint" TEXT NOT NULL,
  "defaultModel" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_ai_credentials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_ai_credentials_userId_key" ON "user_ai_credentials"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_ai_credentials_userId_fkey'
  ) THEN
    ALTER TABLE "user_ai_credentials"
      ADD CONSTRAINT "user_ai_credentials_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
