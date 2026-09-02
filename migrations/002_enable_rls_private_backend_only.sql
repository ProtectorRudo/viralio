-- VIRALIO production uses a private PostgreSQL server connection.
-- No direct PostgREST/anon/authenticated access is required for these tables.
-- Enabling RLS without public policies intentionally denies Supabase API roles.
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
