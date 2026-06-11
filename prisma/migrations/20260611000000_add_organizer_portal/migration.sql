CREATE TYPE "OrganizerRequestStatus" AS ENUM ('pending', 'approved', 'rejected', 'done');

CREATE TABLE "OrganizerAccount" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizerAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizerAccess" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "organizerId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizerAccess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizerClaimRequest" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "organizerId" INTEGER NOT NULL,
    "activityId" INTEGER,
    "status" "OrganizerRequestStatus" NOT NULL DEFAULT 'pending',
    "proofUrl" TEXT,
    "message" TEXT,
    "adminComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizerClaimRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizerEditRequest" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "activityId" INTEGER NOT NULL,
    "status" "OrganizerRequestStatus" NOT NULL DEFAULT 'pending',
    "title" TEXT,
    "description" TEXT,
    "address" TEXT,
    "priceFrom" INTEGER,
    "priceTo" INTEGER,
    "isFree" BOOLEAN,
    "beginnerFriendly" BOOLEAN,
    "canComeAlone" BOOLEAN,
    "contactPhone" TEXT,
    "contactUrl" TEXT,
    "imageUrl" TEXT,
    "note" TEXT,
    "adminComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizerEditRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizerEventRequest" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "activityId" INTEGER NOT NULL,
    "status" "OrganizerRequestStatus" NOT NULL DEFAULT 'pending',
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "price" INTEGER,
    "seatsAvailable" INTEGER,
    "signupUrl" TEXT,
    "note" TEXT,
    "adminComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizerEventRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Event" ADD COLUMN "signupUrl" TEXT;

CREATE UNIQUE INDEX "OrganizerAccount_email_key" ON "OrganizerAccount"("email");
CREATE UNIQUE INDEX "OrganizerAccess_accountId_organizerId_key" ON "OrganizerAccess"("accountId", "organizerId");
CREATE INDEX "OrganizerAccess_organizerId_idx" ON "OrganizerAccess"("organizerId");
CREATE INDEX "OrganizerClaimRequest_status_idx" ON "OrganizerClaimRequest"("status");
CREATE INDEX "OrganizerClaimRequest_accountId_idx" ON "OrganizerClaimRequest"("accountId");
CREATE INDEX "OrganizerClaimRequest_organizerId_idx" ON "OrganizerClaimRequest"("organizerId");
CREATE INDEX "OrganizerEditRequest_status_idx" ON "OrganizerEditRequest"("status");
CREATE INDEX "OrganizerEditRequest_accountId_idx" ON "OrganizerEditRequest"("accountId");
CREATE INDEX "OrganizerEditRequest_activityId_idx" ON "OrganizerEditRequest"("activityId");
CREATE INDEX "OrganizerEventRequest_status_idx" ON "OrganizerEventRequest"("status");
CREATE INDEX "OrganizerEventRequest_accountId_idx" ON "OrganizerEventRequest"("accountId");
CREATE INDEX "OrganizerEventRequest_activityId_idx" ON "OrganizerEventRequest"("activityId");

ALTER TABLE "OrganizerAccess" ADD CONSTRAINT "OrganizerAccess_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "OrganizerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizerAccess" ADD CONSTRAINT "OrganizerAccess_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizerClaimRequest" ADD CONSTRAINT "OrganizerClaimRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "OrganizerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizerClaimRequest" ADD CONSTRAINT "OrganizerClaimRequest_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizerClaimRequest" ADD CONSTRAINT "OrganizerClaimRequest_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrganizerEditRequest" ADD CONSTRAINT "OrganizerEditRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "OrganizerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizerEditRequest" ADD CONSTRAINT "OrganizerEditRequest_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizerEventRequest" ADD CONSTRAINT "OrganizerEventRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "OrganizerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizerEventRequest" ADD CONSTRAINT "OrganizerEventRequest_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
