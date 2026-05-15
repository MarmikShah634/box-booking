-- Run this AFTER prisma migrate dev completes.
-- Prisma does not support partial unique indexes on multi-column combinations.

CREATE UNIQUE INDEX IF NOT EXISTS booking_active_slot_idx
  ON "Booking" ("boxId","slotDate","slotHour")
  WHERE status IN ('CONFIRMED','COMPLETED');

CREATE INDEX IF NOT EXISTS booking_owner_created_idx
  ON "Booking" ("ownerId","createdAt" DESC);

-- slot_hold_active_idx omitted: now() is VOLATILE, cannot be used in index predicate.
-- The @@index([expiresAt]) in schema.prisma covers the hold-sweeper query.
