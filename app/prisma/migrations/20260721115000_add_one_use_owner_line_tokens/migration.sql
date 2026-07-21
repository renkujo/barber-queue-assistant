CREATE TABLE "OwnerLineConnectToken" (
    "nonce" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnerLineConnectToken_pkey" PRIMARY KEY ("nonce")
);

CREATE INDEX "OwnerLineConnectToken_expiresAt_idx" ON "OwnerLineConnectToken"("expiresAt");
CREATE INDEX "OwnerLineConnectToken_consumedAt_idx" ON "OwnerLineConnectToken"("consumedAt");
