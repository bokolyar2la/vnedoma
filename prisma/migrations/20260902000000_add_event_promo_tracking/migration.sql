ALTER TABLE "Event"
  ADD COLUMN IF NOT EXISTS "promoCode" TEXT DEFAULT 'ВЛЮДИ',
  ADD COLUMN IF NOT EXISTS "discountText" TEXT DEFAULT 'Скидка 10% по промокоду ВЛЮДИ',
  ADD COLUMN IF NOT EXISTS "isPromoEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "publishedToVk" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "publishedToInstagram" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "adminNote" TEXT;

ALTER TABLE "OrganizerEventRequest"
  ADD COLUMN IF NOT EXISTS "promoCode" TEXT DEFAULT 'ВЛЮДИ',
  ADD COLUMN IF NOT EXISTS "discountText" TEXT DEFAULT 'Скидка 10% по промокоду ВЛЮДИ',
  ADD COLUMN IF NOT EXISTS "isPromoEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "publishedToVk" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "publishedToInstagram" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "adminNote" TEXT;

ALTER TABLE "ActivityStatEvent"
  ADD COLUMN IF NOT EXISTS "eventId" INTEGER;

ALTER TABLE "ActivityBookingRequest"
  ADD COLUMN IF NOT EXISTS "eventId" INTEGER;

ALTER TABLE "OrganizerAccount"
  ALTER COLUMN "platformBookingDiscountText" SET DEFAULT 'Скидка 10% по промокоду ВЛЮДИ';

UPDATE "OrganizerAccount"
SET "platformBookingDiscountText" = 'Скидка 10% по промокоду ВЛЮДИ'
WHERE "platformBookingDiscountText" = 'Промокод ВЛЮДИ: 10% скидка';

CREATE INDEX IF NOT EXISTS "ActivityStatEvent_eventId_type_createdAt_idx"
  ON "ActivityStatEvent"("eventId", "type", "createdAt");

CREATE INDEX IF NOT EXISTS "ActivityBookingRequest_eventId_createdAt_idx"
  ON "ActivityBookingRequest"("eventId", "createdAt");
