DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ActivityStatType') THEN
    CREATE TYPE "ActivityStatType" AS ENUM ('view', 'signup_click', 'nearest_event_click');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "ActivityStatEvent" (
  "id" SERIAL NOT NULL,
  "activityId" INTEGER NOT NULL,
  "type" "ActivityStatType" NOT NULL,
  "path" TEXT,
  "referrer" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityStatEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ActivityStatEvent_activityId_type_createdAt_idx"
  ON "ActivityStatEvent"("activityId", "type", "createdAt");

CREATE INDEX IF NOT EXISTS "ActivityStatEvent_createdAt_idx"
  ON "ActivityStatEvent"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ActivityStatEvent_activityId_fkey'
  ) THEN
    ALTER TABLE "ActivityStatEvent"
      ADD CONSTRAINT "ActivityStatEvent_activityId_fkey"
      FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
