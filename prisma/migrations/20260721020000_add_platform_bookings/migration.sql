DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ActivityBookingStatus') THEN
    CREATE TYPE "ActivityBookingStatus" AS ENUM ('pending', 'contacted', 'cancelled');
  END IF;
END $$;

ALTER TABLE "OrganizerAccount"
  ADD COLUMN IF NOT EXISTS "notificationEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "notificationTelegram" TEXT,
  ADD COLUMN IF NOT EXISTS "platformBookingEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "platformBookingDiscountText" TEXT DEFAULT 'Промокод ВЛЮДИ: 10% скидка';

CREATE TABLE IF NOT EXISTS "ActivityBookingRequest" (
  "id" SERIAL PRIMARY KEY,
  "activityId" INTEGER NOT NULL,
  "organizerAccountId" INTEGER,
  "name" TEXT NOT NULL,
  "contact" TEXT NOT NULL,
  "message" TEXT,
  "promoCode" TEXT DEFAULT 'ВЛЮДИ',
  "discountText" TEXT,
  "status" "ActivityBookingStatus" NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ActivityBookingRequest_activityId_createdAt_idx"
  ON "ActivityBookingRequest"("activityId", "createdAt");

CREATE INDEX IF NOT EXISTS "ActivityBookingRequest_organizerAccountId_status_idx"
  ON "ActivityBookingRequest"("organizerAccountId", "status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ActivityBookingRequest_activityId_fkey'
  ) THEN
    ALTER TABLE "ActivityBookingRequest"
      ADD CONSTRAINT "ActivityBookingRequest_activityId_fkey"
      FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ActivityBookingRequest_organizerAccountId_fkey'
  ) THEN
    ALTER TABLE "ActivityBookingRequest"
      ADD CONSTRAINT "ActivityBookingRequest_organizerAccountId_fkey"
      FOREIGN KEY ("organizerAccountId") REFERENCES "OrganizerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
