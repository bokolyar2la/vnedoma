-- AlterTable
ALTER TABLE "Activity" ADD COLUMN "submittedByOrganizer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "submitterContact" TEXT;
