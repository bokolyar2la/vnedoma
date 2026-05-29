ALTER TABLE "Activity"
ADD COLUMN "activityType" TEXT,
ADD COLUMN "socialLevel" TEXT,
ADD COLUMN "needsCheck" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "editorComment" TEXT;
