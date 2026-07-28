UPDATE "OrganizerAccount"
SET "notificationEmail" = "email"
WHERE ("notificationEmail" IS NULL OR "notificationEmail" = '')
  AND "email" IS NOT NULL
  AND "email" <> '';
