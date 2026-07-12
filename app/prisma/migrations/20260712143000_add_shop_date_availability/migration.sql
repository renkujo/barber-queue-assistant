CREATE TABLE "ShopDateAvailability" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "bookingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "walkInEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopDateAvailability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShopDateAvailability_date_key" ON "ShopDateAvailability"("date");
CREATE INDEX "ShopDateAvailability_date_idx" ON "ShopDateAvailability"("date");
