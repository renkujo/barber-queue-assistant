CREATE TABLE "ShopWeeklyAvailability" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "bookingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "walkInEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inStoreOnly" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopWeeklyAvailability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShopWeeklyAvailability_dayOfWeek_key"
ON "ShopWeeklyAvailability"("dayOfWeek");

CREATE INDEX "ShopWeeklyAvailability_dayOfWeek_idx"
ON "ShopWeeklyAvailability"("dayOfWeek");
