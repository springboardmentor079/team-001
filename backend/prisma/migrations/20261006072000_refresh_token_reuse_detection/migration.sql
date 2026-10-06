CREATE TABLE "refresh_token_uses" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "consumedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_uses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "refresh_token_uses_tokenHash_key" ON "refresh_token_uses"("tokenHash");
CREATE INDEX "refresh_token_uses_sessionId_consumedAt_idx" ON "refresh_token_uses"("sessionId", "consumedAt");

ALTER TABLE "refresh_token_uses"
ADD CONSTRAINT "refresh_token_uses_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "auth_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
