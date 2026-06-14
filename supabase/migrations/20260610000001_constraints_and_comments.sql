-- Prevent duplicate applications from the same email for the same committee.
-- On conflict (same email + committee), do nothing silently so the UI can
-- show a friendly message without leaking whether the email already exists.
ALTER TABLE public.applications
  ADD CONSTRAINT applications_email_committee_unique
  UNIQUE (email, committee_id);

-- Prevent double-booking the same date + time slot.
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_date_slot_unique
  UNIQUE (booking_date, time_slot);

-- IMPORTANT: has_role() is a SECURITY DEFINER function intentionally
-- granted only to service_role (see migration 20260603092223).
-- RLS policies call it as the definer, so it always works at the DB level.
-- However, if you write raw SQL in the Supabase dashboard (which runs as
-- `authenticated`), calling has_role() directly will fail with
-- "permission denied". Use the service-role SQL editor or supabase CLI
-- for any manual queries that need role checks.
COMMENT ON FUNCTION public.has_role(UUID, public.app_role) IS
  'SECURITY DEFINER. Only callable by service_role. Used inside RLS policies.';
