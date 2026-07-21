ALTER TABLE "ActivityBookingRequest"
  ADD COLUMN IF NOT EXISTS "viewedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "ActivityBookingRequest_organizerAccountId_viewedAt_idx"
  ON "ActivityBookingRequest"("organizerAccountId", "viewedAt");
