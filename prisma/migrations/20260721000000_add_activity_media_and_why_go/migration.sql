DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ActivityMediaType') THEN
        CREATE TYPE "ActivityMediaType" AS ENUM ('image', 'video');
    END IF;
END $$;

ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "whyGoText" TEXT;
ALTER TABLE "OrganizerEditRequest" ADD COLUMN IF NOT EXISTS "whyGoText" TEXT;

CREATE TABLE IF NOT EXISTS "ActivityMedia" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "type" "ActivityMediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ActivityMedia_activityId_position_idx" ON "ActivityMedia"("activityId", "position");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ActivityMedia_activityId_fkey'
    ) THEN
        ALTER TABLE "ActivityMedia"
        ADD CONSTRAINT "ActivityMedia_activityId_fkey"
        FOREIGN KEY ("activityId") REFERENCES "Activity"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
