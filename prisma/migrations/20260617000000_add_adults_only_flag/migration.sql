ALTER TABLE "Activity" ADD COLUMN "isAdultsOnly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrganizerEditRequest" ADD COLUMN "isAdultsOnly" BOOLEAN;
