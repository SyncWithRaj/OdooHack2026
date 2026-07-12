-- Enable btree_gist extension for booking overlap prevention
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add database-level overlap prevention constraint on resource_bookings
-- This EXCLUDE constraint automatically rejects any INSERT/UPDATE where the same 
-- asset_id has overlapping timestamps for active ('upcoming' or 'ongoing') bookings.
-- Note: This runs AFTER Prisma migration creates the table.
-- Run manually: psql -U postgres -d odoohack -f prisma/booking_constraint.sql

-- Drop if exists first to make this idempotent
-- ALTER TABLE resource_bookings DROP CONSTRAINT IF EXISTS prevent_double_booking;

-- Unfortunately, Prisma doesn't support EXCLUDE constraints natively.
-- The application-level check in booking.service.js handles this, but you can
-- add this constraint manually for an extra safety net:
--
-- ALTER TABLE resource_bookings ADD CONSTRAINT prevent_double_booking 
--   EXCLUDE USING gist (
--     asset_id WITH =, 
--     tsrange(start_time, end_time) WITH &&
--   ) WHERE (status IN ('upcoming', 'ongoing'));
--
-- Note: The WHERE clause in EXCLUDE requires a partial exclusion which may not
-- work with all PG versions. The app-level check is the primary defense.

-- Add CHECK constraint for time ordering
ALTER TABLE resource_bookings ADD CONSTRAINT IF NOT EXISTS chk_time_order 
  CHECK (end_time > start_time);
