-- Deployed to Supabase Te Hice Esto, 2026-10-08.
alter table public.orders
  add column if not exists access_email_last_attempt_at timestamptz,
  add column if not exists access_email_error text;
comment on column public.orders.access_email_sent_at is 'Email provider accepted delivery request (not guaranteed inbox arrival).';
comment on column public.orders.access_email_last_attempt_at is 'Last automated transactional access email attempt, used for rate limiting retries.';
comment on column public.orders.access_email_error is 'Safe last delivery failure code; no personal information.';
