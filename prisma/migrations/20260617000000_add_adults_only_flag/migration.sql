ALTER TABLE "Activity" ADD COLUMN "isAdultsOnly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Activity" ADD COLUMN "priceNote" TEXT;
ALTER TABLE "OrganizerEditRequest" ADD COLUMN "isAdultsOnly" BOOLEAN;
ALTER TABLE "OrganizerEditRequest" ADD COLUMN "priceNote" TEXT;
