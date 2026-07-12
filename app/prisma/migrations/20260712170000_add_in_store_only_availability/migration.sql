ALTER TABLE "ShopDateAvailability"
ADD COLUMN "inStoreOnly" BOOLEAN NOT NULL DEFAULT false;

UPDATE "ShopDateAvailability"
SET
    "inStoreOnly" = true,
    "walkInEnabled" = false
WHERE "bookingEnabled" = false
  AND "walkInEnabled" = true;
